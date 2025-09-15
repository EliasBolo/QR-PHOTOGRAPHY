import { getOrCreateFolder, listFilesInFolder } from "@/lib/google-drive"
import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for events (in production, use a database)
const events = new Map<
  string,
  {
    id: string
    name: string
    createdAt: string
    folderId: string
    folderUrl: string
  }
>()

// GET - Fetch all events
export async function GET(request: NextRequest) {
  try {
    console.log("📊 Fetching all events...")

    const headers = {
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    }

    const eventsArray = []

    // Get photo counts for each event
    for (const [eventId, eventData] of events.entries()) {
      try {
        const files = await listFilesInFolder(eventData.folderId)
        const photoCount = files.filter(
          (file) => file.mimeType?.startsWith("image/") || file.mimeType?.startsWith("video/"),
        ).length

        eventsArray.push({
          id: eventId,
          name: eventData.name,
          date: new Date(eventData.createdAt).toISOString().split("T")[0],
          photoCount: photoCount,
          createdAt: eventData.createdAt,
          folderId: eventData.folderId,
          folderUrl: eventData.folderUrl,
        })
      } catch (error) {
        console.error(`Error getting photo count for event ${eventId}:`, error)
        eventsArray.push({
          id: eventId,
          name: eventData.name,
          date: new Date(eventData.createdAt).toISOString().split("T")[0],
          photoCount: 0,
          createdAt: eventData.createdAt,
          folderId: eventData.folderId,
          folderUrl: eventData.folderUrl,
        })
      }
    }

    // Sort by creation date (newest first)
    eventsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`✅ Returning ${eventsArray.length} events`)

    return NextResponse.json(
      {
        success: true,
        events: eventsArray,
        timestamp: Date.now(),
      },
      { headers },
    )
  } catch (error) {
    console.error("❌ Error fetching events:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const { eventName } = await request.json()

    if (!eventName) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 })
    }

    // Create a URL-friendly version of the event name
    const safeEventName = eventName.trim().toLowerCase().replace(/\s+/g, "-")
    const uniqueId = Math.random().toString(36).substring(2, 8)
    const eventId = `${safeEventName}-${uniqueId}`

    console.log(`🆕 Creating new event: ${eventId} with name: "${eventName}"`)

    // Create folder in Google Drive
    const folder = await getOrCreateFolder(eventName)

    if (!folder || !folder.id) {
      throw new Error("Failed to create Google Drive folder")
    }

    // Store event data
    const eventData = {
      id: eventId,
      name: eventName,
      createdAt: new Date().toISOString(),
      folderId: folder.id,
      folderUrl: folder.webViewLink || "",
    }

    events.set(eventId, eventData)

    console.log(`✅ Created event: ${eventId} with Google Drive folder: ${folder.id}`)

    return NextResponse.json(
      {
        success: true,
        event: {
          id: eventId,
          name: eventName,
          createdAt: eventData.createdAt,
          folderId: folder.id,
          folderUrl: folder.webViewLink,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("❌ Error creating event:", error)
    return NextResponse.json(
      {
        error: "Failed to create event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
