'use client'

import WonderweaveGame from '@/components/game/WonderweaveGame'
import { GameErrorBoundary } from '@/components/game/ErrorBoundary'

export default function Home() {
  return (
    <GameErrorBoundary>
      <WonderweaveGame />
    </GameErrorBoundary>
  )
}
