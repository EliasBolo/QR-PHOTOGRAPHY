"use client"

import Link from "next/link"

export function LogoHeader() {
  return (
    <div className="flex flex-col items-center mb-12">
      <Link href="/" className="flex flex-col items-center">
        <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ADOBE.jpg-NhPI1BaVIiF7FhMbjc5nCXPDupYJTR.jpeg"
            alt="Tombros Photography Logo"
            className="max-w-full max-h-full object-contain invert"
          />
        </div>
        <h1 className="text-lg font-medium text-center text-white">Live your Wedding Experience</h1>
      </Link>
    </div>
  )
}
