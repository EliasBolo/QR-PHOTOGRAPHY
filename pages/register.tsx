import Head from 'next/head'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [passwordStrength, setPasswordStrength] = useState('')
  const [rateLimited, setRateLimited] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const checkPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    if (strength < 3) return 'weak'
    if (strength < 5) return 'medium'
    return 'strong'
  }

  const getPasswordRequirements = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!', formData)
    
    // Honeypot check
    if (honeypotRef.current?.value) {
      console.log('Bot detected via honeypot')
      return
    }
    
    // Rate limiting check
    if (attempts >= 3) {
      setRateLimited(true)
      setTimeout(() => {
        setRateLimited(false)
        setAttempts(0)
      }, 10 * 60 * 1000) // 10 minutes
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    if (checkPasswordStrength(formData.password) === 'weak') {
      alert('Password is too weak. Please use a stronger password.')
      return
    }
    
    console.log('Starting registration process...')
    setIsLoading(true)
    setAttempts(prev => prev + 1)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        // Registration successful
        router.push('/dashboard')
      } else {
        // Registration failed
        alert(result.error || 'Registration failed')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = verificationCode.join('')
    
    if (code.length === 6) {
      setIsLoading(true)
      // Simulate 2FA setup completion
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
        <title>Register - QR Photography</title>
        <meta name="description" content="Register for QR Photography" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="main">
        <div className="container">
          <div className="form-container">
            <h1 className="form-title">Register</h1>
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
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  Password
                  <span className="tooltip" style={{ marginLeft: '0.5rem' }}>
                    ?
                    <span className="tooltiptext">
                      <strong>Password Requirements:</strong><br/>
                      • At least 8 characters long<br/>
                      • Include uppercase letters (A-Z)<br/>
                      • Include lowercase letters (a-z)<br/>
                      • Include numbers (0-9)<br/>
                      • Include special characters (!@#$%^&*)<br/>
                      <br/>
                      <strong>Tips:</strong><br/>
                      • Use a unique password for this account<br/>
                      • Consider using a password manager<br/>
                      • Avoid common words or personal info
                    </span>
                  </span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a strong password"
                />
                {formData.password && (
                  <div className="password-requirements">
                    <strong>Password Requirements:</strong>
                    <ul>
                      <li className={formData.password.length >= 8 ? 'met' : 'unmet'}>
                        At least 8 characters long
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'met' : 'unmet'}>
                        Contains uppercase letters
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'met' : 'unmet'}>
                        Contains lowercase letters
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? 'met' : 'unmet'}>
                        Contains numbers
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'met' : 'unmet'}>
                        Contains special characters
                      </li>
                    </ul>
                    <div className={`password-strength ${passwordStrength}`}>
                      Password strength: <strong>{passwordStrength.toUpperCase()}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password
                  <span className="tooltip" style={{ marginLeft: '0.5rem' }}>
                    ?
                    <span className="tooltiptext">
                      <strong>Password Confirmation:</strong><br/>
                      • Must match the password above exactly<br/>
                      • Helps prevent typing errors<br/>
                      • Ensures you remember your password
                    </span>
                  </span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter your password"
                />
                {formData.confirmPassword && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.8rem',
                    color: formData.password === formData.confirmPassword ? '#66bb6a' : '#ff6b6b'
                  }}>
                    {formData.password === formData.confirmPassword ? 
                      '✅ Passwords match' : 
                      '❌ Passwords do not match'
                    }
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: '#cccccc', marginBottom: '1rem' }}>
                Already have an account?
              </p>
              <Link href="/login" className="btn">
                Login
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
