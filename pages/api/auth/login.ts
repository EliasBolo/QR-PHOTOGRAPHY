import { NextApiRequest, NextApiResponse } from 'next'
import { userDatabase } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email
    const user = userDatabase.getUserByEmail(email)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password (in production, use proper password hashing)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Update last login
    userDatabase.updateUser(user.id, { lastLogin: new Date().toISOString() })

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`)

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
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
