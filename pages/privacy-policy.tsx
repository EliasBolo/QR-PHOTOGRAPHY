import Head from 'next/head'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - QR Photography</title>
        <meta name="description" content="Privacy Policy for QR Photography - Learn how we handle your uploaded files and personal data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        color: '#e0e0e0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '3rem',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: '2.5rem',
              margin: '0 0 1rem 0',
              color: '#ffffff',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}>
              Privacy Policy
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#cccccc',
              margin: 0
            }}>
              QR Photography - File Upload Service
            </p>
            <p style={{
              fontSize: '0.9rem',
              color: '#aaaaaa',
              margin: '0.5rem 0 0 0'
            }}>
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div style={{ lineHeight: '1.8', fontSize: '1rem' }}>
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                1. Information We Collect
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                When you upload files through our QR code service, we collect:
              </p>
              <ul style={{ color: '#e0e0e0', paddingLeft: '1.5rem' }}>
                <li>Photos and videos you choose to upload</li>
                <li>File metadata (size, type, upload timestamp)</li>
                <li>Event information (event name, date) associated with your uploads</li>
                <li>Technical information (IP address, browser type) for service functionality</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                2. How We Use Your Files
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                Your uploaded files are used exclusively for:
              </p>
              <ul style={{ color: '#e0e0e0', paddingLeft: '1.5rem' }}>
                <li>Storing in the event organizer&apos;s private Google Drive account</li>
                <li>Organizing files by event for easy access by the event organizer</li>
                <li>Providing a secure, private photo sharing service</li>
                <li>Maintaining service functionality and performance</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                3. File Storage and Security
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>Private Storage:</strong> Your files are stored in the event organizer&apos;s personal Google Drive account, not on our servers. This ensures your photos remain private and under the organizer&apos;s control.
              </p>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>Secure Transfer:</strong> Files are transferred using secure HTTPS encryption during upload.
              </p>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>No Public Access:</strong> Your uploaded files are not publicly accessible and are only available to the event organizer.
              </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                4. Data Sharing
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                We do not share your uploaded files with third parties. Your files are only accessible to:
              </p>
              <ul style={{ color: '#e0e0e0', paddingLeft: '1.5rem' }}>
                <li>The event organizer who created the QR code</li>
                <li>Authorized personnel for technical support (if needed)</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                5. File Retention
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                Your uploaded files remain in the event organizer&apos;s Google Drive account according to their storage policies. We do not automatically delete your files, and the event organizer has full control over file management.
              </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                6. Your Rights
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                You have the right to:
              </p>
              <ul style={{ color: '#e0e0e0', paddingLeft: '1.5rem' }}>
                <li>Choose which files to upload</li>
                <li>Contact the event organizer to request file removal</li>
                <li>Withdraw consent by not uploading additional files</li>
              </ul>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                7. Service Limitations
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>File Size Limit:</strong> Maximum 200MB total per upload session.
              </p>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>File Types:</strong> Photos and videos only. We reserve the right to reject inappropriate content.
              </p>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>No Guarantees:</strong> While we strive for reliable service, we cannot guarantee 100% uptime or file delivery.
              </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                8. Contact Information
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                For questions about this privacy policy or your uploaded files, please contact:
              </p>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                <strong>QR Photography Service</strong><br />
                Developed by CodeRunner2049 Studios<br />
                All Rights Reserved
              </p>
            </section>

            <section>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                9. Changes to This Policy
              </h2>
              <p style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Link href="/" style={{
              color: '#007bff',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
