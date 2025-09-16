"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { generateQRCode } from "@/lib/qr-utils"
import { LogoHeader } from "@/components/logo-header"
import { Download, Printer, Trash2, RefreshCw, QrCode } from "lucide-react"
import { generatePDF } from "@/lib/pdf-utils"

interface StoredQRCode {
  eventId: string
  eventName: string
  qrCodeSVG: string
  uploadUrl: string
  createdAt: string
}

export default function ManageQRCodePage({ params }: { params: { id: string } }) {
  const [storedQR, setStoredQR] = useState<StoredQRCode | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [eventName, setEventName] = useState<string>("")
  const [baseUrl, setBaseUrl] = useState<string>("")
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    loadStoredQRCode()
    loadEventName()
  }, [params.id])

  const loadEventName = () => {
    // Extract event name from ID (e.g., "smith-wedding-abc123" -> "Smith Wedding")
    const name = params.id
      .split("-")
      .slice(0, -1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    setEventName(name)
  }

  const loadStoredQRCode = () => {
    // In a real implementation, this would fetch from your database
    const stored = localStorage.getItem(`qr-code-${params.id}`)
    if (stored) {
      setStoredQR(JSON.parse(stored))
    }
  }

  const saveQRCode = (qrData: StoredQRCode) => {
    // In a real implementation, this would save to your database
    localStorage.setItem(`qr-code-${params.id}`, JSON.stringify(qrData))
    setStoredQR(qrData)
  }

  const generateNewQRCode = async () => {
    setIsGenerating(true)
    try {
      const uploadUrl = `${baseUrl}/upload/${params.id}`
      const qrCodeSVG = await generateQRCode(uploadUrl)

      const newQRData: StoredQRCode = {
        eventId: params.id,
        eventName,
        qrCodeSVG,
        uploadUrl,
        createdAt: new Date().toISOString(),
      }

      saveQRCode(newQRData)
    } catch (error) {
      console.error("Error generating QR code:", error)
      alert("Failed to generate QR code. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    if (!storedQR) return

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${storedQR.eventName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px;
                margin: 0;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .qr-container {
                border: 2px solid #000;
                padding: 20px;
                border-radius: 8px;
                background: white;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
                color: #666;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${storedQR.eventName}</h1>
              <p>Scan to Upload Photos</p>
            </div>
            <div class="qr-container">
              ${storedQR.qrCodeSVG}
            </div>
            <div class="footer">
              <p>Upload URL: ${storedQR.uploadUrl}</p>
              <p>Generated: ${new Date(storedQR.createdAt).toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadPDF = async () => {
    if (!storedQR) return

    try {
      await generatePDF({
        eventName: storedQR.eventName,
        qrCodeSVG: storedQR.qrCodeSVG,
        uploadUrl: storedQR.uploadUrl,
        createdAt: storedQR.createdAt,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const handleDeleteQRCode = () => {
    if (confirm(`Are you sure you want to delete the QR code for ${eventName}? This action cannot be undone.`)) {
      localStorage.removeItem(`qr-code-${params.id}`)
      setStoredQR(null)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <LogoHeader />

      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Manage QR Code - {eventName}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Generate, preview, print, or download your event QR code
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {storedQR ? (
            <>
              {/* QR Code Preview */}
              <div className="flex flex-col items-center gap-4">
                <div
                  ref={qrRef}
                  className="border rounded-lg p-6 bg-white flex items-center justify-center"
                  style={{ width: "300px", height: "300px" }}
                  dangerouslySetInnerHTML={{ __html: storedQR.qrCodeSVG }}
                />
                <div className="text-center">
                  <p className="text-sm text-zinc-300 mb-2">
                    Users can scan this QR code to upload photos for {eventName}
                  </p>
                  <p className="text-xs text-zinc-500">Created: {new Date(storedQR.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-zinc-500 break-all mt-1">URL: {storedQR.uploadUrl}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print QR Code
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={generateNewQRCode}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                  disabled={isGenerating}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  {isGenerating ? "Generating..." : "Regenerate"}
                </Button>
                <Button
                  onClick={handleDeleteQRCode}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete QR Code
                </Button>
              </div>
            </>
          ) : (
            /* No QR Code - Generate New */
            <div className="text-center space-y-4">
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-12 flex flex-col items-center justify-center">
                <QrCode className="h-16 w-16 text-zinc-600 mb-4" />
                <p className="text-zinc-400 mb-2">No QR code found for this event</p>
                <p className="text-sm text-zinc-500">Generate a new QR code to get started</p>
              </div>
              <Button
                onClick={generateNewQRCode}
                className="bg-white hover:bg-zinc-200 text-black"
                disabled={isGenerating}
              >
                <QrCode className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Generating QR Code..." : "Generate QR Code"}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
            <Link href="/events">Back to Events</Link>
          </Button>
          <Button asChild className="bg-white hover:bg-zinc-200 text-black">
            <Link href={`/uploads/${params.id}`}>View Uploaded Photos</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
