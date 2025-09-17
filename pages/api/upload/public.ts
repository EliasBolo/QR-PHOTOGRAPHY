import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_SIZE_MB = 200
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the form data
    const form = formidable({
      maxFileSize: MAX_SIZE_BYTES, // 200MB max total size
    })

    const [fields, files] = await form.parse(req)
    const eventId = Array.isArray(fields.eventId) ? fields.eventId[0] : fields.eventId

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    // Try to get the event from database first
    let event = userDatabase.getEventById(eventId)
    let eventOwner = null
    
    if (event) {
      // Event found in database, get the owner
      eventOwner = userDatabase.getUserById(event.userId)
    } else {
      // Event not in database, try to find any user with Google Drive connected
      // This handles cases where events are stored in localStorage only
      const allUsers = userDatabase.getAllUsers()
      console.log('All users in database:', allUsers.map(u => ({ 
        email: u.email, 
        googleDriveConnected: u.googleDriveConnected, 
        hasTokens: !!u.googleDriveTokens 
      })))
      
      eventOwner = allUsers.find(user => user.googleDriveConnected && user.googleDriveTokens)
      console.log('Found event owner:', eventOwner ? eventOwner.email : 'NONE')
      
      if (eventOwner) {
        // Create a temporary event object for the upload
        event = {
          id: eventId,
          name: `Event ${eventId}`,
          userId: eventOwner.id,
          date: new Date().toISOString().split('T')[0],
          status: 'active' as const,
          uploads: 0,
          createdAt: new Date().toISOString()
        }
        console.log('Using fallback event for upload:', eventId)
      }
    }
    
    if (!eventOwner || !eventOwner.googleDriveConnected || !eventOwner.googleDriveTokens || !event) {
      console.log('Upload failed - missing requirements:', {
        hasEventOwner: !!eventOwner,
        googleDriveConnected: eventOwner?.googleDriveConnected,
        hasTokens: !!eventOwner?.googleDriveTokens,
        hasEvent: !!event
      })
      return res.status(400).json({ error: 'No user with Google Drive connected found' })
    }

    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(eventOwner.googleDriveTokens.accessToken)

    // Get or create the event folder in the owner's Google Drive
    const eventFolderId = await driveService.getOrCreateEventFolder(event.name)

    const uploadedFiles = []
    let totalSize = 0

    // Check total file size first
    for (const [key, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray
      if (file && file.size) {
        totalSize += file.size
      }
    }

    if (totalSize > MAX_SIZE_BYTES) {
      return res.status(400).json({ 
        error: `Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds the ${MAX_SIZE_MB}MB limit` 
      })
    }

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
