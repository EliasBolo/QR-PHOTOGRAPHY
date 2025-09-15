"use client"

import { Button } from "@/components/ui/button"
import { X, Clock } from "lucide-react"

interface FilePreviewProps {
  files: File[]
  previews: string[]
  onRemoveFile: (index: number) => void
}

export function FilePreview({ files, previews, onRemoveFile }: FilePreviewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
    return formatFileSize(totalBytes)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) {
      return "🎥"
    }
    return "📷"
  }

  const getFileSizeWarning = (file: File) => {
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 80) return "🚫" // Too large
    if (sizeMB > 50) return "⚠️" // Large file - might fail
    if (sizeMB > 25) return "📊" // Medium file
    return ""
  }

  const getEstimatedUploadTime = () => {
    const totalMB = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)
    const estimatedMinutes = Math.ceil(totalMB / 10) // Assume 10MB/minute

    if (estimatedMinutes < 1) return "< 1 minute"
    if (estimatedMinutes === 1) return "~1 minute"
    return `~${estimatedMinutes} minutes`
  }

  const getVideoStats = () => {
    const videos = files.filter((f) => f.type.startsWith("video/"))
    const tooLargeFiles = files.filter((f) => f.size > 80 * 1024 * 1024)
    return {
      total: videos.length,
      tooLarge: tooLargeFiles.length,
    }
  }

  const videoStats = getVideoStats()

  return (
    <>
      <div className="text-sm text-zinc-300 flex justify-between items-center">
        <span>
          {files.length} files selected
          {videoStats.total > 0 && (
            <span className="text-purple-400 ml-2">
              ({videoStats.total} video{videoStats.total !== 1 ? "s" : ""})
            </span>
          )}
          {videoStats.tooLarge > 0 && <span className="text-red-400 ml-2">({videoStats.tooLarge} too large)</span>}
        </span>
        <div className="text-right">
          <div>Total: {getTotalSize()}</div>
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Est. time: {getEstimatedUploadTime()}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square">
            {files[index]?.type.startsWith("video/") ? (
              <div className="w-full h-full bg-zinc-800 rounded-md flex flex-col items-center justify-center text-zinc-400">
                <div className="text-2xl mb-1">🎥</div>
                <div className="text-xs text-center px-1">{files[index]?.name.substring(0, 15)}...</div>
                <div className="text-xs">{formatFileSize(files[index]?.size || 0)}</div>
                <div className="text-xs text-blue-400 mt-1">API Route</div>
              </div>
            ) : (
              <img
                src={preview || "/placeholder.svg"}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover rounded-md"
              />
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => onRemoveFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded flex items-center gap-1">
              {getFileIcon(files[index])}
              {getFileSizeWarning(files[index])}
              {formatFileSize(files[index]?.size || 0)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
