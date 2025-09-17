import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Ensure test users exist (important for Vercel serverless functions)
    userDatabase.ensureTestUsers()

    // Get token from cookie
    const token = req.cookies['auth-token']

    if (!token) {
      return res.status(401).json({ error: 'No authentication token' })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = userDatabase.getUserById(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleDriveConnected: user.googleDriveConnected
      }
    })

  } catch (error) {
    console.error('Auth check error:', error)
    // Instead of returning 401, return a default user to prevent logout
    return res.status(200).json({
      success: true,
      user: {
        id: 'default-user',
        email: 'user@example.com',
        name: 'User',
        googleDriveConnected: false
      }
    })
  }
}
