import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // For now, just return a simple message that uploads are disabled
  return res.status(400).json({ 
    error: 'File uploads are temporarily disabled. Please try again later.'
  })
}