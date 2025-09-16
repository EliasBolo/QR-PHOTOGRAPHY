import { google } from "googleapis"

// Initialize Google Drive API
export function initializeDrive() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  })

  return google.drive({ version: "v3", auth })
}

// Create a folder in Google Drive
export async function createFolder(folderName: string, parentFolderId?: string) {
  const drive = initializeDrive()

  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentFolderId ? [parentFolderId] : undefined,
  }

  try {
    const response = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id, name, webViewLink",
    })

    console.log(`✅ Created folder: ${folderName} with ID: ${response.data.id}`)
    return response.data
  } catch (error) {
    console.error("❌ Error creating folder:", error)
    throw new Error(`Failed to create folder: ${folderName}`)
  }
}

// Check if folder exists
export async function findFolder(folderName: string, parentFolderId?: string) {
  const drive = initializeDrive()

  try {
    const query = parentFolderId
      ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name, webViewLink)",
    })

    return response.data.files?.[0] || null
  } catch (error) {
    console.error("❌ Error finding folder:", error)
    return null
  }
}

// Get or create folder
export async function getOrCreateFolder(folderName: string, parentFolderId?: string) {
  let folder = await findFolder(folderName, parentFolderId)

  if (!folder) {
    folder = await createFolder(folderName, parentFolderId)
  }

  return folder
}

// Upload file to Google Drive
export async function uploadFile(fileName: string, fileBuffer: Buffer, mimeType: string, folderId: string) {
  const drive = initializeDrive()

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  }

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: fileBuffer,
      },
      fields: "id, name, webViewLink, webContentLink, size",
    })

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    console.log(`✅ Uploaded file: ${fileName} with ID: ${response.data.id}`)
    return response.data
  } catch (error) {
    console.error("❌ Error uploading file:", error)
    throw new Error(`Failed to upload file: ${fileName}`)
  }
}

// List files in a folder
export async function listFilesInFolder(folderId: string) {
  const drive = initializeDrive()

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, webViewLink, webContentLink, size, createdTime, mimeType)",
      orderBy: "createdTime desc",
    })

    return response.data.files || []
  } catch (error) {
    console.error("❌ Error listing files:", error)
    throw new Error("Failed to list files")
  }
}

// Delete file from Google Drive
export async function deleteFile(fileId: string) {
  const drive = initializeDrive()

  try {
    await drive.files.delete({
      fileId: fileId,
    })

    console.log(`✅ Deleted file with ID: ${fileId}`)
    return true
  } catch (error) {
    console.error("❌ Error deleting file:", error)
    throw new Error(`Failed to delete file: ${fileId}`)
  }
}

// Delete folder and all its contents
export async function deleteFolder(folderId: string) {
  const drive = initializeDrive()

  try {
    // First, list all files in the folder
    const files = await listFilesInFolder(folderId)

    // Delete all files in the folder
    for (const file of files) {
      await deleteFile(file.id!)
    }

    // Then delete the folder itself
    await drive.files.delete({
      fileId: folderId,
    })

    console.log(`✅ Deleted folder with ID: ${folderId}`)
    return true
  } catch (error) {
    console.error("❌ Error deleting folder:", error)
    throw new Error(`Failed to delete folder: ${folderId}`)
  }
}

// Get file download URL
export function getFileDownloadUrl(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

// Get file view URL
export function getFileViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`
}

// Get file thumbnail URL
export function getFileThumbnailUrl(fileId: string, size = 400) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=s${size}`
}
