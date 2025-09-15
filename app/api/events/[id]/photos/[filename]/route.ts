import { del, list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; filename: string } }) {
  try {
    const eventId = decodeURIComponent(params.id)
    const filename = decodeURIComponent(params.filename)

    console.log(`🗑️ Deleting single file: "${filename}" from event: "${eventId}"`)

    if (!eventId || !filename) {
      return NextResponse.json({ error: "Event ID and filename are required" }, { status: 400 })
    }

    // First, find the exact file by listing all files in the event
    const { blobs } = await list({
      prefix: `events/${eventId}/`,
      limit: 1000,
    })

    console.log(`Found ${blobs.length} total files in event "${eventId}"`)

    // Find the specific file to delete
    const fileToDelete = blobs.find((blob) => {
      const blobFilename = blob.pathname.split("/").pop() || ""
      // Match both the original filename and the clean filename
      const cleanBlobFilename = blobFilename.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/, "")

      return blobFilename === filename || cleanBlobFilename === filename || blob.pathname.endsWith(filename)
    })

    if (!fileToDelete) {
      console.log(`File not found: "${filename}" in event "${eventId}"`)
      return NextResponse.json(
        {
          error: "File not found",
          details: `Could not find file "${filename}" in event "${eventId}"`,
          availableFiles: blobs.map((b) => b.pathname.split("/").pop()).slice(0, 10), // Show first 10 for debugging
        },
        { status: 404 },
      )
    }

    console.log(`Found file to delete: ${fileToDelete.pathname}`)

    // Delete the specific file
    await del(fileToDelete.url)

    console.log(`✅ Successfully deleted file: ${fileToDelete.pathname}`)

    return NextResponse.json(
      {
        success: true,
        message: `File "${filename}" deleted successfully`,
        deletedFile: {
          filename: filename,
          pathname: fileToDelete.pathname,
          url: fileToDelete.url,
          size: fileToDelete.size,
        },
        eventId: eventId,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("❌ Error deleting single file:", error)
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
