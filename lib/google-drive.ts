import { google } from 'googleapis'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime: string
  webViewLink: string
}

export class GoogleDriveService {
  private drive: any

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    this.drive = google.drive({ version: 'v3', auth })
  }

  // Create a folder in the user's Google Drive
  async createFolder(name: string, parentId?: string): Promise<string> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined
        },
        fields: 'id'
      })
      return response.data.id
    } catch (error) {
      console.error('Error creating folder:', error)
      throw new Error('Failed to create folder')
    }
  }

  // Upload a file to Google Drive
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
  ): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined
        },
        media: {
          mimeType: mimeType,
          body: fileBuffer
        },
        fields: 'id,name,mimeType,size,createdTime,webViewLink'
      })

      return {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size,
        createdTime: response.data.createdTime,
        webViewLink: response.data.webViewLink
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error('Failed to upload file')
    }
  }

  // Get or create the main QR Photography folder
  async getOrCreateMainFolder(): Promise<string> {
    try {
      // Search for existing QR Photography folder
      const response = await this.drive.files.list({
        q: "name='QR Photography' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id,name)'
      })

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id
      }

      // Create new folder if it doesn't exist
      return await this.createFolder('QR Photography')
    } catch (error) {
      console.error('Error getting/creating main folder:', error)
      throw new Error('Failed to get or create main folder')
    }
  }

  // Get or create an event folder
  async getOrCreateEventFolder(eventName: string): Promise<string> {
    try {
      const mainFolderId = await this.getOrCreateMainFolder()
      
      // Search for existing event folder
      const response = await this.drive.files.list({
        q: `name='${eventName}' and mimeType='application/vnd.google-apps.folder' and parents in '${mainFolderId}' and trashed=false`,
        fields: 'files(id,name)'
      })

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id
      }

      // Create new event folder
      return await this.createFolder(eventName, mainFolderId)
    } catch (error) {
      console.error('Error getting/creating event folder:', error)
      throw new Error('Failed to get or create event folder')
    }
  }

  // List files in a folder
  async listFiles(folderId: string): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `parents in '${folderId}' and trashed=false`,
        fields: 'files(id,name,mimeType,size,createdTime,webViewLink)'
      })

      return response.data.files || []
    } catch (error) {
      console.error('Error listing files:', error)
      throw new Error('Failed to list files')
    }
  }

  // Get storage quota information
  async getStorageQuota(): Promise<{
    limit: string
    usage: string
    usageInDrive: string
    usageInDriveTrash: string
    percentage: number
  }> {
    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota'
      })

      const quota = response.data.storageQuota
      const limit = parseInt(quota.limit || '0')
      const usage = parseInt(quota.usage || '0')
      const usageInDrive = parseInt(quota.usageInDrive || '0')
      const usageInDriveTrash = parseInt(quota.usageInDriveTrash || '0')
      
      const percentage = limit > 0 ? Math.round((usage / limit) * 100) : 0

      return {
        limit: this.formatBytes(limit),
        usage: this.formatBytes(usage),
        usageInDrive: this.formatBytes(usageInDrive),
        usageInDriveTrash: this.formatBytes(usageInDriveTrash),
        percentage
      }
    } catch (error) {
      console.error('Error getting storage quota:', error)
      throw new Error('Failed to get storage quota')
    }
  }

  // Helper function to format bytes
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
