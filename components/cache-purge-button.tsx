"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface CachePurgeButtonProps {
  onPurgeComplete?: () => void
  variant?: "default" | "outline" | "destructive"
  size?: "default" | "sm" | "lg"
}

export function CachePurgeButton({ onPurgeComplete, variant = "outline", size = "sm" }: CachePurgeButtonProps) {
  const [isPurging, setIsPurging] = useState(false)
  const [lastPurge, setLastPurge] = useState<string | null>(null)
  const [purgeResult, setPurgeResult] = useState<"success" | "error" | null>(null)

  const handlePurgeCache = async () => {
    setIsPurging(true)
    setPurgeResult(null)

    try {
      console.log("🧹 Initiating manual cache purge...")

      const response = await fetch("/api/cache/purge", {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      const result = await response.json()
      console.log("Cache purge result:", result)

      if (result.success) {
        setPurgeResult("success")
        setLastPurge(new Date().toLocaleTimeString())

        // Show success message
        alert(
          `✅ Cache Purged Successfully!\n\n${result.actions?.join("\n") || "Cache cleared"}\n\n${result.instructions?.join("\n") || "Refresh to see changes"}`,
        )

        // Call the callback to refresh data
        if (onPurgeComplete) {
          setTimeout(() => {
            onPurgeComplete()
          }, 1000)
        }
      } else {
        setPurgeResult("error")
        alert(
          `❌ Cache Purge Failed\n\n${result.error || "Unknown error"}\n\nFallback: ${result.fallback || "Try hard refresh (Ctrl+F5)"}`,
        )
      }
    } catch (error) {
      console.error("Error purging cache:", error)
      setPurgeResult("error")
      alert(
        `❌ Cache Purge Error\n\nNetwork error occurred. Try:\n1. Hard refresh (Ctrl+F5)\n2. Clear browser data\n3. Wait 2-3 minutes for auto-refresh`,
      )
    } finally {
      setIsPurging(false)

      // Clear result indicator after 3 seconds
      setTimeout(() => {
        setPurgeResult(null)
      }, 3000)
    }
  }

  const getButtonIcon = () => {
    if (isPurging) return <Loader2 className="h-4 w-4 animate-spin" />
    if (purgeResult === "success") return <CheckCircle className="h-4 w-4 text-green-400" />
    if (purgeResult === "error") return <AlertTriangle className="h-4 w-4 text-red-400" />
    return <Zap className="h-4 w-4" />
  }

  const getButtonText = () => {
    if (isPurging) return "Purging..."
    if (purgeResult === "success") return "Purged!"
    if (purgeResult === "error") return "Failed"
    return "Purge Cache"
  }

  const getButtonClass = () => {
    if (purgeResult === "success") return "border-green-600 text-green-400 hover:bg-green-900/20"
    if (purgeResult === "error") return "border-red-600 text-red-400 hover:bg-red-900/20"
    return "border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        onClick={handlePurgeCache}
        variant={variant}
        size={size}
        disabled={isPurging}
        className={`${getButtonClass()} bg-transparent`}
        title="Force clear all caches and refresh data immediately"
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {lastPurge && <div className="text-xs text-zinc-500">Last purged: {lastPurge}</div>}
    </div>
  )
}
