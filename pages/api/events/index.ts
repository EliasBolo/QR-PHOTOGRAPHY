import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user from JWT token
  const token = req.cookies['auth-token']
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = userDatabase.getUserById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (req.method === 'GET') {
      // Get all events for this user
      const events = userDatabase.getEventsByUserId(user.id)
      return res.status(200).json({ success: true, events })
    }

    if (req.method === 'POST') {
      // Create new event for this user
      const { name, date, description } = req.body

      if (!name || !date) {
        return res.status(400).json({ error: 'Name and date are required' })
      }

      const event = userDatabase.createEvent({
        userId: user.id,
        name,
        date,
        description: description || '',
        status: 'active',
        uploads: 0
      })

      // Auto-create Google Drive folder if user has Google Drive connected
      if (user.googleDriveConnected && user.googleDriveTokens) {
        try {
          const { GoogleDriveService } = await import('../../../lib/google-drive')
          const driveService = new GoogleDriveService(user.googleDriveTokens.accessToken)
          await driveService.getOrCreateEventFolder(name)
          console.log(`Created Google Drive folder for event: ${name}`)
        } catch (error) {
          console.error('Error creating Google Drive folder:', error)
          // Don't fail the event creation if folder creation fails
        }
      }

      return res.status(201).json({ success: true, event })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Events API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
