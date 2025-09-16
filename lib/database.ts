// Simple file-based database for demo purposes
// In production, you'd use a real database like PostgreSQL, MongoDB, etc.

import fs from 'fs'
import path from 'path'

export interface User {
  id: string
  email: string
  name: string
  password: string // In production, this should be hashed
  googleDriveConnected: boolean
  googleDriveTokens?: {
    accessToken: string
    refreshToken?: string
    expiresAt: number
  }
  createdAt: string
  lastLogin?: string
}

export interface QREvent {
  id: string
  userId: string // Link events to specific users
  name: string
  date: string
  status: 'active' | 'inactive' | 'completed'
  uploads: number
  createdAt: string
  qrCodeUrl?: string
  description?: string
}

// File-based storage for persistence
const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const EVENTS_FILE = path.join(DATA_DIR, 'events.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Load data from files
let users: User[] = []
let events: QREvent[] = []

try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
  }
  if (fs.existsSync(EVENTS_FILE)) {
    events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'))
  }
} catch (error) {
  console.error('Error loading database files:', error)
  users = []
  events = []
}

// Save data to files
const saveUsers = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

const saveEvents = () => {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2))
  } catch (error) {
    console.error('Error saving events:', error)
  }
}

export const userDatabase = {
  // User management
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'googleDriveConnected'>): User => {
    const user: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      googleDriveConnected: false
    }
    users.push(user)
    saveUsers()
    return user
  },

  getUserByEmail: (email: string): User | undefined => {
    return users.find(user => user.email === email)
  },

  getUserById: (id: string): User | undefined => {
    return users.find(user => user.id === id)
  },

  updateUser: (id: string, updates: Partial<User>): User | undefined => {
    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      saveUsers()
      return users[userIndex]
    }
    return undefined
  },

  // Google Drive token management
  updateGoogleDriveTokens: (userId: string, tokens: {
    accessToken: string
    refreshToken?: string
    expiresAt: number
  }): User | undefined => {
    return userDatabase.updateUser(userId, {
      googleDriveConnected: true,
      googleDriveTokens: tokens
    })
  },

  disconnectGoogleDrive: (userId: string): User | undefined => {
    return userDatabase.updateUser(userId, {
      googleDriveConnected: false,
      googleDriveTokens: undefined
    })
  },

  // Event management
  createEvent: (eventData: Omit<QREvent, 'id' | 'createdAt'>): QREvent => {
    const event: QREvent = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    events.push(event)
    saveEvents()
    return event
  },

  getEventsByUserId: (userId: string): QREvent[] => {
    return events.filter(event => event.userId === userId)
  },

  getEventById: (id: string): QREvent | undefined => {
    return events.find(event => event.id === id)
  },

  updateEvent: (id: string, updates: Partial<QREvent>): QREvent | undefined => {
    const eventIndex = events.findIndex(event => event.id === id)
    if (eventIndex !== -1) {
      events[eventIndex] = { ...events[eventIndex], ...updates }
      saveEvents()
      return events[eventIndex]
    }
    return undefined
  },

  deleteEvent: (id: string): boolean => {
    const eventIndex = events.findIndex(event => event.id === id)
    if (eventIndex !== -1) {
      events.splice(eventIndex, 1)
      saveEvents()
      return true
    }
    return false
  },

  // Utility functions
  getAllUsers: (): User[] => {
    return [...users]
  },

  getAllEvents: (): QREvent[] => {
    return [...events]
  }
}

// Initialize with test users if they don't exist
const adminUser = users.find(u => u.email === 'admin@admin.com')
const dimitrisUser = users.find(u => u.email === 'dimitris@tombros.gr')

if (!adminUser) {
  userDatabase.createUser({
    email: 'admin@admin.com',
    name: 'Admin User',
    password: 'admin' // In production, hash this
  })
  console.log('Created admin user')
}

if (!dimitrisUser) {
  userDatabase.createUser({
    email: 'dimitris@tombros.gr',
    name: 'Dimitris Tombros',
    password: '6944442333' // In production, hash this
  })
  console.log('Created dimitris user')
}
