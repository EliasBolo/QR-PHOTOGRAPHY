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
import { Trash2 } from "lucide-react"

interface DeleteEventDialogProps {
  eventId: string
  eventName: string
  onDelete: (eventId: string) => void
}

export function DeleteEventDialog({ eventId, eventName, onDelete }: DeleteEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const clearAllCaches = async () => {
    console.log("Clearing all caches for event:", eventId)

    // Clear localStorage QR codes for both encoded and decoded versions
    const qrKey = `qr-code-${eventId}`
    const decodedQrKey = `qr-code-${decodeURIComponent(eventId)}`
    localStorage.removeItem(qrKey)
    localStorage.removeItem(decodedQrKey)

    // Clear any other related localStorage items
    Object.keys(localStorage).forEach((key) => {
      if (key.includes(eventId) || key.includes(decodeURIComponent(eventId))) {
        localStorage.removeItem(key)
        console.log(`Removed localStorage: ${key}`)
      }
    })

    // Force clear all browser caches
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        console.log("Cleared all browser caches")
      } catch (error) {
        console.error("Error clearing caches:", error)
      }
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log(`Starting deletion process for event: "${eventId}"`)

      // First, clear all local caches
      await clearAllCaches()

      // Properly encode the event ID for the URL
      const encodedEventId = encodeURIComponent(eventId)

      // Call the delete API with aggressive cache busting
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)

      const response = await fetch(`/api/events/${encodedEventId}?t=${timestamp}&r=${randomId}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "X-Requested-With": "XMLHttpRequest",
        },
      })

      const result = await response.json()
      console.log("Delete API response:", result)

      // Always treat as success if the API returns success: true
      if (result.success) {
        let message = `Event "${eventName}" deleted successfully!`

        if (result.alreadyDeleted) {
          message = `Event "${eventName}" was already deleted.`
        } else if (result.deletedFiles > 0) {
          message = `Event "${eventName}" deleted successfully! Removed ${result.deletedFiles} files.`
        } else if (result.fallback) {
          message = `Event "${eventName}" deletion completed (may have been already deleted).`
        }

        console.log("Deletion successful:", message)

        // Close dialog immediately
        setIsOpen(false)

        // Clear caches again after deletion
        await clearAllCaches()

        // Call the parent's onDelete function to update UI
        onDelete(eventId)

        // Show success message
        alert(message)
      } else {
        throw new Error(result.error || "Failed to delete event")
      }
    } catch (error) {
      console.error("Error deleting event:", error)

      // Even on error, we'll remove from UI and show a warning
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const shouldProceed = confirm(
        `There was an issue deleting the event: ${errorMessage}\n\nWould you like to remove it from the list anyway? (The files may have been deleted already)`,
      )

      if (shouldProceed) {
        await clearAllCaches()
        onDelete(eventId)
        setIsOpen(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Event</DialogTitle>
          <DialogDescription className="text-gray-600">
            Are you sure you want to delete "{eventName}"?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    This action cannot be undone. This will permanently delete the event and all associated photos from
                    your cloud storage.
                  </p>
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
            {isDeleting ? "Deleting..." : "Delete Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
