import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    
    // Get storage quota information for this user's Google Drive
    const storageQuota = await driveService.getStorageQuota()
    
    return res.status(200).json({
      success: true,
      storage: storageQuota
    })
  } catch (error) {
    console.error('Storage quota error:', error)
    return res.status(500).json({
      error: 'Failed to get storage quota',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
