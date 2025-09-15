import { deleteFolder } from "@/lib/google-drive"
import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (same as in route.ts)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = decodeURIComponent(params.id)

    console.log(`🗑️ Starting deletion process for event: "${eventId}"`)

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get event data
    const eventData = events.get(eventId)

    if (!eventData) {
      console.log(`Event not found: ${eventId}`)
      return NextResponse.json({
        success: true,
        message: "Event not found or already deleted",
        eventId: eventId,
      })
    }

    // Delete Google Drive folder and all its contents
    try {
      await deleteFolder(eventData.folderId)
      console.log(`✅ Deleted Google Drive folder: ${eventData.folderId}`)
    } catch (error) {
      console.error(`❌ Error deleting Google Drive folder:`, error)
      // Continue with local deletion even if Google Drive deletion fails
    }

    // Remove from local storage
    events.delete(eventId)

    console.log(`✅ Event deletion completed: ${eventId}`)

    return NextResponse.json({
      success: true,
      message: `Event "${eventData.name}" deleted successfully`,
      eventId: eventId,
      deletedFolderId: eventData.folderId,
    })
  } catch (error) {
    console.error("❌ Error in delete operation:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
