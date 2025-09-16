"use client"

import { useState, useCallback } from "react"

export interface Photo {
  id: string
  filename: string
  url: string
  downloadUrl: string
  thumbnailUrl: string
  uploadedAt: string
  size: number
  mimeType: string
  webViewLink: string
}

export function usePhotos(eventId: string) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [folderId, setFolderId] = useState<string>("")
  const [folderUrl, setFolderUrl] = useState<string>("")

  const loadPhotos = useCallback(async () => {
    try {
      const encodedId = encodeURIComponent(eventId)
      const response = await fetch(`/api/events/${encodedId}/photos`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
        setFolderId(data.folderId || "")
        setFolderUrl(data.folderUrl || "")
        console.log(`Loaded ${data.photos?.length || 0} photos from Google Drive`)
      }
    } catch (error) {
      console.error("Error loading photos:", error)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  const deletePhoto = useCallback(
    async (fileId: string) => {
      console.log(`🗑️ Removing photo from Google Drive: ${fileId}`)

      // Optimistic update
      setPhotos((prevPhotos) => {
        const filtered = prevPhotos.filter((photo) => photo.id !== fileId)
        console.log(`Filtered photos (removed ${fileId}):`, filtered.length)
        return filtered
      })

      // Refresh after deletion
      setTimeout(() => {
        console.log("Refreshing photos list after deletion")
        loadPhotos()
      }, 1000)
    },
    [loadPhotos],
  )

  const refreshPhotos = useCallback(() => {
    setLoading(true)
    loadPhotos()
  }, [loadPhotos])

  return {
    photos,
    loading,
    folderId,
    folderUrl,
    loadPhotos,
    deletePhoto,
    refreshPhotos,
  }
}
