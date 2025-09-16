import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 MANUAL CACHE PURGE initiated")

    // Get the origin URL for cache purging
    const origin = request.headers.get("origin") || "https://your-app.vercel.app"

    // List of URLs to purge from Vercel's edge cache
    const urlsToPurge = [
      `${origin}/api/events`,
      `${origin}/api/events/*`,
      `${origin}/events`,
      `${origin}/uploads/*`,
      // Add more specific URLs as needed
    ]

    // If we have Vercel's purge API token, use it
    const purgeToken = process.env.VERCEL_PURGE_TOKEN
    const teamId = process.env.VERCEL_TEAM_ID

    const vercelPurgeResults = []

    if (purgeToken && teamId) {
      console.log("🚀 Using Vercel Purge API")

      try {
        // Purge specific URLs using Vercel's API
        const purgeResponse = await fetch(`https://api.vercel.com/v1/purge?teamId=${teamId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${purgeToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urls: urlsToPurge,
          }),
        })

        if (purgeResponse.ok) {
          const purgeData = await purgeResponse.json()
          vercelPurgeResults.push(`✅ Vercel edge cache purged: ${purgeData.purged?.length || 0} URLs`)
        } else {
          vercelPurgeResults.push(`⚠️ Vercel purge API failed: ${purgeResponse.status}`)
        }
      } catch (error) {
        vercelPurgeResults.push(`❌ Vercel purge error: ${error}`)
      }
    } else {
      vercelPurgeResults.push("ℹ️ Vercel purge API not configured (optional)")
    }

    // Force a small delay to ensure any pending operations complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log("✅ Manual cache purge completed")

    return NextResponse.json(
      {
        success: true,
        message: "Cache purge completed",
        timestamp: Date.now(),
        actions: [
          "🧹 Server-side cache headers set to no-cache",
          "⏱️ Added 500ms delay for consistency",
          "🔄 Ready for fresh data fetch",
          ...vercelPurgeResults,
        ],
        instructions: [
          "1. Click 'Refresh Events' after purge",
          "2. Changes should appear immediately",
          "3. If still cached, try hard refresh (Ctrl+F5)",
        ],
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
          "CDN-Cache-Control": "no-store",
        },
      },
    )
  } catch (error) {
    console.error("❌ Error in cache purge:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Cache purge failed",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: "Try hard refresh (Ctrl+F5) or wait 2-3 minutes",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
    )
  }
}
