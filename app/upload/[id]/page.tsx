"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Camera, Upload, AlertCircle, Info, Video } from "lucide-react"
import { useUpload } from "@/hooks/use-upload"
import { FilePreview } from "@/components/file-preview"
import { UploadProgressComponent } from "@/components/upload-progress"

// Simple logo component for upload page
function UploadLogoHeader() {
  return (
    <div className="flex flex-col items-center mb-12">
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ADOBE.jpg-NhPI1BaVIiF7FhMbjc5nCXPDupYJTR.jpeg"
            alt="Tombros Photography Logo"
            className="max-w-full max-h-full object-contain invert"
          />
        </div>
        <h1 className="text-lg font-medium text-center text-white">Live your Wedding Experience</h1>
      </div>
    </div>
  )
}

export default function UploadPage({ params }: { params: { id: string } }) {
  const [consentGiven, setConsentGiven] = useState(false)
  const {
    selectedFiles,
    previews,
    isUploading,
    uploadComplete,
    uploadProgress,
    error,
    addFiles,
    removeFile,
    startUpload,
    resetUpload,
    setError,
  } = useUpload(params.id)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      addFiles(newFiles)
    }
  }

  const handleUpload = async () => {
    if (!consentGiven) {
      setError("Please provide consent before uploading")
      return
    }
    await startUpload()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0)
    return formatFileSize(totalBytes)
  }

  const getVideoStats = () => {
    const videos = selectedFiles.filter((f) => f.type.startsWith("video/"))
    const tooLargeFiles = selectedFiles.filter((f) => f.size > 80 * 1024 * 1024)
    return {
      total: videos.length,
      tooLarge: tooLargeFiles.length,
    }
  }

  if (uploadComplete) {
    const videoStats = getVideoStats()

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
        <UploadLogoHeader />

        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-400" />
              Upload Complete!
            </CardTitle>
            <CardDescription className="text-zinc-400">Thank you for sharing your files!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="rounded-full bg-green-900 p-3">
              <svg
                className="h-6 w-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <p className="text-zinc-300 font-medium">Upload Complete! 🎉</p>
              <p className="text-sm text-zinc-400">
                Successfully uploaded {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} (
                {getTotalSize()})
              </p>

              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mt-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-green-400 font-mono text-lg">
                      {selectedFiles.filter((f) => f.type.startsWith("image/")).length}
                    </div>
                    <div className="text-green-300">Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-mono text-lg">{videoStats.total}</div>
                    <div className="text-green-300">Videos</div>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-800 text-xs text-green-300">
                    Largest file: {formatFileSize(Math.max(...selectedFiles.map((f) => f.size)))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={resetUpload} className="w-full bg-white hover:bg-zinc-200 text-black">
              Upload More Files
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  const videoStats = getVideoStats()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <UploadLogoHeader />

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-400" />
            Upload Photos & Videos
          </CardTitle>
          <CardDescription className="text-zinc-400">📷 Images: Any size • 🎥 Videos: Up to 100MB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-md text-sm border border-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          {videoStats.tooLarge > 0 && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-md text-sm border border-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Files Too Large Detected</div>
                <div className="mt-1 text-xs">
                  {videoStats.tooLarge} file{videoStats.tooLarge !== 1 ? "s" : ""} over 80MB may fail to upload.
                  <br />• Try compressing videos to under 50MB
                  <br />• Use a video compression app
                  <br />• Upload smaller files one at a time
                </div>
              </div>
            </div>
          )}

          {selectedFiles.some((f) => f.size > 50 * 1024 * 1024 && f.size < 80 * 1024 * 1024) && (
            <div className="bg-yellow-900/20 text-yellow-400 p-3 rounded-md text-sm border border-yellow-800 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Large File Warning</div>
                <div className="mt-1 text-xs">
                  Your large video is at the edge of server limits.
                  <br />• May work but could get HTTP 413 error
                  <br />• Consider compressing to under 50MB for reliability
                  <br />• Upload will be attempted one file at a time
                </div>
              </div>
            </div>
          )}

          {uploadProgress && <UploadProgressComponent progress={uploadProgress} />}

          <div className="grid gap-4">
            {previews.length > 0 ? (
              <FilePreview files={selectedFiles} previews={previews} onRemoveFile={removeFile} />
            ) : (
              <div
                className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:bg-zinc-800 transition-colors"
                onClick={() => document.getElementById("photo-upload")?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    <Camera className="h-8 w-8 text-zinc-400" />
                    <Video className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-300">Click to select photos & videos</p>
                  <p className="text-xs text-zinc-500">Or drag and drop files here</p>
                  <p className="text-xs text-zinc-600">🎥 Videos up to 100MB • 📷 Images any size</p>
                  <p className="text-xs text-yellow-400">⚠️ Large files may hit server limits</p>
                </div>
              </div>
            )}

            <input
              id="photo-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Select More Files
            </Button>
          </div>

          <div className="flex items-start space-x-2 pt-4">
            <Checkbox
              id="consent"
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
              >
                I consent to upload these files
              </Label>
              <p className="text-xs text-zinc-500">
                By checking this box, you agree to upload these photos and videos to secure cloud storage.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading
              ? "Uploading..."
              : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? "s" : ""} (${getTotalSize()})`}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
