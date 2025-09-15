"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoHeader } from "@/components/logo-header"

export default function UploadsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <LogoHeader />

      <Card className="w-full max-w-4xl bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Uploaded Photos</CardTitle>
          <CardDescription className="text-zinc-400">
            View and manage photos uploaded through your QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 text-center border-zinc-800">
            <p className="text-zinc-400">
              This page would display the photos uploaded to your cloud storage. Navigate to specific events to view
              their photos.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild className="bg-white hover:bg-zinc-200 text-black">
            <Link href="/generate">Generate New QR Code</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
