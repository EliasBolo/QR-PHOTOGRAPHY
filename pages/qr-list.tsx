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
    email: 'admin@admin.com',
    googleDriveConnected: false
  })
  const [qrEvents, setQrEvents] = useState<QREvent[]>([])
  const [loading, setLoading] = useState(true)

  // Load user and events from API and localStorage
  const loadUserAndEvents = async () => {
    try {
      // Get current user
      const userResponse = await fetch('/api/auth/me')
      if (userResponse.ok) {
        const userResult = await userResponse.json()
        setUser(userResult.user)
        
        // Load events from localStorage first (for persistence)
        const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
        const userEvents = savedEvents.filter((event: any) => event.userEmail === userResult.user.email)
        setQrEvents(userEvents)
        
        // Also try to fetch from server (in case there are newer events)
        try {
          const eventsResponse = await fetch('/api/events')
          if (eventsResponse.ok) {
            const eventsResult = await eventsResponse.json()
            // Merge server events with localStorage events
            const serverEvents = eventsResult.events || []
            const mergedEvents = [...userEvents]
            
            // Add server events that aren't already in localStorage, or update existing ones
            serverEvents.forEach((serverEvent: any) => {
              const existingEventIndex = userEvents.findIndex((localEvent: any) => localEvent.id === serverEvent.id)
              if (existingEventIndex === -1) {
                // New event - add it
                mergedEvents.push({
                  ...serverEvent,
                  userEmail: userResult.user.email,
                  qrCodeUrl: `/upload-mobile/${serverEvent.id}`
                })
              } else {
                // Existing event - update it with server data (including googleDriveFolderId)
                mergedEvents[existingEventIndex] = {
                  ...mergedEvents[existingEventIndex],
                  ...serverEvent,
                  userEmail: userResult.user.email,
                  qrCodeUrl: `/upload-mobile/${serverEvent.id}`
                }
              }
            })
            
            setQrEvents(mergedEvents)
            // Update localStorage with merged events
            localStorage.setItem('qrEvents', JSON.stringify(mergedEvents))
          }
        } catch (serverError) {
          console.log('Server events not available, using localStorage only')
        }
      } else {
        // Check if user has a valid JWT token in cookies
        const hasAuthToken = document.cookie.includes('auth-token=')
        if (hasAuthToken) {
          // User has token but API failed, use default user and load events from localStorage
          setUser({
            id: 'local-user',
            name: 'User',
            email: 'user@example.com',
            googleDriveConnected: false
          })
          const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
          setQrEvents(savedEvents)
        } else {
          // No token, redirect to login
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Error loading user and events:', error)
      // Check if user has a valid JWT token in cookies
      const hasAuthToken = document.cookie.includes('auth-token=')
      if (hasAuthToken) {
        // User has token but API failed, use default user and load events from localStorage
        setUser({
          id: 'local-user',
          name: 'User',
          email: 'user@example.com',
          googleDriveConnected: false
        })
        const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
        setQrEvents(savedEvents)
      } else {
        // No token, redirect to login
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  // Load user and events on component mount
  useEffect(() => {
    loadUserAndEvents()
  }, [])

  // Reload events when page becomes visible (e.g., returning from qr-create)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserAndEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
          
          // Remove from localStorage
          const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
          const updatedEvents = savedEvents.filter((event: any) => event.id !== eventId)
          localStorage.setItem('qrEvents', JSON.stringify(updatedEvents))
        } else {
          alert('Failed to delete event. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Failed to delete event. Please try again.')
      }
    }
  }

  const handleReActivateEvent = async (eventId: string, eventName: string) => {
    try {
      // Check if Google Drive is connected by checking localStorage first
      const savedDriveStatus = localStorage.getItem(`googleDriveConnected_${user.email}`)
      const isDriveConnected = savedDriveStatus === 'true'
      
      if (!isDriveConnected) {
        alert('Please connect your Google Drive first in Settings before re-activating events.')
        return
      }

      // Create Google Drive folder for this event
      const response = await fetch('/api/google-drive/user-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventName }),
      })

      if (response.ok) {
        const result = await response.json()
        const eventFolderId = result.eventFolderId
        
        // Update the event with the Google Drive folder ID
        console.log('Updating event:', eventId, 'with folder ID:', eventFolderId)
        const updateResponse = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            googleDriveFolderId: eventFolderId,
            status: 'active' // Also reactivate the event
          }),
        })
        
        console.log('Update response status:', updateResponse.status)
        if (!updateResponse.ok) {
          const errorResult = await updateResponse.json()
          console.log('Update error:', errorResult)
        }
        
        if (updateResponse.ok) {
          alert(`Event "${eventName}" has been re-activated! Google Drive folder created successfully.`)
          
          // Update localStorage immediately with the new folder ID
          const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
          const updatedEvents = savedEvents.map((event: any) => {
            if (event.id === eventId) {
              return {
                ...event,
                googleDriveFolderId: eventFolderId,
                status: 'active'
              }
            }
            return event
          })
          localStorage.setItem('qrEvents', JSON.stringify(updatedEvents))
          
          // Refresh the events list
          loadUserAndEvents()
        } else {
          // Even if API update fails, update localStorage and show success
          // This ensures the event works for mobile uploads
          const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
          const updatedEvents = savedEvents.map((event: any) => {
            if (event.id === eventId) {
              return {
                ...event,
                googleDriveFolderId: eventFolderId,
                status: 'active'
              }
            }
            return event
          })
          localStorage.setItem('qrEvents', JSON.stringify(updatedEvents))
          
          // Also try to create the event in the database for mobile access
          try {
            await fetch('/api/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: eventName,
                date: new Date().toISOString().split('T')[0],
                description: 'Re-activated event',
                status: 'active',
                googleDriveFolderId: eventFolderId
              }),
            })
            console.log('Event created in database for mobile access')
          } catch (error) {
            console.log('Failed to create event in database:', error)
          }
          
          alert(`Event "${eventName}" has been re-activated! Google Drive folder created successfully. (Updated locally)`)
          loadUserAndEvents()
        }
      } else {
        const result = await response.json()
        alert(`Failed to re-activate event: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error re-activating event:', error)
      alert('Failed to re-activate event. Please try again.')
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link href="/qr-create" className="btn btn-primary">
                Create New Event
              </Link>
              <button 
                onClick={() => {
                  setLoading(true)
                  loadUserAndEvents()
                }}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1rem' }}
              >
                🔄 Refresh
              </button>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/google-drive-status')
                    const result = await response.json()
                    console.log('Google Drive Status:', result)
                    alert(`Google Drive Status:\nConnected: ${result.user?.googleDriveConnected}\nHas Tokens: ${result.user?.hasGoogleDriveTokens}\nHas Access Token: ${result.user?.hasAccessToken}\nToken Expired: ${result.user?.isTokenExpired}`)
                  } catch (error) {
                    console.error('Debug error:', error)
                    alert('Debug failed')
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1rem', marginLeft: '0.5rem' }}
              >
                🔍 Debug Drive
              </button>
              <button 
                onClick={() => {
                  window.open('/api/auth/google', '_blank')
                }}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1rem', marginLeft: '0.5rem' }}
              >
                🔗 Connect Drive
              </button>
            </div>
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
                      onClick={() => handleReActivateEvent(event.id, event.name)}
                    >
                      Re-Activate Event
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
