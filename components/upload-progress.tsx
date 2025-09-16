"use client"

import { Upload, Video, Camera } from "lucide-react"
import type { UploadProgress } from "@/hooks/use-upload"

interface UploadProgressProps {
  progress: UploadProgress
}

export function UploadProgressComponent({ progress }: UploadProgressProps) {
  return (
    <div className="bg-blue-900/20 text-blue-400 p-4 rounded-md border border-blue-800 space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium flex items-center gap-1">
            <Upload className="h-4 w-4 text-blue-400" />
            Upload Progress
          </span>
          <span className="text-sm font-mono">{progress.overallProgress}%</span>
        </div>
        <div className="w-full bg-blue-900/40 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
      </div>

      {progress.currentFileName && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-300 flex items-center gap-1">
              {progress.currentFileName.includes(".mp4") || progress.currentFileName.includes(".mov") ? (
                <Video className="h-3 w-3" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
              Current File ({progress.currentFileSizeMB.toFixed(1)}MB)
            </span>
            <span className="text-xs font-mono">{progress.fileProgress}%</span>
          </div>
          <div className="w-full bg-blue-900/40 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress.fileProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4 animate-pulse text-blue-400" />
          <span className="truncate">{progress.status}</span>
        </div>

        <div className="flex justify-between text-xs text-blue-300">
          <span>
            File {progress.currentFile} of {progress.totalFiles}
          </span>
          <span>
            ✅ {progress.uploadedFiles} • ❌ {progress.failedFiles}
          </span>
        </div>

        {progress.currentFileName && (
          <div className="text-xs text-blue-200 truncate">📁 {progress.currentFileName}</div>
        )}

        <div className="text-xs text-blue-300">Total: {progress.totalSizeMB.toFixed(1)}MB</div>
      </div>
    </div>
  )
}
