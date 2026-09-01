import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/player — upsert a player { id, name }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: string; name?: string }
    const id = (body.id ?? '').trim()
    if (!id || id.length > 64) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }
    const name = (body.name ?? '').trim().slice(0, 20) || `Weaver-${id.slice(0, 4)}`
    const player = await db.player.upsert({
      where: { id },
      update: { name },
      create: { id, name },
    })
    return NextResponse.json({ player })
  } catch (err) {
    console.error('POST /api/player failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
