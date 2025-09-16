import { deleteFile } from "@/lib/google-drive"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; fileId: string } }) {
  try {
    const eventId = decodeURIComponent(params.id)
    const fileId = decodeURIComponent(params.fileId)

    console.log(`🗑️ Deleting file: "${fileId}" from event: "${eventId}"`)

    if (!eventId || !fileId) {
      return NextResponse.json({ error: "Event ID and file ID are required" }, { status: 400 })
    }

    // Delete file from Google Drive
    await deleteFile(fileId)

    console.log(`✅ Successfully deleted file: ${fileId}`)

    return NextResponse.json({
      success: true,
      message: `File deleted successfully`,
      deletedFileId: fileId,
      eventId: eventId,
    })
  } catch (error) {
    console.error("❌ Error deleting file:", error)
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
