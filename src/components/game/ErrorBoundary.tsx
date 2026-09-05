'use client'

import * as React from 'react'

/**
 * Last line of defence around the game tree.
 *
 * Without this, any exception thrown during render, commit or an effect unmounts
 * the whole React tree and leaves a blank screen — which, inside the Android
 * WebView, is indistinguishable from the app being dead. A player has no console
 * and no way to recover except force-quitting.
 *
 * Saves live in localStorage and are written as they change, so reloading is a
 * safe recovery: progress is not held in the component tree.
 */
interface Props {
  children: React.ReactNode
}

interface State {
  error: Error | null
}

export class GameErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Surface to the native shell's ERROR bridge (and the console in dev).
    // The shell only displays it in development builds.
    try {
      window.dispatchEvent(
        new CustomEvent('ww-fatal', { detail: { message: error.message, stack: info.componentStack } }),
      )
    } catch {
      /* CustomEvent unavailable — nothing else to do */
    }
    console.error('[Wonderweave] fatal render error', error, info.componentStack)
  }

  private reload = (): void => {
    try {
      window.location.reload()
    } catch {
      this.setState({ error: null })
    }
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        role="alert"
        className="min-h-dvh w-full flex flex-col items-center justify-center gap-4 px-8 text-center bg-[#101d13]"
      >
        <h1 className="font-display text-2xl font-black text-[#f4e9c8]">The thread slipped</h1>
        <p className="text-sm text-[#c9b080] max-w-[34ch]">
          Something went wrong while weaving the world. Your progress is saved — reopening the Folio
          should put everything back.
        </p>
        <button
          type="button"
          onClick={this.reload}
          className="mt-2 rounded-xl border-2 border-[#7c4a1e] bg-[#dfb36a] px-6 py-3 font-display font-bold text-[#5d3a1a]"
        >
          Reopen the Folio
        </button>
        {process.env.NODE_ENV !== 'production' ? (
          <pre className="mt-4 max-w-full overflow-auto text-left text-[10px] text-[#8a6a3a]">
            {error.message}
          </pre>
        ) : null}
      </div>
    )
  }
}
