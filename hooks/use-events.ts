"use client"

import { useState, useCallback } from "react"

export interface Event {
  id: string
  name: string
  date: string
  photoCount: number
  createdAt: string
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = useCallback(async () => {
    try {
      console.log("🔄 Loading events with cache busting...")

      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const sessionId = Math.random().toString(36).substring(2, 15)

      const response = await fetch(
        `/api/events?t=${timestamp}&r=${randomId}&s=${sessionId}&bust=${Math.random()}&v=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
            "X-Requested-With": "XMLHttpRequest",
            "X-Timestamp": timestamp.toString(),
            "X-Cache-Bust": randomId,
            "X-Session": sessionId,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("📊 API Response:", data)

        setEvents([])
        setTimeout(() => {
          setEvents(data.events || [])
          console.log("✅ Events set to state:", data.events)
        }, 100)
      } else {
        console.error("❌ Failed to load events:", response.status, response.statusText)
        setEvents([])
      }
    } catch (error) {
      console.error("❌ Error loading events:", error)
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refreshEvents = useCallback(async () => {
    console.log("🔄 Manual refresh triggered")
    setRefreshing(true)
    setEvents([])

    // Clear caches
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        console.log("🧹 Cleared all browser caches")
      } catch (error) {
        console.error("Error clearing caches:", error)
      }
    }

    // Clear localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("event") || key.includes("qr") || key.includes("cache")) {
        localStorage.removeItem(key)
      }
    })

    setTimeout(() => {
      loadEvents()
    }, 200)
  }, [loadEvents])

  const deleteEvent = useCallback(
    async (eventId: string) => {
      console.log(`🗑️ Deleting event: ${eventId}`)

      // Optimistic update
      setEvents((prevEvents) => {
        const filtered = prevEvents.filter((event) => event.id !== eventId)
        console.log(`Filtered events (removed ${eventId}):`, filtered)
        return filtered
      })

      // Clear caches
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      }

      // Clear localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.includes(eventId) || key.includes(decodeURIComponent(eventId))) {
          localStorage.removeItem(key)
          console.log(`Removed localStorage key: ${key}`)
        }
      })

      // Refresh after delay
      setTimeout(() => {
        console.log("Forcing complete refresh after deletion")
        loadEvents()
      }, 1000)
    },
    [loadEvents],
  )

  const renameEvent = useCallback((eventId: string, newName: string) => {
    console.log(`🏷️ Renaming event: ${eventId} to "${newName}"`)

    setEvents((prevEvents) => prevEvents.map((event) => (event.id === eventId ? { ...event, name: newName } : event)))
  }, [])

  return {
    events,
    loading,
    refreshing,
    loadEvents,
    refreshEvents,
    deleteEvent,
    renameEvent,
  }
}
