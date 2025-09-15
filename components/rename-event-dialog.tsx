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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, CheckCircle, AlertTriangle } from "lucide-react"

interface RenameEventDialogProps {
  eventId: string
  currentName: string
  onRename: (eventId: string, newName: string) => void
}

export function RenameEventDialog({ eventId, currentName, onRename }: RenameEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState(currentName)
  const [isRenaming, setIsRenaming] = useState(false)
  const [error, setError] = useState("")

  const clearAllCaches = async () => {
    console.log("🧹 Clearing all caches before rename...")

    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        console.log("✅ Cleared browser caches")
      } catch (error) {
        console.error("Error clearing caches:", error)
      }
    }

    Object.keys(localStorage).forEach((key) => {
      if (key.includes("event") || key.includes("qr-code")) {
        localStorage.removeItem(key)
        console.log(`🗑️ Removed localStorage: ${key}`)
      }
    })
  }

  const handleRename = async () => {
    const trimmedName = newName.trim()

    if (!trimmedName) {
      setError("Event name cannot be empty")
      return
    }

    if (trimmedName === currentName) {
      setIsOpen(false)
      return
    }

    if (trimmedName.length > 50) {
      setError("Event name must be 50 characters or less")
      return
    }

    setIsRenaming(true)
    setError("")

    try {
      console.log(`🔄 STARTING RENAME: "${eventId}" from "${currentName}" to "${trimmedName}"`)

      // Step 1: Clear caches BEFORE rename
      await clearAllCaches()

      // Step 2: Perform the rename (CRITICAL: This should NOT create a new event)
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({ newName: trimmedName }),
      })

      const result = await response.json()
      console.log("📝 Rename API response:", result)

      if (result.success) {
        console.log("✅ Rename successful - verifying no duplication")

        // CRITICAL: Verify the event ID is the same
        if (result.eventId !== eventId) {
          console.error("❌ CRITICAL ERROR: Event ID changed during rename!")
          throw new Error("Event ID changed during rename - this should not happen")
        }

        // Step 3: Clear caches AGAIN after rename
        await clearAllCaches()

        // Step 4: Update local state with SAME ID
        onRename(eventId, trimmedName) // Use original eventId, not result.eventId

        // Step 5: Close dialog
        setIsOpen(false)

        // Step 6: Show success message
        alert(
          `✅ Event renamed successfully!\n\n` +
            `Event ID: ${eventId} (unchanged)\n` +
            `New Name: "${trimmedName}"\n` +
            `Files: ${result.filesFound} (preserved)\n\n` +
            `Refreshing to show changes...`,
        )

        // Step 7: Force refresh after delay
        setTimeout(() => {
          console.log("🔄 Force refreshing page to show renamed event")
          window.location.reload()
        }, 1500)
      } else {
        throw new Error(result.error || "Failed to rename event")
      }
    } catch (error) {
      console.error("❌ Error renaming event:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      if (errorMessage.includes("Event ID changed")) {
        setError("Critical error: Event duplication detected. Please refresh and try again.")
      } else if (errorMessage.includes("already exists")) {
        setError("Event info file conflict. Please try again.")
      } else if (errorMessage.includes("not found")) {
        setError("Event not found. Please refresh the page.")
      } else {
        setError(`Failed to rename event: ${errorMessage}`)
      }
    } finally {
      setIsRenaming(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewName(currentName)
      setError("")
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent">
          <Edit2 className="mr-2 h-4 w-4" />
          Rename
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Event</DialogTitle>
          <DialogDescription>
            Change the display name for "{currentName}". The event ID and all files will remain unchanged.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                if (error) setError("")
              }}
              placeholder="Enter new event name"
              maxLength={50}
              autoFocus
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{error && <span className="text-red-500">{error}</span>}</span>
              <span>{newName.length}/50</span>
            </div>
          </div>

          {/* Critical info about the rename process */}
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Safe Rename Process</h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>✅ Event ID stays the same</p>
                  <p>✅ All photos and videos preserved</p>
                  <p>✅ QR codes continue working</p>
                  <p>✅ Only display name changes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning about duplication */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>This operation updates the existing event - it does NOT create a new one.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isRenaming}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={isRenaming || !newName.trim() || newName.trim() === currentName}>
            {isRenaming ? "Renaming (No Duplication)..." : "Rename Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
