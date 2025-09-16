import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
    })

    const [fields, files] = await form.parse(req)
    const eventId = Array.isArray(fields.eventId) ? fields.eventId[0] : fields.eventId

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    // Get the event to find the owner
    const event = userDatabase.getEventById(eventId)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Get the event owner
    const eventOwner = userDatabase.getUserById(event.userId)
    if (!eventOwner || !eventOwner.googleDriveConnected || !eventOwner.googleDriveTokens) {
      return res.status(400).json({ error: 'Event owner has not connected Google Drive' })
    }

    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(eventOwner.googleDriveTokens.accessToken)

    // Get or create the event folder in the owner's Google Drive
    const eventFolderId = await driveService.getOrCreateEventFolder(event.name)

    const uploadedFiles = []

    // Process each uploaded file
    for (const [key, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray
      
      if (file && file.filepath) {
        // Read the file
        const fileBuffer = fs.readFileSync(file.filepath)
        
        // Upload to the event owner's Google Drive
        const uploadedFile = await driveService.uploadFile(
          fileBuffer,
          file.originalFilename || 'unknown',
          file.mimetype || 'application/octet-stream',
          eventFolderId
        )
        
        uploadedFiles.push(uploadedFile)
        
        // Clean up temporary file
        fs.unlinkSync(file.filepath)
      }
    }

    // Update event upload count
    userDatabase.updateEvent(eventId, {
      uploads: event.uploads + uploadedFiles.length
    })

    console.log(`Uploaded ${uploadedFiles.length} files to ${eventOwner.email}'s Google Drive for event: ${event.name}`)

    return res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully!`,
      files: uploadedFiles,
      eventFolderId
    })

  } catch (error) {
    console.error('Public upload error:', error)
    return res.status(500).json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
