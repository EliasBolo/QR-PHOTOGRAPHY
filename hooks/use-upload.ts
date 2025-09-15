"use client"

import { useState, useCallback } from "react"
import { uploadPhotos } from "@/lib/upload-utils"

export interface UploadProgress {
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
}

export function useUpload(sessionId: string) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      return `${file.name}: Only images and videos are allowed (detected: ${file.type})`
    }

    const sizeMB = file.size / (1024 * 1024)

    if (sizeMB > 100) {
      return `${file.name}: File too large (${sizeMB.toFixed(1)}MB). Please keep files under 100MB.`
    }

    if (file.size === 0) {
      return `${file.name}: File appears to be empty or corrupted`
    }

    return null
  }, [])

  const addFiles = useCallback(
    (newFiles: File[]) => {
      console.log(`📁 Selected ${newFiles.length} files`)

      const validationErrors: string[] = []
      const validFiles: File[] = []

      newFiles.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          validationErrors.push(error)
        } else {
          validFiles.push(file)
        }
      })

      if (validationErrors.length > 0) {
        setError(validationErrors.join("\n"))
        return
      }

      setError(null)
      setSelectedFiles((prev) => [...prev, ...validFiles])

      // Generate previews
      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    },
    [validateFile],
  )

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    setError(null)
  }, [])

  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload")
      return
    }

    console.log(`🚀 Starting upload of ${selectedFiles.length} files`)

    setError(null)
    setIsUploading(true)

    const totalSizeMB = selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)
    const videoCount = selectedFiles.filter((f) => f.type.startsWith("video/")).length

    setUploadProgress({
      currentFile: 0,
      totalFiles: selectedFiles.length,
      currentFileName: "",
      fileProgress: 0,
      overallProgress: 0,
      status: `🚀 Starting upload of ${selectedFiles.length} files (${totalSizeMB.toFixed(1)}MB)${videoCount > 0 ? ` including ${videoCount} video${videoCount !== 1 ? "s" : ""}` : ""}...`,
      uploadedFiles: 0,
      failedFiles: 0,
      currentFileSizeMB: 0,
      totalSizeMB,
    })

    try {
      await uploadPhotos(selectedFiles, sessionId, (progress) => {
        setUploadProgress(progress)
      })

      setTimeout(() => {
        setUploadComplete(true)
        setUploadProgress(null)
      }, 1000)
    } catch (err) {
      console.error("Upload error:", err)

      let errorMessage = "Failed to upload files. Please try again."
      if (err instanceof Error) {
        if (err.message.includes("413") || err.message.includes("too large")) {
          errorMessage = `❌ File Too Large Error (HTTP 413)\n\nYour file is too large for the server to handle.\n\nSolutions:\n• Try compressing the video to under 50MB\n• Use a video compression tool or app\n• Upload smaller files one at a time\n\nError details: ${err.message}`
        } else if (err.message.includes("timeout")) {
          errorMessage = `⏱️ Upload Timeout\n\nThe upload took too long to complete.\n\nSolutions:\n• Check your internet connection\n• Try uploading during off-peak hours\n• Upload one file at a time\n\nError details: ${err.message}`
        } else {
          errorMessage = `❌ Upload Error\n\n${err.message}\n\nSolutions:\n• Try uploading again\n• Upload one file at a time\n• Check your internet connection`
        }
      }

      setError(errorMessage)
      setUploadProgress(null)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFiles, sessionId])

  const resetUpload = useCallback(() => {
    setSelectedFiles([])
    setPreviews([])
    setUploadComplete(false)
    setError(null)
    setUploadProgress(null)
  }, [])

  return {
    selectedFiles,
    previews,
    isUploading,
    uploadComplete,
    uploadProgress,
    error,
    addFiles,
    removeFile,
    startUpload,
    resetUpload,
    setError,
  }
}
