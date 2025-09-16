import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  // Get user from JWT token
  const token = req.cookies['auth-token']
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Ensure test users exist (important for Vercel serverless functions)
    userDatabase.ensureTestUsers()
    
    const user = userDatabase.getUserById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const event = userDatabase.getEventById(id)

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Check if the event belongs to this user
    if (event.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, event })
    }

    if (req.method === 'PUT') {
      const { name, date, description, status } = req.body
      
      const updatedEvent = userDatabase.updateEvent(id, {
        name,
        date,
        description,
        status
      })

      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found' })
      }

      return res.status(200).json({ success: true, event: updatedEvent })
    }

    if (req.method === 'DELETE') {
      const deleted = userDatabase.deleteEvent(id)
      
      if (!deleted) {
        return res.status(404).json({ error: 'Event not found' })
      }

      return res.status(200).json({ success: true, message: 'Event deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Event API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
