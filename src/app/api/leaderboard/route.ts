import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/leaderboard — top weavers ranked by total stars, then total best score
 */
export async function GET() {
  try {
    const players = await db.player.findMany({
      include: {
        progress: { select: { stars: true, bestScore: true } },
      },
    })
    const leaders = players
      .map((p) => ({
        playerId: p.id,
        playerName: p.name,
        totalStars: p.progress.reduce((s, r) => s + r.stars, 0),
        totalScore: p.progress.reduce((s, r) => s + r.bestScore, 0),
      }))
      .filter((p) => p.totalStars > 0 || p.totalScore > 0)
      .sort((a, b) => b.totalStars - a.totalStars || b.totalScore - a.totalScore)
      .slice(0, 10)
    return NextResponse.json({ leaders })
  } catch (err) {
    console.error('GET /api/leaderboard failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
