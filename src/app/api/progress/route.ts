import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/progress?playerId=… — list a player's level records
 */
export async function GET(req: NextRequest) {
  try {
    const playerId = req.nextUrl.searchParams.get('playerId') ?? ''
    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 })
    }
    const rows = await db.levelProgress.findMany({
      where: { playerId },
      select: { level: true, stars: true, bestScore: true },
      orderBy: { level: 'asc' },
    })
    return NextResponse.json({ progress: rows })
  } catch (err) {
    console.error('GET /api/progress failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/progress?playerId=… — erase every level record for a player
 * (used by "Reset All Progress" in the Instruments).
 */
export async function DELETE(req: NextRequest) {
  try {
    const playerId = req.nextUrl.searchParams.get('playerId') ?? ''
    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 })
    }
    await db.levelProgress.deleteMany({ where: { playerId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/progress failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/**
 * POST /api/progress — record a finished level { playerId, level, score, stars, playerName? }
 * Keeps the max stars / best score per (player, level). Auto-creates the player.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      playerId?: string
      level?: number
      score?: number
      stars?: number
      playerName?: string
    }
    const playerId = (body.playerId ?? '').trim()
    const level = Number(body.level)
    const score = Math.max(0, Math.floor(Number(body.score) || 0))
    const stars = Math.max(0, Math.min(3, Math.floor(Number(body.stars) || 0)))
    if (!playerId || !Number.isFinite(level) || level < 1 || level > 999) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }
    const name = (body.playerName ?? '').trim().slice(0, 20) || `Weaver-${playerId.slice(0, 4)}`

    await db.player.upsert({
      where: { id: playerId },
      update: { name },
      create: { id: playerId, name },
    })

    const existing = await db.levelProgress.findUnique({
      where: { playerId_level: { playerId, level } },
    })
    if (existing) {
      await db.levelProgress.update({
        where: { id: existing.id },
        data: {
          stars: Math.max(existing.stars, stars),
          bestScore: Math.max(existing.bestScore, score),
        },
      })
    } else {
      await db.levelProgress.create({
        data: { playerId, level, stars, bestScore: score },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/progress failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
