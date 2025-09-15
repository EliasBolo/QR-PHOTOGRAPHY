import { listFilesInFolder } from "@/lib/google-drive"
import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (same as in other files)
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = decodeURIComponent(params.id)

    console.log(`📷 Fetching photos for event: "${eventId}"`)

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get event data
    const eventData = events.get(eventId)

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // List files in Google Drive folder
    const files = await listFilesInFolder(eventData.folderId)

    // Filter and format media files
    const mediaFiles = files.filter(
      (file) => file.mimeType?.startsWith("image/") || file.mimeType?.startsWith("video/"),
    )

    const photos = mediaFiles.map((file) => ({
      id: file.id,
      filename: file.name || "unknown",
      url: `https://drive.google.com/uc?export=view&id=${file.id}`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=s400`,
      uploadedAt: file.createdTime || new Date().toISOString(),
      size: Number.parseInt(file.size || "0"),
      mimeType: file.mimeType || "",
      webViewLink: file.webViewLink || "",
    }))

    console.log(`✅ Found ${photos.length} media files for event "${eventId}"`)

    return NextResponse.json({
      success: true,
      eventId: eventId,
      photos,
      totalPhotos: photos.length,
      folderId: eventData.folderId,
      folderUrl: eventData.folderUrl,
    })
  } catch (error) {
    console.error("❌ Error fetching photos:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch photos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
