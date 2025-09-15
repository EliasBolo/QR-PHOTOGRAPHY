import { put, list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = decodeURIComponent(params.id)
    const { newName } = await request.json()

    console.log(`🔄 RENAME OPERATION: Event ID "${eventId}" to name "${newName}"`)

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: "New name is required" }, { status: 400 })
    }

    const trimmedName = newName.trim()

    if (trimmedName.length > 50) {
      return NextResponse.json({ error: "Event name must be 50 characters or less" }, { status: 400 })
    }

    // CRITICAL: Verify the event exists by checking for files
    console.log(`Verifying event exists: events/${eventId}/`)

    let { blobs } = await list({
      prefix: `events/${eventId}/`,
      limit: 100,
    })

    // If no files found with decoded ID, try with the original encoded ID
    if (blobs.length === 0 && eventId !== params.id) {
      console.log(`No files found with decoded ID, trying original: events/${params.id}/`)
      const { blobs: encodedBlobs } = await list({
        prefix: `events/${params.id}/`,
        limit: 100,
      })
      blobs = encodedBlobs
    }

    console.log(`Found ${blobs.length} files for event "${eventId}"`)

    // CRITICAL: Only update the .event-info file, don't create a new event
    const eventInfo = {
      id: eventId, // KEEP THE SAME ID
      name: trimmedName, // ONLY CHANGE THE NAME
      renamedAt: new Date().toISOString(),
      originalCreatedAt: new Date().toISOString(),
      lastModified: Date.now(),
      version: Math.random().toString(36), // Force cache invalidation
      operation: "rename", // Mark as rename operation
    }

    console.log(`Updating .event-info for existing event: ${eventId}`)

    // Update the existing event's info file
    await put(`events/${eventId}/.event-info`, JSON.stringify(eventInfo), {
      access: "public",
      allowOverwrite: true, // This is critical - overwrite existing
    })

    // Add delay for blob consistency
    await new Promise((resolve) => setTimeout(resolve, 300))

    console.log(`✅ RENAME COMPLETE: Event "${eventId}" renamed to "${trimmedName}"`)

    return NextResponse.json(
      {
        success: true,
        eventId: eventId, // Return the SAME event ID
        newName: trimmedName,
        message: "Event renamed successfully - same ID, new name",
        filesFound: blobs.length,
        operation: "rename",
        timestamp: Date.now(),
        debug: {
          originalId: eventId,
          keptSameId: true,
          onlyNameChanged: true,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
          "CDN-Cache-Control": "no-store",
        },
      },
    )
  } catch (error) {
    console.error("❌ Error in rename operation:", error)
    return NextResponse.json(
      {
        error: "Failed to rename event",
        details: error instanceof Error ? error.message : "Unknown error",
        operation: "rename",
      },
      {
        status: 500,
      },
    )
  }
}
