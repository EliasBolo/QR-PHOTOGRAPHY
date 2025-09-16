import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../../lib/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  try {
    const event = userDatabase.getEventById(id)

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Return only public event information (no sensitive data)
    return res.status(200).json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        description: event.description,
        status: event.status,
        uploads: event.uploads,
        createdAt: event.createdAt
      }
    })
  } catch (error) {
    console.error('Public event API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
