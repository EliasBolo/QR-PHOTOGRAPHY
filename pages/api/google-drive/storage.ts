import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(session.accessToken)
    
    // Get storage quota information
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
