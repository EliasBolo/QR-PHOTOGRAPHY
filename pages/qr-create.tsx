import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function QrCreate() {
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@admin.com'
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

  // Load user logo from localStorage on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('userLogo')
    if (savedLogo) {
      setUserLogo(savedLogo)
    }
  }, [])

  const handleLogout = () => {
    // Simulate logout
    window.location.href = '/'
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
    
    setIsCreating(true)
    
    // Simulate event creation
    setTimeout(() => {
      const newEvent = {
        id: Date.now().toString(),
        name: eventData.name,
        date: eventData.date,
        description: eventData.description,
        status: 'active',
        uploads: 0,
        createdAt: new Date().toISOString().split('T')[0],
        qrCodeUrl: `/api/qr/${Date.now()}`
      }
      
      setCreatedEvent(newEvent)
      setIsCreating(false)
      setShowCreateForm(false)
      setShowQRCode(true)
      
      // Store in localStorage for persistence (in real app, this would be API call)
      const existingEvents = JSON.parse(localStorage.getItem('qrEvents') || '[]')
      existingEvents.push(newEvent)
      localStorage.setItem('qrEvents', JSON.stringify(existingEvents))
      
      alert('Event created successfully! QR code is now ready.')
    }, 1500)
  }

  const handleCreateQR = async () => {
    if (createdEvent) {
      try {
        // Generate QR code that links to upload page
        const uploadUrl = `${window.location.origin}/upload/${createdEvent.id}`
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
    </>
  )
}
