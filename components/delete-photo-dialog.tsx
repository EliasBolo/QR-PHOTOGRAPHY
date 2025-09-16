"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, AlertTriangle } from "lucide-react"

interface DeletePhotoDialogProps {
  fileId: string
  filename: string
  eventId: string
  onDelete: (fileId: string) => void
  isVideo?: boolean
}

export function DeletePhotoDialog({ fileId, filename, eventId, onDelete, isVideo = false }: DeletePhotoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log(`🗑️ Deleting ${isVideo ? "video" : "photo"}: ${fileId} from event: ${eventId}`)

      const encodedEventId = encodeURIComponent(eventId)
      const encodedFileId = encodeURIComponent(fileId)

      const response = await fetch(`/api/events/${encodedEventId}/photos/${encodedFileId}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      const result = await response.json()
      console.log("Delete API response:", result)

      if (result.success) {
        console.log(`✅ Successfully deleted: ${filename}`)

        // Close dialog immediately
        setIsOpen(false)

        // Call the parent's onDelete function to update UI
        onDelete(fileId)

        // Show success message
        alert(`✅ ${isVideo ? "Video" : "Photo"} "${filename}" deleted from Google Drive!`)
      } else {
        throw new Error(result.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`❌ Failed to delete ${isVideo ? "video" : "photo"}: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const fileType = isVideo ? "video" : "photo"
  const displayName = filename.length > 30 ? `${filename.substring(0, 30)}...` : filename

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white opacity-90 hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete {fileType} from Google Drive
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Are you sure you want to delete this {fileType} from Google Drive?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{isVideo ? "🎥" : "📷"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={filename}>
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">Stored in Google Drive</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This action cannot be undone. This will permanently delete the {fileType} from Google Drive.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting from Drive..." : `Delete ${fileType}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
