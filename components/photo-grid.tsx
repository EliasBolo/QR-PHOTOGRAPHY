"use client"

import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FolderOpen } from "lucide-react"
import { DeletePhotoDialog } from "@/components/delete-photo-dialog"
import type { Photo } from "@/hooks/use-photos"

interface PhotoGridProps {
  photos: Photo[]
  eventId: string
  folderUrl?: string
  onDeletePhoto: (fileId: string) => void
}

export function PhotoGrid({ photos, eventId, folderUrl, onDeletePhoto }: PhotoGridProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const downloadPhoto = (downloadUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith("video/")) {
      return "🎥"
    }
    return "📷"
  }

  const isVideo = (mimeType: string) => mimeType.startsWith("video/")

  return (
    <div className="space-y-4">
      {/* Google Drive Folder Link */}
      {folderUrl && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-blue-300 font-medium">Google Drive Folder</p>
                <p className="text-blue-400 text-sm">View all files in Google Drive</p>
              </div>
            </div>
            <Button
              onClick={() => window.open(folderUrl, "_blank")}
              variant="outline"
              size="sm"
              className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Drive
            </Button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={`${photo.id}-${index}`} className="bg-zinc-800 rounded-lg overflow-hidden">
            <div className="aspect-square relative group">
              {isVideo(photo.mimeType) ? (
                <div className="w-full h-full bg-zinc-700 flex flex-col items-center justify-center text-zinc-400">
                  <div className="text-4xl mb-2">🎥</div>
                  <div className="text-xs text-center px-2">Video File</div>
                  <div className="text-xs text-center px-2 mt-1">Google Drive</div>
                </div>
              ) : (
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to direct URL if thumbnail fails
                    const target = e.target as HTMLImageElement
                    if (target.src !== photo.url) {
                      target.src = photo.url
                    }
                  }}
                />
              )}

              {/* Delete button overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <DeletePhotoDialog
                  fileId={photo.id}
                  filename={photo.filename}
                  eventId={eventId}
                  onDelete={onDeletePhoto}
                  isVideo={isVideo(photo.mimeType)}
                />
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm text-white truncate" title={photo.filename}>
                {getFileType(photo.mimeType)} {photo.filename}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {formatFileSize(photo.size)} • {new Date(photo.uploadedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-zinc-700 text-white hover:bg-zinc-700 bg-transparent"
                  onClick={() => downloadPhoto(photo.downloadUrl, photo.filename)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-700 bg-transparent"
                  onClick={() => window.open(photo.webViewLink || photo.url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
