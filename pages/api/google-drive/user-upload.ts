import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import formidable from 'formidable'
import fs from 'fs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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
    // Get user from JWT token
    const token = req.cookies['auth-token']
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = userDatabase.getUserById(decoded.userId)
    
    if (!user || !user.googleDriveConnected || !user.googleDriveTokens) {
      return res.status(401).json({ error: 'Google Drive not connected' })
    }

    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(user.googleDriveTokens.accessToken)

    // Parse the form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
    })

    const [fields, files] = await form.parse(req)
    const eventName = Array.isArray(fields.eventName) ? fields.eventName[0] : fields.eventName

    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' })
    }

    // Get or create the event folder in this user's Google Drive
    const eventFolderId = await driveService.getOrCreateEventFolder(eventName)

    const uploadedFiles = []

    // Process each uploaded file
    for (const [key, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray
      
      if (file && file.filepath) {
        // Read the file
        const fileBuffer = fs.readFileSync(file.filepath)
        
        // Upload to this user's Google Drive
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

    console.log(`Uploaded ${uploadedFiles.length} files to ${user.email}'s Google Drive`)

    return res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully to your Google Drive`,
      files: uploadedFiles,
      eventFolderId
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
