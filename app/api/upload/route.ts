import { uploadFile } from "@/lib/google-drive"
import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (same as in other files)
const events = new Map<
  string,
  {
    id: string
    name: string
    createdAt: string
    folderId: string
    folderUrl: string
  }
>()

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Starting Google Drive upload...")

    const formData = await request.formData()
    const sessionId = formData.get("sessionId") as string

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Get event data
    const eventData = events.get(sessionId)

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`📁 Uploading to Google Drive folder: ${eventData.folderId}`)

    const uploadResults = []
    const errors = []

    // Process each file
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file-") && value instanceof File) {
        const file = value as File
        const fileSizeMB = file.size / (1024 * 1024)

        console.log(`📁 Processing: ${file.name} (${fileSizeMB.toFixed(2)}MB, ${file.type})`)

        // Validate file type
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")

        if (!isImage && !isVideo) {
          const error = `${file.name}: Only images and videos are allowed`
          console.error(`❌ ${error}`)
          errors.push(error)
          continue
        }

        try {
          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Create unique filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
          const fileExtension = file.name.split(".").pop() || ""
          const baseName = file.name.replace(`.${fileExtension}`, "").replace(/[^a-zA-Z0-9-_]/g, "-")
          const filename = `${timestamp}-${baseName}.${fileExtension}`

          console.log(`⬆️ Uploading to Google Drive: ${filename}`)

          // Upload to Google Drive
          const uploadedFile = await uploadFile(filename, buffer, file.type, eventData.folderId)

          uploadResults.push({
            filename: file.name,
            success: true,
            fileId: uploadedFile.id,
            url: `https://drive.google.com/uc?export=view&id=${uploadedFile.id}`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${uploadedFile.id}`,
            size: file.size,
            type: file.type,
            sizeMB: fileSizeMB.toFixed(2),
            webViewLink: uploadedFile.webViewLink,
          })

          console.log(`✅ Successfully uploaded ${file.name} to Google Drive`)
        } catch (error) {
          console.error(`❌ Error uploading ${file.name}:`, error)
          errors.push({
            filename: file.name,
            error: error instanceof Error ? error.message : "Upload failed",
            size: fileSizeMB.toFixed(1) + "MB",
          })
        }
      }
    }

    const totalSizeMB = uploadResults.reduce((sum, result) => sum + Number.parseFloat(result.sizeMB), 0)

    const response = {
      success: uploadResults.length > 0,
      message:
        uploadResults.length > 0
          ? `Successfully uploaded ${uploadResults.length} file${uploadResults.length !== 1 ? "s" : ""} to Google Drive`
          : "No files were uploaded",
      results: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadResults.length,
      totalErrors: errors.length,
      totalSizeMB: totalSizeMB,
      folderId: eventData.folderId,
      folderUrl: eventData.folderUrl,
    }

    console.log(`✅ Upload complete: ${uploadResults.length} successful, ${errors.length} failed`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Critical error in upload handler:", error)

    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please try again",
      },
      { status: 500 },
    )
  }
}
