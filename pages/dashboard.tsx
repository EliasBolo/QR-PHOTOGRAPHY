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
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Get current user and events on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const result = await response.json()
          setUser(result.user)
          
          // Fetch user's events
          const eventsResponse = await fetch('/api/events')
          if (eventsResponse.ok) {
            const eventsResult = await eventsResponse.json()
            setEvents(eventsResult.events || [])
          }
        } else {
          // Redirect to login if not authenticated
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Error getting current user:', error)
        window.location.href = '/login'
      } finally {
        setLoading(false)
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
            <>
              {/* User's Events Section */}
              {events.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h2 style={{ color: '#ffffff', marginBottom: '1rem' }}>Your Events</h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    {events.map((event: any) => (
                      <div key={event.id} style={{
                        background: '#111111',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid #333333'
                      }}>
                        <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>
                          {event.name}
                        </h3>
                        <p style={{ color: '#cccccc', marginBottom: '0.5rem' }}>
                          Date: {new Date(event.date).toLocaleDateString()}
                        </p>
                        <p style={{ color: '#cccccc', marginBottom: '1rem' }}>
                          Status: <span style={{ 
                            color: event.status === 'active' ? '#66bb6a' : '#ff6b6b' 
                          }}>
                            {event.status}
                          </span>
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link 
                            href={`/qr-view/${event.id}`} 
                            className="btn btn-small"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                          >
                            View QR
                          </Link>
                          <Link 
                            href={`/upload/${event.id}`} 
                            className="btn btn-small"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                          >
                            Upload Photos
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            </>
          )}
        </div>
      </div>
    </>
  )
}
