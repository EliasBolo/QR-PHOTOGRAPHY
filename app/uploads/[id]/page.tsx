"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoHeader } from "@/components/logo-header"
import { Archive, AlertCircle } from "lucide-react"
import { PhotoGrid } from "@/components/photo-grid"
import { usePhotos } from "@/hooks/use-photos"
import { useState } from "react"

export default function EventUploadsPage({ params }: { params: { id: string } }) {
  const { photos, loading, loadPhotos, deletePhoto } = usePhotos(params.id)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState("")
  const [eventName, setEventName] = useState<string>("")

  useEffect(() => {
    const decodedId = decodeURIComponent(params.id)
    const name = decodedId
      .split("-")
      .slice(0, -1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    setEventName(name)

    loadPhotos()
  }, [params.id, loadPhotos])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    const totalBytes = photos.reduce((sum, photo) => sum + photo.size, 0)
    return formatFileSize(totalBytes)
  }

  const downloadAllPhotos = async () => {
    if (photos.length === 0) {
      alert("No photos to download")
      return
    }

    setDownloading(true)
    setDownloadProgress(`Preparing download of ${photos.length} files...`)

    try {
      console.log(`Starting download of ${photos.length} files for event: ${params.id}`)

      const encodedId = encodeURIComponent(params.id)
      const response = await fetch(`/api/events/${encodedId}/download`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      setDownloadProgress("Creating ZIP file...")

      const contentDisposition = response.headers.get("content-disposition")
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${eventName}-Photos.zip`

      const contentLength = response.headers.get("content-length")
      const totalSize = contentLength ? Number.parseInt(contentLength, 10) : 0

      setDownloadProgress(
        `Downloading ZIP file${totalSize > 0 ? ` (${(totalSize / 1024 / 1024).toFixed(1)}MB)` : ""}...`,
      )

      const blob = await response.blob()
      console.log(`ZIP file downloaded: ${blob.size} bytes`)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

      setDownloadProgress("Download complete!")

      setTimeout(() => {
        alert(`Successfully downloaded ${photos.length} files as ${filename}`)
        setDownloadProgress("")
      }, 500)
    } catch (error) {
      console.error("Error downloading photos:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to download photos: ${errorMessage}`)
      setDownloadProgress("")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
        <LogoHeader />
        <div className="text-white">Loading photos...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-black">
      <LogoHeader />

      <Card className="w-full max-w-6xl bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{eventName} Photos</CardTitle>
          <CardDescription className="text-zinc-400">
            {photos.length} files uploaded to cloud storage • Total size: {getTotalSize()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {downloading && downloadProgress && (
            <div className="mb-4 bg-blue-900/20 text-blue-400 p-3 rounded-md text-sm border border-blue-800 flex items-center gap-2">
              <Archive className="h-4 w-4 animate-spin" />
              {downloadProgress}
            </div>
          )}

          {photos.length === 0 ? (
            <div className="border rounded-lg p-8 text-center border-zinc-800">
              <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No photos uploaded yet. Share the QR code to start collecting photos!</p>
            </div>
          ) : (
            <PhotoGrid photos={photos} eventId={params.id} onDeletePhoto={deletePhoto} />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent">
            <Link href="/events">Back to Events</Link>
          </Button>
          <div className="flex gap-2">
            {photos.length > 0 && (
              <Button
                onClick={downloadAllPhotos}
                disabled={downloading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Archive className={`mr-2 h-4 w-4 ${downloading ? "animate-spin" : ""}`} />
                {downloading ? "Creating ZIP..." : `Download All (${photos.length} files)`}
              </Button>
            )}
            <Button asChild className="bg-white hover:bg-zinc-200 text-black">
              <Link href={`/events/${params.id}/qr`}>Manage QR Code</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
