import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    console.log('Session check:', {
      hasSession: !!session,
      hasAccessToken: !!(session?.accessToken),
      userEmail: session?.user?.email
    })
    
    if (!session || !session.accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        hasSession: !!session,
        hasAccessToken: !!(session?.accessToken)
      })
    }

    // Test the connection by creating a test folder
    const { GoogleDriveService } = await import('../../../lib/google-drive')
    const driveService = new GoogleDriveService(session.accessToken)
    
    // Try to get or create the main folder to test connection
    const mainFolderId = await driveService.getOrCreateMainFolder()
    
    console.log('Google Drive connection successful:', { mainFolderId })
    
    // Store the connection status in the user's session or database
    // For now, we'll just return success
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
