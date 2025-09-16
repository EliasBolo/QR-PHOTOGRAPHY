"use client"

import { useState, useEffect, useCallback } from "react"
import { generateQRCode } from "@/lib/qr-utils"

interface StoredQRCode {
  eventId: string
  eventName: string
  qrCodeSVG: string
  uploadUrl: string
  createdAt: string
}

export function useQRCode(eventId: string, eventName: string) {
  const [storedQR, setStoredQR] = useState<StoredQRCode | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [baseUrl, setBaseUrl] = useState<string>("")

  useEffect(() => {
    setBaseUrl(window.location.origin)
    loadStoredQRCode()
  }, [eventId])

  const loadStoredQRCode = useCallback(() => {
    const stored = localStorage.getItem(`qr-code-${eventId}`)
    if (stored) {
      setStoredQR(JSON.parse(stored))
    }
  }, [eventId])

  const saveQRCode = useCallback(
    (qrData: StoredQRCode) => {
      localStorage.setItem(`qr-code-${eventId}`, JSON.stringify(qrData))
      setStoredQR(qrData)
    },
    [eventId],
  )

  const generateNewQRCode = useCallback(async () => {
    setIsGenerating(true)
    try {
      const uploadUrl = `${baseUrl}/upload/${eventId}`
      const qrCodeSVG = await generateQRCode(uploadUrl)

      const newQRData: StoredQRCode = {
        eventId,
        eventName,
        qrCodeSVG,
        uploadUrl,
        createdAt: new Date().toISOString(),
      }

      saveQRCode(newQRData)
    } catch (error) {
      console.error("Error generating QR code:", error)
      throw new Error("Failed to generate QR code")
    } finally {
      setIsGenerating(false)
    }
  }, [baseUrl, eventId, eventName, saveQRCode])

  const deleteQRCode = useCallback(() => {
    localStorage.removeItem(`qr-code-${eventId}`)
    setStoredQR(null)
  }, [eventId])

  return {
    storedQR,
    isGenerating,
    generateNewQRCode,
    deleteQRCode,
    loadStoredQRCode,
  }
}
