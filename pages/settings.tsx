import Head from 'next/head'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function Settings() {
  const { data: session, status } = useSession()
  
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@admin.com',
    phone: '+1 (555) 123-4567',
    company: 'Tombros Photography'
  })

  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // Profile form state
  const [profileData, setProfileData] = useState(user)
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordStrength, setPasswordStrength] = useState('')
  
  // Branding state
  const [userLogo, setUserLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Google Drive state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [driveStorage, setDriveStorage] = useState({
    used: '0 GB',
    total: '0 GB',
    percentage: 0,
    usageInDrive: '0 GB',
    usageInDriveTrash: '0 GB'
  })
  const [driveFolderId, setDriveFolderId] = useState('')
  const [storageLoading, setStorageLoading] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState({
    plan: 'Pro',
    status: 'Active',
    nextBilling: '2024-12-15',
    price: '$29.99/month',
    features: ['Unlimited QR codes', 'Google Drive integration', 'Priority support']
  })

  const honeypotRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Load user logo from localStorage on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('userLogo')
    if (savedLogo) {
      setUserLogo(savedLogo)
    }
  }, [])

  // Fetch storage quota information
  const fetchStorageQuota = useCallback(async () => {
    if (!session?.accessToken) return
    
    setStorageLoading(true)
    try {
      const response = await fetch('/api/google-drive/storage')
      if (response.ok) {
        const result = await response.json()
        setDriveStorage(result.storage)
      }
    } catch (error) {
      console.error('Error fetching storage quota:', error)
    } finally {
      setStorageLoading(false)
    }
  }, [session?.accessToken])

  // Check Google Drive connection status when session changes
  useEffect(() => {
    const checkGoogleDriveConnection = async () => {
      if (session?.accessToken) {
        try {
          const response = await fetch('/api/google-drive/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const result = await response.json()
            setGoogleDriveConnected(true)
            setDriveFolderId(result.mainFolderId)
            // Fetch storage quota after successful connection
            fetchStorageQuota()
          }
        } catch (error) {
          console.error('Error checking Google Drive connection:', error)
        }
      }
    }

    checkGoogleDriveConnection()
  }, [session, fetchStorageQuota])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file')
        setMessageType('error')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB')
        setMessageType('error')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      
      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoSave = async () => {
    if (!logoFile) {
      setMessage('Please select a logo file first')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    setIsLoading(true)
    
    // Simulate API call - in real implementation, upload to server
    setTimeout(() => {
      // Save logo to localStorage (in real app, this would be saved to server)
      if (logoPreview) {
        localStorage.setItem('userLogo', logoPreview)
        setUserLogo(logoPreview)
        setLogoFile(null)
        setLogoPreview(null)
        if (logoInputRef.current) {
          logoInputRef.current.value = ''
        }
        setIsLoading(false)
        setMessage('Logo uploaded successfully!')
        setMessageType('success')
        setTimeout(() => setMessage(''), 3000)
      }
    }, 1000)
  }

  const handleLogoRemove = () => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      localStorage.removeItem('userLogo')
      setUserLogo(null)
      setLogoFile(null)
      setLogoPreview(null)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
      setIsLoading(false)
      setMessage('Logo removed successfully!')
      setMessageType('success')
      setTimeout(() => setMessage(''), 3000)
    }, 500)
  }

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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value
    })
    
    if (name === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value))
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Honeypot check
    if (honeypotRef.current?.value) {
      console.log('Bot detected via honeypot')
      return
    }
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setUser(profileData)
      setIsLoading(false)
      setMessage('Profile updated successfully!')
      setMessageType('success')
      setTimeout(() => setMessage(''), 3000)
    }, 1000)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    if (checkPasswordStrength(passwordData.newPassword) === 'weak') {
      setMessage('Password is too weak. Please use a stronger password.')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage('Password changed successfully!')
      setMessageType('success')
      setTimeout(() => setMessage(''), 3000)
    }, 1000)
  }

  const handleGoogleDriveConnect = async () => {
    setIsLoading(true)
    
    try {
      // Check if user is already signed in
      if (session?.accessToken) {
        // User is already authenticated, test the connection
        const response = await fetch('/api/google-drive/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()
        
        if (response.ok) {
          setGoogleDriveConnected(true)
          setDriveFolderId(result.mainFolderId)
          setMessage('Google Drive connected successfully!')
          setMessageType('success')
        } else {
          setMessage(result.error || 'Failed to connect to Google Drive')
          setMessageType('error')
        }
      } else {
        // User needs to sign in first
        await signIn('google', { 
          callbackUrl: '/settings?tab=storage&connected=true',
          redirect: true 
        })
      }
    } catch (error) {
      console.error('Google Drive connection error:', error)
      setMessage('Failed to connect to Google Drive')
      setMessageType('error')
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleGoogleDriveDisconnect = async () => {
    setIsLoading(true)
    
    try {
      // Sign out from Google
      await signOut({ redirect: false })
      
      setGoogleDriveConnected(false)
      setDriveFolderId('')
      setMessage('Google Drive disconnected successfully!')
      setMessageType('success')
    } catch (error) {
      console.error('Google Drive disconnection error:', error)
      setMessage('Failed to disconnect from Google Drive')
      setMessageType('error')
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSubscriptionChange = (newPlan: string) => {
    setIsLoading(true)
    
    // Simulate subscription change
    setTimeout(() => {
      setSubscription({
        ...subscription,
        plan: newPlan,
        price: newPlan === 'Basic' ? '$9.99/month' : newPlan === 'Pro' ? '$29.99/month' : '$99.99/month'
      })
      setIsLoading(false)
      setMessage(`Subscription changed to ${newPlan} plan!`)
      setMessageType('success')
      setTimeout(() => setMessage(''), 3000)
    }, 1000)
  }

  const handleLogout = () => {
    window.location.href = '/'
  }

  return (
    <>
      <Head>
        <title>Settings - QR Photography</title>
        <meta name="description" content="Manage your account settings" />
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
          <h1 className="settings-title">Account Settings</h1>
          
          {message && (
            <div className={`settings-message ${messageType}`}>
              {message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="settings-tabs">
            <button 
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Password
            </button>
            <button 
              className={`settings-tab ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              Subscription
            </button>
            <button 
              className={`settings-tab ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              Branding
            </button>
            <button 
              className={`settings-tab ${activeTab === 'storage' ? 'active' : ''}`}
              onClick={() => setActiveTab('storage')}
            >
              Google Drive
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Profile Information</h2>
              <form onSubmit={handleProfileSubmit}>
                {/* Honeypot field */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  className="honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                />
                
                <div className="settings-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={profileData.company}
                    onChange={handleProfileChange}
                    placeholder="Enter your company name"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="settings-btn settings-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Change Password</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="settings-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="newPassword">
                    New Password
                    <span className="tooltip" style={{ marginLeft: '0.5rem' }}>
                      ?
                      <span className="tooltiptext">
                        <strong>Password Requirements:</strong><br/>
                        • At least 8 characters long<br/>
                        • Include uppercase letters (A-Z)<br/>
                        • Include lowercase letters (a-z)<br/>
                        • Include numbers (0-9)<br/>
                        • Include special characters (!@#$%^&*)
                      </span>
                    </span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Enter your new password"
                  />
                  {passwordData.newPassword && (
                    <div className="password-requirements">
                      <strong>Password Requirements:</strong>
                      <ul>
                        <li className={passwordData.newPassword.length >= 8 ? 'met' : 'unmet'}>
                          At least 8 characters long
                        </li>
                        <li className={/[A-Z]/.test(passwordData.newPassword) ? 'met' : 'unmet'}>
                          Contains uppercase letters
                        </li>
                        <li className={/[a-z]/.test(passwordData.newPassword) ? 'met' : 'unmet'}>
                          Contains lowercase letters
                        </li>
                        <li className={/[0-9]/.test(passwordData.newPassword) ? 'met' : 'unmet'}>
                          Contains numbers
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'met' : 'unmet'}>
                          Contains special characters
                        </li>
                      </ul>
                      <div className={`password-strength ${passwordStrength}`}>
                        Password strength: <strong>{passwordStrength.toUpperCase()}</strong>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="settings-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Confirm your new password"
                  />
                  {passwordData.confirmPassword && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.8rem',
                      color: passwordData.newPassword === passwordData.confirmPassword ? '#66bb6a' : '#ff6b6b'
                    }}>
                      {passwordData.newPassword === passwordData.confirmPassword ? 
                        '✅ Passwords match' : 
                        '❌ Passwords do not match'
                      }
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="settings-btn settings-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Subscription Management</h2>
              
              <div className="subscription-current">
                <h3>Current Plan</h3>
                <div className="subscription-info">
                  <div className="subscription-plan">
                    <span className="plan-name">{subscription.plan}</span>
                    <span className="plan-price">{subscription.price}</span>
                  </div>
                  <div className="subscription-status">
                    <span className={`status-badge ${subscription.status.toLowerCase()}`}>
                      {subscription.status}
                    </span>
                    <span className="next-billing">Next billing: {subscription.nextBilling}</span>
                  </div>
                </div>
              </div>

              <div className="subscription-plans">
                <h3>Available Plans</h3>
                <div className="plans-grid">
                  <div className="plan-card">
                    <h4>Basic</h4>
                    <div className="plan-price">$9.99/month</div>
                    <ul className="plan-features">
                      <li>Up to 10 QR codes</li>
                      <li>Basic support</li>
                      <li>Standard storage</li>
                    </ul>
                    <button 
                      className={`plan-btn ${subscription.plan === 'Basic' ? 'current' : ''}`}
                      onClick={() => handleSubscriptionChange('Basic')}
                      disabled={isLoading || subscription.plan === 'Basic'}
                    >
                      {subscription.plan === 'Basic' ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>

                  <div className="plan-card featured">
                    <div className="plan-badge">Most Popular</div>
                    <h4>Pro</h4>
                    <div className="plan-price">$29.99/month</div>
                    <ul className="plan-features">
                      <li>Unlimited QR codes</li>
                      <li>Google Drive integration</li>
                      <li>Priority support</li>
                      <li>Advanced analytics</li>
                    </ul>
                    <button 
                      className={`plan-btn ${subscription.plan === 'Pro' ? 'current' : ''}`}
                      onClick={() => handleSubscriptionChange('Pro')}
                      disabled={isLoading || subscription.plan === 'Pro'}
                    >
                      {subscription.plan === 'Pro' ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>

                  <div className="plan-card">
                    <h4>Enterprise</h4>
                    <div className="plan-price">$99.99/month</div>
                    <ul className="plan-features">
                      <li>Everything in Pro</li>
                      <li>Custom branding</li>
                      <li>API access</li>
                      <li>Dedicated support</li>
                    </ul>
                    <button 
                      className={`plan-btn ${subscription.plan === 'Enterprise' ? 'current' : ''}`}
                      onClick={() => handleSubscriptionChange('Enterprise')}
                      disabled={isLoading || subscription.plan === 'Enterprise'}
                    >
                      {subscription.plan === 'Enterprise' ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Branding Settings</h2>
              
              <div className="branding-section">
                <h3>Company Logo</h3>
                <p className="branding-description">
                  Upload your company logo to customize your QR code pages. The logo will appear above the title on all your QR code displays and in printed/PDF versions.
                </p>
                
                <div className="logo-upload-section">
                  {userLogo ? (
                    <div className="current-logo">
                      <h4>Current Logo</h4>
                      <div className="logo-preview">
                        <img 
                          src={userLogo} 
                          alt="Current Logo" 
                          className="logo-image"
                        />
                      </div>
                      <div className="logo-actions">
                        <button 
                          onClick={handleLogoRemove}
                          className="settings-btn settings-btn-danger"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Removing...' : 'Remove Logo'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="no-logo">
                      <div className="no-logo-icon">📷</div>
                      <h4>No Logo Uploaded</h4>
                      <p>Upload a logo to customize your QR code pages</p>
                    </div>
                  )}
                  
                  <div className="logo-upload-form">
                    <h4>{userLogo ? 'Replace Logo' : 'Upload Logo'}</h4>
                    <div className="logo-upload-area">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="logo-file-input"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="logo-upload-label">
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">
                          <strong>Choose Logo File</strong>
                          <span>PNG, JPG, GIF up to 5MB</span>
                        </div>
                      </label>
                    </div>
                    
                    {logoPreview && (
                      <div className="logo-preview-new">
                        <h5>Preview</h5>
                        <div className="preview-image">
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            className="logo-image"
                          />
                        </div>
                        <button 
                          onClick={handleLogoSave}
                          className="settings-btn settings-btn-primary"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Saving...' : 'Save Logo'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="branding-info">
                  <h4>Logo Guidelines</h4>
                  <ul>
                    <li>Recommended size: 200x200 pixels or larger</li>
                    <li>Supported formats: PNG, JPG, GIF</li>
                    <li>Maximum file size: 5MB</li>
                    <li>For best results, use a square logo with transparent background</li>
                    <li>Logo will be automatically resized to fit the display area</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Google Drive Tab */}
          {activeTab === 'storage' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Google Drive Integration</h2>
              
              <div className="storage-status">
                <div className="storage-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Storage Status</h3>
                    <button 
                      onClick={fetchStorageQuota}
                      disabled={storageLoading || !googleDriveConnected}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#333333',
                        color: '#ffffff',
                        border: '1px solid #555555',
                        borderRadius: '4px',
                        cursor: storageLoading || !googleDriveConnected ? 'not-allowed' : 'pointer',
                        opacity: storageLoading || !googleDriveConnected ? 0.5 : 1
                      }}
                    >
                      {storageLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="storage-details">
                    <div className="storage-usage">
                      <span>Used: {driveStorage.used}</span>
                      <span>Total: {driveStorage.total}</span>
                      <span>Available: {driveStorage.total !== '0 GB' ? 
                        `${(parseFloat(driveStorage.total.replace(/[^\d.]/g, '')) - parseFloat(driveStorage.used.replace(/[^\d.]/g, ''))).toFixed(2)} GB` : 
                        '0 GB'
                      }</span>
                    </div>
                    <div className="storage-bar">
                      <div 
                        className="storage-bar-fill" 
                        style={{ 
                          width: `${driveStorage.percentage}%`,
                          backgroundColor: driveStorage.percentage > 80 ? '#ff6b6b' : driveStorage.percentage > 60 ? '#ffa726' : '#66bb6a'
                        }}
                      ></div>
                    </div>
                    <div className="storage-percentage">
                      {driveStorage.percentage}% used
                    </div>
                    {driveStorage.usageInDrive !== '0 GB' && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#aaaaaa' }}>
                        <div>Drive files: {driveStorage.usageInDrive}</div>
                        <div>Trash: {driveStorage.usageInDriveTrash}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="google-drive-section">
                  <h3>Google Drive Connection</h3>
                  <div className="connection-status" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#111111', borderRadius: '4px' }}>
                    <strong>Status:</strong> 
                    {session?.accessToken ? (
                      <span style={{ color: '#66bb6a', marginLeft: '0.5rem' }}>✅ Authenticated with Google</span>
                    ) : (
                      <span style={{ color: '#ff6b6b', marginLeft: '0.5rem' }}>❌ Not authenticated</span>
                    )}
                  </div>
                  <div className="drive-status">
                    {googleDriveConnected ? (
                      <div className="drive-connected">
                        <div className="drive-status-icon">✅</div>
                        <div className="drive-status-text">
                          <strong>Connected</strong>
                          <p>Your Google Drive is connected and ready to receive uploads.</p>
                          <p className="drive-folder-info">
                            Main folder: <code>QR Photography</code>
                          </p>
                        </div>
                        <button 
                          onClick={handleGoogleDriveDisconnect}
                          className="settings-btn settings-btn-danger"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      </div>
                    ) : (
                      <div className="drive-disconnected">
                        <div className="drive-status-icon">❌</div>
                        <div className="drive-status-text">
                          <strong>Not Connected</strong>
                          <p>Connect your Google Drive to enable automatic photo uploads.</p>
                          <div className="drive-benefits">
                            <h4>Benefits of Google Drive Integration:</h4>
                            <ul>
                              <li>Automatic folder creation for each event</li>
                              <li>Organized photo storage by event name</li>
                              <li>Easy access to all uploaded photos</li>
                              <li>Automatic backup and sync</li>
                            </ul>
                          </div>
                        </div>
                        <button 
                          onClick={handleGoogleDriveConnect}
                          className="settings-btn settings-btn-primary"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Connecting...' : 'Connect Google Drive'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {googleDriveConnected && (
                  <div className="drive-setup-info">
                    <h3>How It Works</h3>
                    <div className="setup-steps">
                      <div className="setup-step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                          <h4>Create Event</h4>
                          <p>When you create a new QR event, a folder will be automatically created in your Google Drive.</p>
                        </div>
                      </div>
                      <div className="setup-step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                          <h4>Guests Upload</h4>
                          <p>Guests scan the QR code and upload photos directly to the event&apos;s folder.</p>
                        </div>
                      </div>
                      <div className="setup-step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                          <h4>Organized Storage</h4>
                          <p>All photos are automatically organized by event in your Google Drive.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}