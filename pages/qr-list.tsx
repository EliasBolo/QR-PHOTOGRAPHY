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
    name: 'Admin User',
    email: 'admin@admin.com'
  })

  // QR events data - loads from localStorage
  const [qrEvents, setQrEvents] = useState<QREvent[]>([])

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('qrEvents')
    if (savedEvents) {
      setQrEvents(JSON.parse(savedEvents))
    }
  }, [])

  const handleLogout = () => {
    window.location.href = '/'
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      const updatedEvents = qrEvents.filter(event => event.id !== eventId)
      setQrEvents(updatedEvents)
      localStorage.setItem('qrEvents', JSON.stringify(updatedEvents))
    }
  }

  const handleToggleStatus = (eventId: string) => {
    const updatedEvents = qrEvents.map(event => {
      if (event.id === eventId) {
        const newStatus = event.status === 'active' ? 'inactive' : 'active'
        return { ...event, status: newStatus }
      }
      return event
    })
    setQrEvents(updatedEvents)
    localStorage.setItem('qrEvents', JSON.stringify(updatedEvents))
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

          {qrEvents.length === 0 ? (
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
                      onClick={() => window.open(`/uploads/${event.id}`, '_blank')}
                    >
                      View Uploads
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
