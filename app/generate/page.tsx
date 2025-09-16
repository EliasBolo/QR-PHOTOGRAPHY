"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateQRCode } from "@/lib/qr-utils"
import { LogoHeader } from "@/components/logo-header"

export default function GenerateQRCode() {
  const router = useRouter()
  const [qrCodeData, setQrCodeData] = useState<string>("")
  const [uploadId, setUploadId] = useState<string>("")
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [eventName, setEventName] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const handleGenerateQR = async () => {
    if (!eventName.trim()) {
      alert("Please enter an event name")
      return
    }

    setIsCreating(true)

    try {
      // Create the event (this will determine the folder structure)
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventName: eventName.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to create event")
      }

      const { event } = await response.json()
      setUploadId(event.id)

      // Generate QR code for the event
      const uploadUrl = `${baseUrl}/upload/${event.id}`
      const qrCode = await generateQRCode(uploadUrl)
      setQrCodeData(qrCode)

      // Store the QR code
      const qrData = {
        eventId: event.id,
        eventName: eventName.trim(),
        qrCodeSVG: qrCode,
        uploadUrl,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(`qr-code-${event.id}`, JSON.stringify(qrData))
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Failed to create event. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleViewEvent = () => {
    if (uploadId) {
      router.push(`/events/${uploadId}/qr`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <LogoHeader />

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Create New Event</CardTitle>
          <CardDescription className="text-zinc-400">
            Create an event and generate a QR code for photo uploads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-name" className="text-white">
              Wedding/Event Name
            </Label>
            <Input
              id="session-name"
              placeholder="Smith-Johnson Wedding"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              disabled={!!qrCodeData}
            />
          </div>

          {qrCodeData ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="border rounded-lg p-4 w-full max-w-xs aspect-square flex items-center justify-center bg-white"
                dangerouslySetInnerHTML={{ __html: qrCodeData }}
              />
              <div className="text-center">
                <p className="text-sm text-zinc-300 mb-2">✅ Event created successfully!</p>
                <p className="text-xs text-zinc-500">Photos will be stored in: events/{uploadId}/</p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 w-full aspect-square flex items-center justify-center">
              <p className="text-sm text-zinc-500 text-center">
                Enter an event name and click "Create Event" to generate your QR code and cloud folder
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {qrCodeData ? (
            <>
              <Button onClick={handleViewEvent} className="w-full bg-white hover:bg-zinc-200 text-black">
                Manage QR Code & View Photos
              </Button>
              <Button asChild variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                <Link href="/events">View All Events</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleGenerateQR}
                className="w-full bg-white hover:bg-zinc-200 text-black"
                disabled={isCreating || !eventName.trim()}
              >
                {isCreating ? "Creating Event..." : "Create Event & Generate QR"}
              </Button>
              <Button asChild variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                <Link href="/">Back to Home</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
