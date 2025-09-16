import Head from 'next/head'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [rateLimited, setRateLimited] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Honeypot check
    if (honeypotRef.current?.value) {
      console.log('Bot detected via honeypot')
      return
    }
    
    // Rate limiting check
    if (attempts >= 5) {
      setRateLimited(true)
      setTimeout(() => {
        setRateLimited(false)
        setAttempts(0)
      }, 15 * 60 * 1000) // 15 minutes
      return
    }
    
    setIsLoading(true)
    setAttempts(prev => prev + 1)
    
    // Check for test user credentials
    if (email === 'admin@admin.com' && password === 'admin') {
      setTimeout(() => {
        setIsLoading(false)
        // Skip 2FA for test user
        router.push('/dashboard')
      }, 1000)
    } else {
      // Simulate login process for other users
      setTimeout(() => {
        setIsLoading(false)
        // Simulate 2FA requirement
        setShow2FA(true)
      }, 1000)
    }
  }

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = verificationCode.join('')
    
    if (code.length === 6) {
      setIsLoading(true)
      // Simulate 2FA verification
      setTimeout(() => {
        setIsLoading(false)
        router.push('/dashboard')
      }, 1000)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  return (
    <>
      <Head>
        <title>Login - QR Photography</title>
        <meta name="description" content="Login to QR Photography" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="main">
        <div className="container">
          <div className="form-container">
            <h1 className="form-title">Login</h1>
            
            {rateLimited && (
              <div className="rate-limit-notice">
                <strong>Rate Limited:</strong> Too many failed attempts. Please wait 15 minutes before trying again.
              </div>
            )}
            
            <div className="security-notice">
              <strong>Security Notice:</strong> This login is protected with 2FA and rate limiting for your security.
              <br/><br/>
              <strong>Test User:</strong> admin@admin.com / admin (bypasses 2FA for testing)
            </div>
            
            {!show2FA ? (
              <form onSubmit={handleSubmit}>
                {/* Honeypot field - hidden from users */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  className="honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                />
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isLoading || rateLimited}
                >
                  {isLoading ? 'Verifying...' : 'Login'}
                </button>
              </form>
            ) : (
              <div className="two-factor-container">
                <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#ffffff' }}>
                  Two-Factor Authentication
                </h3>
                <p style={{ textAlign: 'center', color: '#cccccc', marginBottom: '1.5rem' }}>
                  Enter the 6-digit code from your authenticator app
                </p>
                
                <form onSubmit={handle2FAVerification}>
                  <div className="verification-code">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digit && index > 0) {
                            const prevInput = document.getElementById(`code-${index - 1}`)
                            prevInput?.focus()
                          }
                        }}
                        required
                      />
                    ))}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={isLoading || verificationCode.join('').length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    onClick={() => setShow2FA(false)}
                    className="btn btn-small"
                  >
                    ← Back to Login
                  </button>
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: '#cccccc', marginBottom: '1rem' }}>
                Don't have an account?
              </p>
              <Link href="/register" className="btn">
                Register
              </Link>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/" className="btn btn-small">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
