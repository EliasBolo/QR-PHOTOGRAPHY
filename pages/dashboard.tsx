import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [user, setUser] = useState({
    id: '',
    name: 'Admin User',
    email: 'admin@admin.com',
    googleDriveConnected: false
  })
  const [loading, setLoading] = useState(true)

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      // Always set a default user first to prevent any logout issues
      setUser({
        id: 'local-user',
        name: 'User',
        email: 'user@example.com',
        googleDriveConnected: false
      })
      setLoading(false)
      
      // Try to get real user data in background (non-blocking)
      try {
        const response = await fetch('/api/auth/me')
        const result = await response.json()
        if (result.user && result.user.id !== 'default-user') {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Error getting current user:', error)
        // Keep the default user we already set
      }
    }

    getCurrentUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
    }
  }

  return (
    <>
      <Head>
        <title>Dashboard - QR Photography</title>
        <meta name="description" content="QR Photography Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <nav className="nav">
        <div className="nav-title">QR Photography</div>
        <div className="nav-buttons">
          <span style={{ color: '#cccccc', marginRight: '1rem' }}>
            Welcome, {user.name}
          </span>
          <button onClick={handleLogout} className="btn btn-small">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your QR codes and photo collections
          </p>
        </div>

        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ color: '#cccccc' }}>Loading...</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '2rem',
              marginTop: '2rem'
            }}>
            <div style={{
              background: '#111111',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #333333',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>
                Create QR Code
              </h3>
              <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
                Generate a new QR code for your event
              </p>
              <Link href="/qr-create" className="btn btn-primary">
                Create QR Code
              </Link>
            </div>

            <div style={{
              background: '#111111',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #333333',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>
                My QR Codes
              </h3>
              <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
                View and manage your existing QR codes
              </p>
              <Link href="/qr-list" className="btn btn-primary">
                View QR Events
              </Link>
            </div>

            <div style={{
              background: '#111111',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #333333',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>
                Photo Gallery
              </h3>
              <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
                View photos uploaded by your guests
              </p>
              <button className="btn btn-primary" disabled>
                Coming Soon
              </button>
            </div>

            <div style={{
              background: '#111111',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #333333',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>
                Settings
              </h3>
              <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
                Manage your account and preferences
              </p>
              <Link href="/settings" className="btn btn-primary">
                Settings
              </Link>
            </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
