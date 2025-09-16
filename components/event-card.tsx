"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteEventDialog } from "@/components/delete-event-dialog"
import { RenameEventDialog } from "@/components/rename-event-dialog"
import type { Event } from "@/hooks/use-events"

interface EventCardProps {
  event: Event
  onDelete: (eventId: string) => void
  onRename: (eventId: string, newName: string) => void
}

export function EventCard({ event, onDelete, onRename }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">{event.name}</CardTitle>
        <CardDescription className="text-zinc-400">Created on {formatDate(event.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-300">
          {event.photoCount} photo{event.photoCount !== 1 ? "s" : ""} uploaded
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
          >
            <Link href={`/events/${event.id}/qr`}>Manage QR Code</Link>
          </Button>
          <RenameEventDialog eventId={event.id} currentName={event.name} onRename={onRename} />
          <DeleteEventDialog eventId={event.id} eventName={event.name} onDelete={onDelete} />
        </div>
        <Button asChild size="sm" className="bg-white hover:bg-zinc-200 text-black">
          <Link href={`/uploads/${event.id}`}>View Photos</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
