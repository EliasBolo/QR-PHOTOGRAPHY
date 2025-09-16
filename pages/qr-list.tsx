import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface QREvent {
  id: string
  name: string
  date: string
  status: 'active' | 'inactive' | 'completed'
  uploads: number
  createdAt: string
  qrCodeUrl?: string
}

export default function QrList() {
  const [user, setUser] = useState({
    id: '',
    name: 'Admin User',
    email: 'admin@admin.com'
  })
  const [qrEvents, setQrEvents] = useState<QREvent[]>([])
  const [loading, setLoading] = useState(true)

  // Load user and events from API on component mount
  useEffect(() => {
    const loadUserAndEvents = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userResult = await userResponse.json()
          setUser(userResult.user)
          
          // Fetch user's events
          const eventsResponse = await fetch('/api/events')
          if (eventsResponse.ok) {
            const eventsResult = await eventsResponse.json()
            setQrEvents(eventsResult.events || [])
          }
        } else {
          // Redirect to login if not authenticated
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Error loading user and events:', error)
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }

    loadUserAndEvents()
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

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          // Remove from local state
          setQrEvents(prevEvents => prevEvents.filter(event => event.id !== eventId))
        } else {
          alert('Failed to delete event. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Failed to delete event. Please try again.')
      }
    }
  }

  const handleToggleStatus = async (eventId: string) => {
    try {
      const event = qrEvents.find(e => e.id === eventId)
      if (!event) return

      const newStatus = event.status === 'active' ? 'inactive' : 'active'
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        // Update local state
        setQrEvents(prevEvents => 
          prevEvents.map(e => 
            e.id === eventId ? { ...e, status: newStatus as 'active' | 'inactive' | 'completed' } : e
          )
        )
      } else {
        alert('Failed to update event status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating event status:', error)
      alert('Failed to update event status. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#66bb6a'
      case 'inactive': return '#ffa726'
      case 'completed': return '#42a5f5'
      default: return '#888888'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'inactive': return 'Inactive'
      case 'completed': return 'Completed'
      default: return 'Unknown'
    }
  }

  return (
    <>
      <Head>
        <title>QR Events - QR Photography</title>
        <meta name="description" content="Manage your QR code events" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Header */}
      <nav className="nav">
        <div className="nav-title">QR Photography</div>
        <div className="nav-buttons">
          <Link href="/dashboard" className="btn btn-small">
            ← Dashboard
          </Link>
          <span style={{ color: '#cccccc', marginRight: '1rem' }}>
            Welcome, {user.name}
          </span>
          <button onClick={handleLogout} className="btn btn-small">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard">
        <div className="container">
          <div className="qr-list-header">
            <h1 className="qr-list-title">My QR Events</h1>
            <p className="qr-list-subtitle">
              Manage and view all your QR code events
            </p>
            <Link href="/qr-create" className="btn btn-primary">
              Create New Event
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ color: '#cccccc' }}>Loading your events...</p>
            </div>
          ) : qrEvents.length === 0 ? (
            <div className="qr-list-empty">
              <h3>No QR Events Yet</h3>
              <p>Create your first QR event to start collecting photos from your guests.</p>
              <Link href="/qr-create" className="btn btn-primary">
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="qr-list-container">
              {qrEvents.map((event) => (
                <div key={event.id} className="qr-event-card">
                  <div className="qr-event-header">
                    <div className="qr-event-info">
                      <h3 className="qr-event-name">{event.name}</h3>
                      <div className="qr-event-meta">
                        <span className="qr-event-date">📅 {event.date}</span>
                        <span 
                          className="qr-event-status"
                          style={{ color: getStatusColor(event.status) }}
                        >
                          ● {getStatusText(event.status)}
                        </span>
                      </div>
                    </div>
                    <div className="qr-event-stats">
                      <div className="qr-stat">
                        <span className="qr-stat-number">{event.uploads}</span>
                        <span className="qr-stat-label">Uploads</span>
                      </div>
                    </div>
                  </div>

                  <div className="qr-event-details">
                    <div className="qr-event-created">
                      Created: {new Date(event.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="qr-event-actions">
                    <button 
                      className="qr-action-btn qr-action-primary"
                      onClick={() => window.open(`/qr-view/${event.id}`, '_blank')}
                    >
                      View QR Code
                    </button>
                    <button 
                      className="qr-action-btn qr-action-secondary"
                      onClick={() => handleToggleStatus(event.id)}
                    >
                      {event.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="qr-action-btn qr-action-secondary"
                      onClick={() => window.open(`/upload/${event.id}`, '_blank')}
                    >
                      Upload Photos
                    </button>
                    <button 
                      className="qr-action-btn qr-action-danger"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
