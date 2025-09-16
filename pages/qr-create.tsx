import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function QrCreate() {
  const [user, setUser] = useState({
    id: '',
    name: 'Admin User',
    email: 'admin@admin.com',
    googleDriveConnected: false
  })

  const [userLogo, setUserLogo] = useState<string | null>(null)
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    description: ''
  })
  const [createdEvent, setCreatedEvent] = useState<any>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [showGoogleDriveWarning, setShowGoogleDriveWarning] = useState(false)
  const [pendingEventData, setPendingEventData] = useState<any>(null)

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const result = await response.json()
          setUser(result.user)
        } else {
          // Redirect to login if not authenticated
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Error getting current user:', error)
        window.location.href = '/login'
      }
    }

    getCurrentUser()
  }, [])

  // Load user logo from localStorage on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('userLogo')
    if (savedLogo) {
      setUserLogo(savedLogo)
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

  const handlePrintA5 = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    try {
      // Get the QR card element to capture
      const qrCard = document.querySelector('.qr-card') as HTMLElement
      if (!qrCard) return
      
      // Create a canvas from the QR card
      const canvas = await html2canvas(qrCard, {
        backgroundColor: '#000000',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true
      })
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // Add image to PDF
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add new page if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Save the PDF
      const fileName = createdEvent ? `${createdEvent.name || 'qr-code'}.pdf` : 'qr-code.pdf'
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to simple download
      const link = document.createElement('a')
      link.href = '#'
      link.download = 'qr-code.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleEventDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventData({
      ...eventData,
      [e.target.name]: e.target.value
    })
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventData.name || !eventData.date) {
      alert('Please fill in all required fields')
      return
    }
    
    // Check if Google Drive is connected
    const savedDriveStatus = localStorage.getItem(`googleDriveConnected_${user.email}`)
    const isDriveConnected = savedDriveStatus === 'true' || user.googleDriveConnected
    
    if (!isDriveConnected) {
      // Show warning popup
      setPendingEventData(eventData)
      setShowGoogleDriveWarning(true)
      return
    }
    
    // Proceed with event creation
    await createEvent(eventData)
  }

  const createEvent = async (eventData: any) => {
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      const result = await response.json()

      if (response.ok) {
        const newEvent = {
          ...result.event,
          qrCodeUrl: `/upload-mobile/${result.event.id}`
        }
        
        // Save event to localStorage for persistence
        const savedEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
        savedEvents.push(newEvent)
        localStorage.setItem('qrEvents', JSON.stringify(savedEvents))
        
        setCreatedEvent(newEvent)
        setIsCreating(false)
        
        alert('Event created successfully! Redirecting to your events list...')
        
        // Redirect to qr-list page after a short delay
        setTimeout(() => {
          window.location.href = '/qr-list'
        }, 1500)
      } else {
        alert(result.error || 'Failed to create event')
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
      setIsCreating(false)
    }
  }

  const handleProceedWithoutDrive = async () => {
    setShowGoogleDriveWarning(false)
    if (pendingEventData) {
      await createEvent(pendingEventData)
      setPendingEventData(null)
    }
  }

  const handleCancelEvent = () => {
    setShowGoogleDriveWarning(false)
    setPendingEventData(null)
  }

  const handleCreateQR = async () => {
    if (createdEvent) {
      try {
        // Generate QR code that links to mobile upload page
        const uploadUrl = `${window.location.origin}/upload-mobile/${createdEvent.id}`
        const qrDataURL = await QRCode.toDataURL(uploadUrl, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        setQrCodeDataURL(qrDataURL)
        setShowQRCode(true)
        alert('QR code generated successfully!')
      } catch (error) {
        console.error('Error generating QR code:', error)
        alert('Error generating QR code. Please try again.')
      }
    } else {
      alert('Please create an event first!')
    }
  }

  return (
    <>
      <Head>
        <title>QR Create - QR Photography</title>
        <meta name="description" content="Create QR codes for photo uploads" />
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
          <div className="qr-card">
            {userLogo && (
              <div className="qr-user-logo">
                <img src={userLogo} alt="User Logo" className="qr-logo-image" />
              </div>
            )}
            <h1 className="qr-title">Photo Upload Portal</h1>
            <p className="qr-subtitle">
              Scan the QR code to upload photos from your mobile device
            </p>
            
            <div className="qr-code-placeholder">
              {showQRCode && createdEvent && qrCodeDataURL ? (
                <div className="qr-code-display">
                  <div className="qr-code-image">
                    <img 
                      src={qrCodeDataURL} 
                      alt="QR Code" 
                      style={{
                        width: '280px',
                        height: '280px',
                        border: '1px solid #333333',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  <div className="qr-code-info">
                    <h4 style={{ color: '#ffffff', margin: '1rem 0 0.5rem 0' }}>
                      {createdEvent.name}
                    </h4>
                    <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
                      Event Date: {createdEvent.date}
                    </p>
                    <p style={{ color: '#aaaaaa', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Scan this QR code to upload photos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="qr-placeholder-content">
                  Your QR code will appear here when generated
                </div>
              )}
            </div>
            
            <p className="qr-instructions">
              This QR code will direct users to the upload page where they can select and upload photos.
            </p>
            
            {!showCreateForm ? (
              <div className="qr-actions">
                {!createdEvent ? (
                  <button 
                    className="qr-action-btn qr-action-primary" 
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create New Event QR Code
                  </button>
                ) : (
                  <button 
                    className="qr-action-btn qr-action-primary" 
                    onClick={handleCreateQR}
                  >
                    Create QR Code
                  </button>
                )}
                <button 
                  className="qr-action-btn" 
                  onClick={handlePrintA5}
                >
                  Print
                </button>
                <button 
                  className="qr-action-btn" 
                  onClick={handleExportPDF}
                >
                  Export to PDF
                </button>
              </div>
            ) : (
              <div className="qr-create-form">
                <h3 style={{ color: '#ffffff', marginBottom: '1.5rem', textAlign: 'center' }}>
                  Create New Event
                </h3>
                <form onSubmit={handleCreateEvent}>
                  <div className="form-group">
                    <label htmlFor="eventName">Event Name *</label>
                    <input
                      type="text"
                      id="eventName"
                      name="name"
                      value={eventData.name}
                      onChange={handleEventDataChange}
                      required
                      placeholder="e.g., Sarah & John Wedding"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="eventDate">Event Date *</label>
                    <input
                      type="date"
                      id="eventDate"
                      name="date"
                      value={eventData.date}
                      onChange={handleEventDataChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="eventDescription">Description (Optional)</label>
                    <textarea
                      id="eventDescription"
                      name="description"
                      value={eventData.description}
                      onChange={handleEventDataChange}
                      placeholder="Brief description of the event..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #333333',
                        backgroundColor: '#222222',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div className="qr-form-actions">
                    <button 
                      type="submit" 
                      className="qr-action-btn qr-action-primary"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating Event...' : 'Create Event & Generate QR Code'}
                    </button>
                    <button 
                      type="button" 
                      className="qr-action-btn"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Google Drive Warning Popup */}
      {showGoogleDriveWarning && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>⚠️ Google Drive Not Connected</h3>
            </div>
            <div className="popup-body">
              <p>
                You haven&apos;t connected your Google Drive yet. Without Google Drive connection, 
                uploaded photos and videos won&apos;t be automatically saved to your cloud storage.
              </p>
              <p>
                <strong>We recommend connecting Google Drive first for the best experience.</strong>
              </p>
            </div>
            <div className="popup-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleCancelEvent}
              >
                Cancel & Connect Drive
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleProceedWithoutDrive}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
