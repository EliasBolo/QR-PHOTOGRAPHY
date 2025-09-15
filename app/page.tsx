"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoHeader } from "@/components/logo-header"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <LogoHeader />

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Photo Upload Portal</CardTitle>
          <CardDescription className="text-zinc-400">Scan the QR code to upload photos to Google Drive</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 w-full max-w-xs aspect-square flex items-center justify-center">
            <p className="text-sm text-zinc-500 text-center">Your QR code will appear here when generated</p>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm text-zinc-400">
              This QR code will direct users to the upload page where they can select and upload photos directly to
              Google Drive.
            </p>
            <p className="text-xs text-blue-400">🔗 Powered by Google Drive API</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full bg-white hover:bg-zinc-200 text-black">
            <Link href="/generate">Create New Event QR Code</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
          >
            <Link href="/events">Manage Events</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
          >
            <Link href="/uploads">View All Uploads</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
