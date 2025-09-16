import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

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

export default function UploadPage() {
  const router = useRouter()
  const { eventId } = router.query
  
  const [event, setEvent] = useState<QREvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (eventId) {
      // Load event from localStorage
      const savedEvents = localStorage.getItem('qrEvents')
      if (savedEvents) {
        const events = JSON.parse(savedEvents)
        const foundEvent = events.find((e: QREvent) => e.id === eventId)
        if (foundEvent) {
          setEvent(foundEvent)
        }
      }
      setLoading(false)
    }
  }, [eventId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please select some photos to upload!')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // TODO: Implement Google Drive upload
      // This will be replaced with actual Google Drive API calls
      
      // Simulate upload progress for now
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // TODO: Replace with actual Google Drive upload
      // await uploadToGoogleDrive(uploadedFiles, event.id)

      // Simulate successful upload
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        setUploadedFiles([])
        alert(`Successfully uploaded ${uploadedFiles.length} photos to Google Drive!`)
      }, 500)
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
      setUploadProgress(0)
      alert('Upload failed. Please try again.')
    }
  }

  // TODO: Implement Google Drive upload function
  const uploadToGoogleDrive = async (files: File[], eventId: string) => {
    // This function will:
    // 1. Authenticate with Google Drive API
    // 2. Create or find the event-specific folder
    // 3. Upload each file to the folder
    // 4. Return upload status
    console.log('Google Drive upload not yet implemented')
    console.log('Files to upload:', files)
    console.log('Event ID:', eventId)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - QR Photography</title>
        </Head>
        <div className="upload-page">
          <div className="upload-container">
            <div className="upload-card">
              <h1>Loading...</h1>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Head>
          <title>Event Not Found - QR Photography</title>
        </Head>
        <div className="upload-page">
          <div className="upload-container">
            <div className="upload-card">
              <h1>Event Not Found</h1>
              <p>The requested event could not be found.</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Upload Photos - {event.name}</title>
        <meta name="description" content={`Upload photos for ${event.name}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="upload-page">
        <div className="upload-container">
          <div className="upload-card">
            <h1 className="upload-title">Upload Photos</h1>
            <div className="event-info">
              <h2>{event.name}</h2>
              <p>Event Date: {event.date}</p>
              {event.description && <p>{event.description}</p>}
            </div>

            <div className="upload-section">
              <div className="file-input-container">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-upload" className="file-input-label">
                  📸 Select Photos & Videos
                </label>
                <p className="upload-hint">
                  Select multiple photos and videos from your device
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="selected-files">
                  <h3>Selected Files ({uploadedFiles.length})</h3>
                  <div className="file-list">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button 
                          onClick={() => removeFile(index)}
                          className="remove-file-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p>Uploading... {uploadProgress}%</p>
                </div>
              )}

              <button 
                onClick={handleUpload}
                disabled={uploadedFiles.length === 0 || uploading}
                className="upload-btn"
              >
                {uploading ? 'Uploading...' : `Upload ${uploadedFiles.length} Files`}
              </button>
            </div>

            <div className="upload-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Select photos and videos from your device</li>
                <li>Supported formats: JPG, PNG, MP4, MOV</li>
                <li>Maximum file size: 50MB per file</li>
                <li>Your photos will be uploaded to the event's Google Drive folder</li>
                <li>Files are automatically organized by event</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
