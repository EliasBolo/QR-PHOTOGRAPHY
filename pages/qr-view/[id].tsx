import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface QREvent {
  id: string
  name: string
  date: string
  status: 'active' | 'inactive' | 'completed'
  uploads: number
  createdAt: string
  qrCodeUrl?: string
  description?: string
}

export default function QrView() {
  const router = useRouter()
  const { id } = router.query
  
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@admin.com'
  })

  const [userLogo, setUserLogo] = useState<string | null>(null)
  const [event, setEvent] = useState<QREvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')

  useEffect(() => {
    if (id) {
      // Load user logo from localStorage
      const savedLogo = localStorage.getItem('userLogo')
      if (savedLogo) {
        setUserLogo(savedLogo)
      }
      
      // Load events from localStorage
      const savedEvents = localStorage.getItem('qrEvents')
      if (savedEvents) {
        const events = JSON.parse(savedEvents)
        const foundEvent = events.find((e: QREvent) => e.id === id)
        if (foundEvent) {
          setEvent(foundEvent)
          // Generate QR code for this event
          generateQRCode(foundEvent)
        } else {
          // Event not found, redirect to QR list
          router.push('/qr-list')
        }
      } else {
        // No events found, redirect to QR list
        router.push('/qr-list')
      }
      setLoading(false)
    }
  }, [id, router])

  const generateQRCode = async (event: QREvent) => {
    try {
      const uploadUrl = `${window.location.origin}/upload/${event.id}`
      const qrDataURL = await QRCode.toDataURL(uploadUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataURL(qrDataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleLogout = () => {
    window.location.href = '/'
  }

  const handlePrintA5 = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    if (!event) return
    
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
      pdf.save(`${event.name || 'qr-code'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to simple download
      const link = document.createElement('a')
      link.href = '#'
      link.download = `${event?.name || 'qr-code'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - QR Photography</title>
        </Head>
        <nav className="nav">
          <div className="nav-title">QR Photography</div>
          <div className="nav-buttons">
            <Link href="/qr-list" className="btn btn-small">
              ← Back to Events
            </Link>
            <span style={{ color: '#cccccc', marginRight: '1rem' }}>
              Welcome, {user.name}
            </span>
            <button onClick={handleLogout} className="btn btn-small">
              Logout
            </button>
          </div>
        </nav>
        <main className="dashboard">
          <div className="container">
            <div className="qr-card">
              <h1 className="qr-title">Loading...</h1>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Head>
          <title>Event Not Found - QR Photography</title>
        </Head>
        <nav className="nav">
          <div className="nav-title">QR Photography</div>
          <div className="nav-buttons">
            <Link href="/qr-list" className="btn btn-small">
              ← Back to Events
            </Link>
            <span style={{ color: '#cccccc', marginRight: '1rem' }}>
              Welcome, {user.name}
            </span>
            <button onClick={handleLogout} className="btn btn-small">
              Logout
            </button>
          </div>
        </nav>
        <main className="dashboard">
          <div className="container">
            <div className="qr-card">
              <h1 className="qr-title">Event Not Found</h1>
              <p className="qr-subtitle">
                The requested event could not be found.
              </p>
              <Link href="/qr-list" className="btn btn-primary">
                Back to Events
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{event.name} - QR Photography</title>
        <meta name="description" content={`QR code for ${event.name}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Header */}
      <nav className="nav">
        <div className="nav-title">QR Photography</div>
        <div className="nav-buttons">
          <Link href="/qr-list" className="btn btn-small">
            ← Back to Events
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
              {qrCodeDataURL ? (
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
                      {event.name}
                    </h4>
                    <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
                      Event Date: {event.date}
                    </p>
                    {event.description && (
                      <p style={{ color: '#aaaaaa', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        {event.description}
                      </p>
                    )}
                    <p style={{ color: '#aaaaaa', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Scan this QR code to upload photos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="qr-placeholder-content">
                  Generating QR code...
                </div>
              )}
            </div>
            
            <p className="qr-instructions">
              This QR code will direct users to the upload page where they can select and upload photos.
            </p>
            
            <div className="qr-actions">
              <button className="qr-action-btn" onClick={handlePrintA5}>
                Print
              </button>
              <button className="qr-action-btn" onClick={handleExportPDF}>
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
