import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.cookies['auth-token']
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

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
        googleDriveConnected: user.googleDriveConnected,
        hasGoogleDriveTokens: !!user.googleDriveTokens,
        hasAccessToken: !!(user.googleDriveTokens?.accessToken),
        tokenExpiresAt: user.googleDriveTokens?.expiresAt,
        isTokenExpired: user.googleDriveTokens?.expiresAt ? user.googleDriveTokens.expiresAt < Date.now() : null
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
