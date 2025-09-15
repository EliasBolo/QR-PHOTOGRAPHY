export async function uploadPhotos(
  files: File[],
  sessionId: string,
  onProgress?: (progress: {
    currentFile: number
    totalFiles: number
    currentFileName: string
    fileProgress: number
    overallProgress: number
    status: string
    uploadedFiles: number
    failedFiles: number
    currentFileSizeMB: number
    totalSizeMB: number
  }) => void,
): Promise<void> {
  const totalFiles = files.length
  const totalSizeMB = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)
  let uploadedFiles = 0
  let failedFiles = 0
  const results = []
  const errors = []

  console.log(`🚀 Starting upload of ${totalFiles} files (${totalSizeMB.toFixed(2)}MB total)`)

  // Upload files one by one to avoid overwhelming the server
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileSizeMB = file.size / (1024 * 1024)

    try {
      if (onProgress) {
        onProgress({
          currentFile: i + 1,
          totalFiles,
          currentFileName: file.name,
          fileProgress: 0,
          overallProgress: Math.round((i / totalFiles) * 100),
          status: `📤 Uploading: ${file.name} (${fileSizeMB.toFixed(1)}MB)...`,
          uploadedFiles,
          failedFiles,
          currentFileSizeMB: fileSizeMB,
          totalSizeMB,
        })
      }

      // Create FormData for this specific file
      const formData = new FormData()
      formData.append(`file-0`, file)
      formData.append("sessionId", sessionId)

      console.log(`📤 Uploading: ${file.name} (${fileSizeMB.toFixed(2)}MB)`)

      // Use enhanced XMLHttpRequest with progress tracking
      const result = await uploadFileWithProgress(
        formData,
        (fileProgress) => {
          if (onProgress) {
            onProgress({
              currentFile: i + 1,
              totalFiles,
              currentFileName: file.name,
              fileProgress,
              overallProgress: Math.round(((i + fileProgress / 100) / totalFiles) * 100),
              status: `📤 Uploading: ${file.name} (${fileSizeMB.toFixed(1)}MB)... ${fileProgress}%`,
              uploadedFiles,
              failedFiles,
              currentFileSizeMB: fileSizeMB,
              totalSizeMB,
            })
          }
        },
        fileSizeMB,
      )

      results.push(result)
      uploadedFiles++

      console.log(`✅ Upload successful: ${file.name}`)

      // Update progress for completed file
      if (onProgress) {
        onProgress({
          currentFile: i + 1,
          totalFiles,
          currentFileName: file.name,
          fileProgress: 100,
          overallProgress: Math.round(((i + 1) / totalFiles) * 100),
          status: `✅ ${file.name} uploaded successfully (${fileSizeMB.toFixed(1)}MB)`,
          uploadedFiles,
          failedFiles,
          currentFileSizeMB: fileSizeMB,
          totalSizeMB,
        })
      }
    } catch (error) {
      console.error(`❌ Error uploading ${file.name}:`, error)

      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        if (error.message.includes("413") || error.message.includes("too large")) {
          errorMessage = "File too large for server"
        } else if (error.message.includes("timeout")) {
          errorMessage = "Upload timeout"
        } else {
          errorMessage = error.message
        }
      }

      errors.push(`${file.name} (${fileSizeMB.toFixed(1)}MB): ${errorMessage}`)
      failedFiles++

      // Update progress for failed file
      if (onProgress) {
        onProgress({
          currentFile: i + 1,
          totalFiles,
          currentFileName: file.name,
          fileProgress: 0,
          overallProgress: Math.round(((i + 1) / totalFiles) * 100),
          status: `❌ Failed to upload ${file.name} (${fileSizeMB.toFixed(1)}MB)`,
          uploadedFiles,
          failedFiles,
          currentFileSizeMB: fileSizeMB,
          totalSizeMB,
        })
      }
    }

    // Delay between files to avoid overwhelming the server
    if (i < files.length - 1) {
      const delayMs = fileSizeMB > 50 ? 2000 : 1000
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // Final progress update
  if (onProgress) {
    const uploadedSizeMB = results.reduce((sum, r) => sum + (r.sizeMB ? Number.parseFloat(r.sizeMB) : 0), 0)
    onProgress({
      currentFile: totalFiles,
      totalFiles,
      currentFileName: "",
      fileProgress: 100,
      overallProgress: 100,
      status: `✅ Upload complete! ${uploadedFiles} successful (${uploadedSizeMB.toFixed(1)}MB), ${failedFiles} failed`,
      uploadedFiles,
      failedFiles,
      currentFileSizeMB: 0,
      totalSizeMB,
    })
  }

  if (errors.length > 0 && uploadedFiles === 0) {
    throw new Error(`All uploads failed: ${errors.join(", ")}`)
  }
}

// Enhanced upload function with progress tracking
function uploadFileWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void,
  fileSizeMB: number,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Set timeout based on file size - be generous for large files
    const baseTimeout = 120000 // 2 minutes base
    const sizeMultiplier = Math.min(fileSizeMB * 2000, 300000) // Up to 5 more minutes for large files
    xhr.timeout = baseTimeout + sizeMultiplier

    console.log(`⏱️ Timeout set to ${(xhr.timeout / 1000 / 60).toFixed(1)} minutes for ${fileSizeMB.toFixed(1)}MB file`)

    // Progress tracking
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress(percentComplete)
      }
    })

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          console.error("Invalid response format:", xhr.responseText)
          reject(new Error("Invalid response format"))
        }
      } else {
        console.error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`)
        if (xhr.status === 413) {
          reject(new Error("File too large for server (HTTP 413)"))
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }
    })

    // Handle errors
    xhr.addEventListener("error", () => {
      console.error("Network error during upload")
      reject(new Error("Network error occurred"))
    })

    xhr.addEventListener("timeout", () => {
      const timeoutMinutes = (xhr.timeout / 1000 / 60).toFixed(1)
      console.error(`Upload timeout after ${timeoutMinutes} minutes`)
      reject(new Error(`Upload timeout after ${timeoutMinutes} minutes`))
    })

    // Configure and send request
    xhr.open("POST", "/api/upload")
    xhr.send(formData)
  })
}
