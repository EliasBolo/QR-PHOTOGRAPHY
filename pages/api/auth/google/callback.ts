import { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { userDatabase } from '../../../../lib/database'
import jwt from 'jsonwebtoken'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    // Get the origin from the request headers (same logic as in google.ts)
    const origin = req.headers.origin || req.headers.host
    const protocol = req.headers['x-forwarded-proto'] || (origin?.includes('localhost') ? 'http' : 'https')
    const host = origin?.includes('localhost') ? origin : req.headers.host
    
    const baseUrl = `${protocol}://${host}`
    const redirectUri = `${baseUrl}/api/auth/google/callback`
    
    console.log('Callback redirect URI:', redirectUri)

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    if (!userInfo.email) {
      return res.status(400).json({ error: 'Could not get user email from Google' })
    }

    // Check if user exists in our database
    let user = userDatabase.getUserByEmail(userInfo.email)
    
    if (!user) {
      // For now, redirect to login page if user doesn't exist
      // In a real app, you might want to create the user or link to existing account
      console.log('User not found in database:', userInfo.email)
      res.redirect('/login?error=user_not_found&email=' + encodeURIComponent(userInfo.email))
      return
    }

    // Update user's Google Drive tokens
    userDatabase.updateGoogleDriveTokens(user.id, {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date || (Date.now() + 3600000)
    })

    // Create JWT token for our app
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

    // Redirect to settings page
    res.redirect('/settings?tab=storage&connected=true')

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.redirect('/settings?tab=storage&error=oauth_failed')
  }
}
