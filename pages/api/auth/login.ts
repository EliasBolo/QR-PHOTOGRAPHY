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

    // Ensure test users exist (important for Vercel serverless functions)
    userDatabase.ensureTestUsers()

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

    // Create JWT token with longer expiration
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '30d' } // 30 days instead of 7
    )

    // Set HTTP-only cookie with more lenient settings
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; Secure`)

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
