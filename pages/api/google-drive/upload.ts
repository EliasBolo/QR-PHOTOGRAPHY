import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
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
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(session.accessToken)

    // Parse the form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
    })

    const [fields, files] = await form.parse(req)
    const eventName = Array.isArray(fields.eventName) ? fields.eventName[0] : fields.eventName

    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' })
    }

    // Get or create the event folder
    const eventFolderId = await driveService.getOrCreateEventFolder(eventName)

    const uploadedFiles = []

    // Process each uploaded file
    for (const [key, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray
      
      if (file && file.filepath) {
        // Read the file
        const fileBuffer = fs.readFileSync(file.filepath)
        
        // Upload to Google Drive
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

    return res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
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
