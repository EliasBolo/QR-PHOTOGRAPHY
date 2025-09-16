import { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the origin from the request headers
    const origin = req.headers.origin || req.headers.host
    const protocol = req.headers['x-forwarded-proto'] || (origin?.includes('localhost') ? 'http' : 'https')
    const host = origin?.includes('localhost') ? origin : req.headers.host
    
    const baseUrl = `${protocol}://${host}`
    const redirectUri = `${baseUrl}/api/auth/google/callback`
    
    console.log('OAuth redirect URI:', redirectUri)

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]

    // Get current user from session to pass as state
    const existingToken = req.cookies['auth-token']
    let state = ''
    
    if (existingToken) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(existingToken, process.env.JWT_SECRET || 'your-secret-key') as any
        state = decoded.userId // Pass user ID as state
        console.log('OAuth state set to user ID:', decoded.userId)
      } catch (error) {
        console.log('Could not decode existing token for state:', error)
      }
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state // Pass user ID as state parameter
    })

    res.redirect(authUrl)
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.status(500).json({ error: 'Failed to initiate Google OAuth' })
  }
}
