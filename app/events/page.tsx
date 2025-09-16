"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, RefreshCw, Globe } from "lucide-react"
import { LogoHeader } from "@/components/logo-header"
import { CachePurgeButton } from "@/components/cache-purge-button"
import { EventCard } from "@/components/event-card"
import { useEvents } from "@/hooks/use-events"

export default function EventsPage() {
  const { events, loading, refreshing, loadEvents, refreshEvents, deleteEvent, renameEvent } = useEvents()

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost"

  const handleCachePurgeComplete = () => {
    console.log("🧹 Cache purge completed, refreshing events...")
    refreshEvents()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
        <LogoHeader />
        <div className="text-white flex items-center gap-2">
          Loading events...
          {isProduction && <Globe className="h-4 w-4 text-blue-400" />}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-black">
      <LogoHeader />

      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Your Events</h1>
            <Button
              onClick={refreshEvents}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            {isProduction && (
              <CachePurgeButton onPurgeComplete={handleCachePurgeComplete} variant="outline" size="sm" />
            )}

            <div className="text-xs text-zinc-500 flex items-center gap-1">
              {isProduction && <Globe className="h-3 w-3 text-blue-400" />}
              {events.length} event{events.length !== 1 ? "s" : ""}
              {isProduction && <span className="text-blue-400">(Production)</span>}
            </div>
          </div>
          <Button asChild className="bg-white hover:bg-zinc-200 text-black">
            <Link href="/generate">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Event
            </Link>
          </Button>
        </div>

        {isProduction && (
          <div className="mb-4 bg-blue-900/20 text-blue-400 p-4 rounded-md text-sm border border-blue-800">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="font-medium">Production Mode - Edge Caching Active</div>
                <div className="text-blue-300">Changes may be cached for 1-5 minutes. For instant updates:</div>
                <div className="text-xs space-y-1 text-blue-200">
                  <div>• Click "Purge Cache" button above for instant refresh</div>
                  <div>• Or use Ctrl+F5 (hard refresh) in your browser</div>
                  <div>• Changes from development appear immediately</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-zinc-400 text-center mb-4">No events found. Create your first event to get started!</p>
              <Button asChild className="bg-white hover:bg-zinc-200 text-black">
                <Link href="/generate">Create Your First Event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard
                key={`${event.id}-${Date.now()}`}
                event={event}
                onDelete={deleteEvent}
                onRename={renameEvent}
              />
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
