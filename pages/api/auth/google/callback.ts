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
    const { code, state } = req.query

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    console.log('OAuth callback received state:', state)

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

    // Get the current user - first try state parameter, then cookies
    let user = null
    
    // Try to get user from state parameter first
    if (state && typeof state === 'string') {
      user = userDatabase.getUserById(state)
      console.log('Found user from state parameter:', user?.email)
    }
    
    // If not found from state, try cookies
    if (!user) {
      const existingToken = req.cookies['auth-token']
      console.log('Existing token found:', !!existingToken)
      
      if (existingToken) {
        try {
          const decoded = jwt.verify(existingToken, JWT_SECRET) as any
          console.log('Decoded token:', decoded)
          user = userDatabase.getUserById(decoded.userId)
          console.log('Found user by ID from token:', user?.email)
        } catch (error) {
          console.log('Invalid existing token:', error)
        }
      }
    }
    
    // If still not found, check if user exists by Google email
    if (!user) {
      user = userDatabase.getUserByEmail(userInfo.email)
      console.log('Found user by Google email:', user?.email)
      
      if (!user) {
        console.log('User not found in database:', userInfo.email)
        res.redirect('/login?error=user_not_found&email=' + encodeURIComponent(userInfo.email))
        return
      }
    }
    
    // Final fallback: if still no user found, try to get from current session
    if (!user) {
      console.log('No user found, trying to get from current session...')
      const existingToken = req.cookies['auth-token']
      if (existingToken) {
        try {
          const decoded = jwt.verify(existingToken, JWT_SECRET) as any
          user = userDatabase.getUserById(decoded.userId)
          console.log('Found user from existing session:', user?.email)
        } catch (error) {
          console.log('Invalid existing token:', error)
        }
      }
    }
    
    if (!user) {
      console.log('No user found after all attempts')
      res.redirect('/login?error=user_not_found')
      return
    }

    // Update user's Google Drive tokens
    console.log('Updating Google Drive tokens for user:', user.email, 'ID:', user.id)
    const updatedUser = userDatabase.updateGoogleDriveTokens(user.id, {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date || (Date.now() + 3600000)
    })
    
    if (updatedUser) {
      console.log('Successfully updated Google Drive tokens for user:', updatedUser.email)
      console.log('User Google Drive connected:', updatedUser.googleDriveConnected)
      console.log('User has tokens:', !!updatedUser.googleDriveTokens)
    } else {
      console.error('Failed to update Google Drive tokens for user:', user.email)
    }

    // Always create/refresh JWT token to ensure session is maintained
    console.log('Creating/refreshing JWT token for user:', user.email)
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

    // Redirect to settings page with user email for localStorage
    res.redirect(`/settings?tab=storage&connected=true&userEmail=${encodeURIComponent(user.email)}`)

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.redirect('/settings?tab=storage&error=oauth_failed')
  }
}
