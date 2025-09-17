import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function MobileUpload() {
  const router = useRouter()
  const { eventId } = router.query
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const MAX_SIZE_MB = 200
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

  useEffect(() => {
    if (eventId) {
      console.log('Looking for event ID:', eventId)
      
      // For mobile devices, just allow uploads without checking if event exists
      // This ensures the upload page works regardless of localStorage or database issues
      console.log('Allowing upload for event ID:', eventId)
      setError('')
    }
  }, [eventId])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newTotalSize = files.reduce((sum, file) => sum + file.size, 0)
    
    if (newTotalSize > MAX_SIZE_BYTES) {
      setError(`Total file size cannot exceed ${MAX_SIZE_MB}MB. Current size: ${(newTotalSize / 1024 / 1024).toFixed(1)}MB`)
      return
    }
    
    setError('')
    setUploadedFiles(files)
    setTotalSize(newTotalSize)
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please select files to upload')
      return
    }
    
    if (!privacyAccepted) {
      setError('Please accept the privacy policy to continue')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      const formData = new FormData()
      formData.append('eventId', eventId as string)
      
      uploadedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload/public', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      console.log('Upload response:', response.status, result)

      if (response.ok) {
        setUploadProgress(100)
        setSuccess(`Successfully uploaded ${result.files.length} file(s)!`)
        setUploadedFiles([])
        setTotalSize(0)
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000)
      } else {
        console.log('Upload failed:', result)
        setError(result.error || 'Upload failed. Please try again.')
      }
    } catch (error) {
      setError('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + 'MB'
  }

  return (
    <>
      <Head>
        <title>Upload Photos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Upload your photos and videos" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              margin: '0 0 0.5rem 0',
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📸 Upload Photos
            </h1>
            <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Select photos and videos to share
            </p>
          </div>

          {/* File Input */}
          <div style={{
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '2px dashed #444444'
          }}>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#333333',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '1rem'
              }}
              disabled={uploading}
            />
            
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#4ecdc4', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                  Selected {uploadedFiles.length} file(s) - {formatFileSize(totalSize)}
                </p>
                <div style={{ fontSize: '0.8rem', color: '#888888' }}>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                      {file.name} ({formatFileSize(file.size)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Size Warning */}
          {totalSize > 0 && (
            <div style={{
              background: totalSize > MAX_SIZE_BYTES * 0.8 ? '#ff6b6b20' : '#4ecdc420',
              border: `1px solid ${totalSize > MAX_SIZE_BYTES * 0.8 ? '#ff6b6b' : '#4ecdc4'}`,
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ 
                margin: 0, 
                color: totalSize > MAX_SIZE_BYTES * 0.8 ? '#ff6b6b' : '#4ecdc4',
                fontSize: '0.9rem'
              }}>
                {totalSize > MAX_SIZE_BYTES * 0.8 ? '⚠️ ' : '📊 '}
                {formatFileSize(totalSize)} / {MAX_SIZE_MB}MB
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#ff6b6b20',
              border: '1px solid #ff6b6b',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#ff6b6b', fontSize: '0.9rem' }}>
                ❌ {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              background: '#4ecdc420',
              border: '1px solid #4ecdc4',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#4ecdc4', fontSize: '0.9rem' }}>
                ✅ {success}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || uploadedFiles.length === 0 || totalSize > MAX_SIZE_BYTES}
            style={{
              width: '100%',
              padding: '1rem',
              background: uploading || uploadedFiles.length === 0 || totalSize > MAX_SIZE_BYTES 
                ? '#444444' 
                : 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: uploading || uploadedFiles.length === 0 || totalSize > MAX_SIZE_BYTES 
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {uploading ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Uploading... {uploadProgress}%
                </div>
              </>
            ) : (
              '📤 Upload Files'
            )}
          </button>

          {/* Privacy Policy Checkbox */}
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            textAlign: 'left'
          }}>
            <input
              type="checkbox"
              id="privacy-checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              style={{
                marginTop: '0.2rem',
                transform: 'scale(1.2)',
                accentColor: '#007bff'
              }}
            />
            <label 
              htmlFor="privacy-checkbox"
              style={{
                color: '#cccccc',
                fontSize: '0.9rem',
                lineHeight: '1.4',
                cursor: 'pointer',
                flex: 1
              }}
            >
              I have read and accept the{' '}
              <a 
                href="/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#007bff',
                  textDecoration: 'underline',
                  fontWeight: '500'
                }}
              >
                privacy policy
              </a>
              {' '}about uploading my files
            </label>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div style={{
              marginTop: '1rem',
              background: '#333333',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '6px',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
