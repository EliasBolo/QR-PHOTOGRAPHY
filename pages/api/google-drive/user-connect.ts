import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const { accessToken, refreshToken, expiresAt, eventName } = req.body

    // If eventName is provided, create folder for that event
    if (eventName) {
      // Check if user has Google Drive connected
      if (!user.googleDriveConnected || !user.googleDriveTokens) {
        return res.status(400).json({ error: 'Google Drive not connected. Please connect Google Drive first.' })
      }

      const { GoogleDriveService } = await import('../../../lib/google-drive')
      const driveService = new GoogleDriveService(user.googleDriveTokens.accessToken)
      
      // Create folder for the specific event
      const eventFolderId = await driveService.getOrCreateEventFolder(eventName)
      
      console.log(`Created Google Drive folder for event: ${eventName}`)
      
      return res.status(200).json({ 
        success: true, 
        message: `Google Drive folder created for event: ${eventName}`,
        eventFolderId 
      })
    }

    // Original connection logic for new Google Drive connections
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' })
    }

    // Test the connection by creating a test folder
    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(accessToken)
    
    // Try to get or create the main folder to test connection
    const mainFolderId = await driveService.getOrCreateMainFolder()
    
    // Store the tokens for this specific user
    userDatabase.updateGoogleDriveTokens(user.id, {
      accessToken,
      refreshToken,
      expiresAt: expiresAt || (Date.now() + 3600000) // 1 hour default
    })
    
    console.log(`Google Drive connected for user: ${user.email}`)
    
    return res.status(200).json({ 
      success: true, 
      message: 'Google Drive connected successfully',
      mainFolderId 
    })
  } catch (error) {
    console.error('Google Drive connection error:', error)
    return res.status(500).json({ 
      error: 'Failed to connect to Google Drive',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
