'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A, TILE_IMG } from '@/lib/game/assets'
import type { TileType } from '@/lib/game/types'
import { chapterBackdropTint } from '@/lib/game/levels'
import { initAudio, sfx } from '@/lib/game/sound'

/* ---------------- Buttons ---------------- */

type BtnVariant = 'wood' | 'leaf' | 'berry'
type BtnSound = 'ui' | 'back' | 'select'

function playBtnSound(sound: BtnSound): void {
  initAudio()
  if (sound === 'back') sfx.uiBack()
  else if (sound === 'select') sfx.select()
  else sfx.ui()
}

export function WoodButton({
  children,
  variant = 'wood',
  size = 'md',
  className,
  onClick,
  disabled,
  ariaLabel,
  type = 'button',
  sound = 'ui',
}: {
  children: React.ReactNode
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit'
  sound?: BtnSound
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-base rounded-xl',
    lg: 'px-7 py-3 text-lg rounded-xl',
    xl: 'px-10 py-4 text-xl rounded-2xl',
  }
  const variants = {
    wood: 'btn-wood',
    leaf: 'btn-leaf',
    berry: 'btn-berry',
  }
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        playBtnSound(sound)
        onClick?.()
      }}
      className={cn(
        'font-display font-bold uppercase tracking-wider select-none cursor-pointer',
        'min-h-[44px] whitespace-nowrap',
        sizes[size],
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({
  img,
  alt,
  className,
  onClick,
  children,
  label,
  sound = 'ui',
}: {
  img?: string
  alt?: string
  className?: string
  onClick?: () => void
  children?: React.ReactNode
  label: string
  sound?: BtnSound
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        playBtnSound(sound)
        onClick?.()
      }}
      className={cn(
        'icon-btn-wood rounded-full w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer',
        className,
      )}
    >
      {img ? <img src={img} alt={alt ?? label} className="w-6 h-6 object-contain pointer-events-none" draggable={false} /> : children}
    </button>
  )
}

/* ---------------- Scene backdrops ---------------- */

/** Full-bleed chapter / play scenery. */
export function SceneBackdrop({
  src,
  tint,
  className,
  imgClassName,
  overlayClassName,
  opacity,
  children,
}: {
  src: string
  /** Solid fill visible behind transparent edges */
  tint?: string
  className?: string
  imgClassName?: string
  overlayClassName?: string
  opacity?: number
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn('scene-backdrop absolute inset-0', className)}
      aria-hidden
      style={tint ? { backgroundColor: tint } : undefined}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className={cn('scene-backdrop-img select-none', imgClassName)}
        style={opacity != null ? { opacity } : undefined}
      />
      {overlayClassName ? <div className={cn('absolute inset-0 pointer-events-none', overlayClassName)} /> : null}
      {children}
    </div>
  )
}

/* ---------------- Ribbon banner ---------------- */

export function RibbonBanner({
  title,
  subtitle,
  className,
  size = 'md',
  fluid = false,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
  /** Allow title/subtitle to wrap (play HUD, narrow headers). */
  fluid?: boolean
}) {
  return (
    <div className={cn('ribbon-wrap flex flex-col items-center select-none w-full max-w-full', fluid && 'ribbon-fluid', className)}>
      <div className={cn('ribbon', size === 'sm' ? 'ribbon-sm' : '')}>
        <span className={cn('ribbon-title', size === 'sm' ? 'text-sm' : 'text-lg sm:text-xl')}>{title}</span>
        {subtitle ? <span className={cn('ribbon-sub', size === 'sm' ? 'text-[10px]' : 'text-[11px]')}>{subtitle}</span> : null}
      </div>
    </div>
  )
}

/** Screen header — back | centered ribbon | optional right, all on one baseline. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  right,
  size = 'md',
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onBack?: () => void
  backLabel?: string
  right?: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <header
      className={cn(
        'screen-header relative grid shrink-0 grid-cols-[minmax(2.75rem,auto)_minmax(0,1fr)_minmax(2.75rem,auto)] items-center gap-x-2 pb-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] ww-gutter-x',
        className,
      )}
    >
      <div className="screen-header-side justify-self-start z-30">
        {onBack ? <IconButton img={A('icon-back')} label={backLabel} onClick={onBack} sound="back" /> : null}
      </div>
      <div className="screen-header-ribbon relative z-20 flex justify-center pointer-events-none min-w-0">
        <RibbonBanner title={title} subtitle={subtitle} size={size} fluid />
      </div>
      <div className="screen-header-side justify-self-end z-30">{right ?? null}</div>
    </header>
  )
}

/* ---------------- Bottom navigation (in-game carved wooden bar) ---------------- */

export type NavTab = 'home' | 'map' | 'codex' | 'relics' | 'daily'

function NavMedalIcon({ tab }: { tab: NavTab }) {
  const cls = 'w-[22px] h-[22px]'
  switch (tab) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 11.2 12 4l8 7.2" />
          <path d="M6 9.8V20h4.4v-5.2h3.2V20H18V9.8" />
        </svg>
      )
    case 'map':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3.2 6.4 9 4.2l6 2.2 5.8-2.2v13.4L15 19.8l-6-2.2-5.8 2.2V6.4Z" />
          <path d="M9 4.2v13.4M15 6.4v13.4" />
        </svg>
      )
    case 'codex':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
          <path d="M9 7h6" />
        </svg>
      )
    case 'relics':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
          <path d="M2 9h20M12 3 8 9l4 12 4-12-4-6" />
        </svg>
      )
    case 'daily':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M8 3v4M16 3v4M3 10h18" />
          <path d="M9.5 15.5 11 17l3.5-3.5" />
        </svg>
      )
  }
}

export function BottomNav({
  active,
  onNavigate,
  dailyDone,
  codexUnread,
}: {
  active: NavTab
  onNavigate: (tab: NavTab) => void
  dailyDone?: boolean
  codexUnread?: boolean
}) {
  const items: { id: NavTab; label: string; badge?: boolean }[] = [
    { id: 'home', label: 'Home' },
    { id: 'map', label: 'Map' },
    { id: 'codex', label: 'Codex', badge: codexUnread },
    { id: 'relics', label: 'Relics' },
    { id: 'daily', label: 'Daily', badge: !dailyDone },
  ]
  return (
    <nav aria-label="Main navigation" className="bottom-nav relative z-20 grid grid-cols-5 gap-0.5 ww-gutter-x pt-1.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-current={active === it.id ? 'page' : undefined}
          aria-label={it.label}
          onClick={() => {
            initAudio()
            sfx.ui()
            onNavigate(it.id)
          }}
          className={cn(
            'nav-item relative flex flex-col items-center justify-start gap-1 rounded-xl pt-1 pb-0.5 cursor-pointer min-h-[58px]',
            active === it.id && 'nav-item-active',
          )}
        >
          <span className="nav-medal relative">
            <NavMedalIcon tab={it.id} />
            {it.badge && (
              <span
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-b from-[#ff9673] to-[#c74440] border-2 border-[#2b1e10] anim-glow-pulse"
                aria-hidden
              />
            )}
          </span>
          <span className="nav-label text-[9px] font-bold uppercase tracking-[0.14em] leading-none">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}

/* ---------------- Currency pill ---------------- */

export function StarPill({ amount, className }: { amount: number; className?: string }) {
  return (
    <div
      className={cn('hud-pill resource-pill', className)}
      aria-label={`${amount} stars earned across all stages`}
      title="Stars earned"
    >
      <img src={A('star-sparkle')} alt="" draggable={false} className="resource-pill-icon" aria-hidden />
      <span className="resource-pill-value">{amount.toLocaleString()}</span>
    </div>
  )
}

export function LumenPill({ amount, className }: { amount: number; className?: string }) {
  return (
    <div className={cn('hud-pill resource-pill', className)} aria-label={`${amount} lumens`} title="Lumens">
      <span
        className="lumen-gem resource-pill-icon rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
        aria-hidden
      >
        ✦
      </span>
      <span className="resource-pill-value">{amount.toLocaleString()}</span>
    </div>
  )
}

/** Board charm icon — same asset + styling as in-play tiles. */
export function BoardTileIcon({
  type,
  size = 'goal',
  className,
}: {
  type: TileType
  size?: 'chip' | 'goal' | 'board'
  className?: string
}) {
  const box =
    size === 'board' ? 'w-12 h-12' : size === 'chip' ? 'w-7 h-7' : 'w-10 h-10'
  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0', box, className)}
      aria-hidden
    >
      <img
        src={TILE_IMG[type]}
        alt=""
        draggable={false}
        className="tile-img w-full h-full object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)] pointer-events-none"
      />
    </span>
  )
}

/** Score objective badge — clearly not a board charm (fx-sparkle reads like a leaf). */
export function ScoreGoalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('w-10 h-10 shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]', className)}
    >
      <defs>
        <linearGradient id="ww-score-goal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="55%" stopColor="#ffc94d" />
          <stop offset="100%" stopColor="#e8963c" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13.5" fill="url(#ww-score-goal)" stroke="#a3681c" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="10.2" fill="none" stroke="#a3681c" strokeWidth="0.9" opacity="0.35" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="800"
        letterSpacing="0.04em"
        fill="#5d3a1a"
        fontFamily="system-ui, sans-serif"
      >
        PTS
      </text>
    </svg>
  )
}

/** Compact labelled HUD counter (moves, score, etc.). */
export function HudStat({
  label,
  value,
  className,
  valueClassName,
  'aria-label': ariaLabel,
}: {
  label: string
  value: React.ReactNode
  className?: string
  valueClassName?: string
  'aria-label'?: string
}) {
  return (
    <div className={cn('hud-pill hud-stat rounded-2xl', className)} aria-label={ariaLabel ?? `${label}: ${value}`}>
      <span className="hud-stat-label">{label}</span>
      <span className={cn('hud-stat-value font-display', valueClassName)}>{value}</span>
    </div>
  )
}

/** Inline lumen icon + amount — vertically centred with surrounding text. */
export function LumenInline({
  amount,
  className,
  gemClassName,
}: {
  amount: number
  className?: string
  gemClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle leading-none', className)}>
      <span
        className={cn(
          'lumen-gem w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black text-white shrink-0',
          gemClassName,
        )}
        aria-hidden
      >
        ✦
      </span>
      <span className="tabular-nums">{amount.toLocaleString()}</span>
    </span>
  )
}

/* ---------------- Panels ---------------- */

/** Hand-drawn leafy vine flourish used to dress parchment corners. */
export function CornerVine({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn('pointer-events-none select-none absolute h-12 w-12', flip && 'rotate-180', className)}
      fill="none"
    >
      <path d="M4 60 C 12 42, 24 24, 52 8" stroke="#8a6a3a" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
      <path d="M14 46 C 7 42, 5 35, 9 29 C 16 32, 18 39, 17 45 Z" fill="#93c063" stroke="#5d7a2f" strokeWidth="1.1" />
      <path d="M26 33 C 21 26, 22 19, 28 15 C 33 20, 33 28, 29 33 Z" fill="#7dab4a" stroke="#5d7a2f" strokeWidth="1.1" />
      <path d="M38 22 C 36 15, 39 9, 45 7 C 48 13, 46 20, 41 23 Z" fill="#a8cd74" stroke="#5d7a2f" strokeWidth="1.1" />
      <circle cx="49" cy="13" r="2.6" fill="#e2695c" stroke="#a93a34" strokeWidth="1" />
      <circle cx="54" cy="18" r="1.9" fill="#f0b48a" stroke="#a93a34" strokeWidth="0.9" />
      <circle cx="8" cy="54" r="1.8" fill="#e8c25e" stroke="#a97b42" strokeWidth="0.9" />
    </svg>
  )
}

export function ParchmentPanel({
  children,
  className,
  frame = 'card',
}: {
  children: React.ReactNode
  className?: string
  /** `dialog` — top corner vines only; bottom sill carries mushrooms & flowers */
  frame?: 'card' | 'dialog'
}) {
  return (
    <div className={cn('panel-parchment relative', frame === 'dialog' && 'panel-parchment-dialog', className)}>
      <CornerVine className="-top-1 -left-1 opacity-90" />
      {frame === 'card' ? (
        <CornerVine flip className="-bottom-1 -right-1 opacity-90" />
      ) : (
        <CornerVine className="-top-1 -right-1 opacity-90 scale-x-[-1]" />
      )}
      {children}
    </div>
  )
}

/** Standard dialog close — top-right inside the parchment, industry placement. */
export function DialogCloseButton({
  onClick,
  label = 'Close',
  className,
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <IconButton
      img={A('icon-close')}
      label={label}
      onClick={onClick}
      className={cn('dialog-close-btn absolute top-3.5 right-3.5 z-30 w-9 h-9 min-w-9 min-h-9', className)}
    />
  )
}

/** Corner garden accents — mushrooms & flowers peek from the dialog base, outside the parchment clip. */
export function DialogBottomDecor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('dialog-corner-decor', className)}>
      <img src={A('deco-mushrooms')} alt="" draggable={false} className="dialog-deco-mushrooms" />
      <img src={A('deco-flowers')} alt="" draggable={false} className="dialog-deco-flowers" />
    </div>
  )
}

/** Storybook dialog shell — parchment frame, close, optional scroll + footer, corner garden accents. */
export function DialogPanel({
  children,
  className,
  bodyClassName,
  onClose,
  closeLabel = 'Close',
  showDecor = true,
  peek,
  header,
  footer,
  scrollable = false,
}: {
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  onClose?: () => void
  closeLabel?: string
  showDecor?: boolean
  peek?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  scrollable?: boolean
}) {
  return (
    <div className="relative pb-1">
      {peek}
      <ParchmentPanel
        frame="dialog"
        className={cn(
          'dialog-panel flex flex-col overflow-hidden',
          scrollable && 'dialog-panel-scrollable max-h-[min(78vh,640px)]',
          onClose && 'dialog-panel-with-close',
          showDecor && 'dialog-panel-with-decor',
          footer && 'dialog-panel-has-footer',
          className,
        )}
      >
        {onClose ? <DialogCloseButton onClick={onClose} label={closeLabel} /> : null}
        {header ? <div className="dialog-panel-header shrink-0 relative z-[6]">{header}</div> : null}
        <div
          className={cn(
            'dialog-panel-body relative z-[1]',
            scrollable && 'flex-1 min-h-0 overflow-y-auto ww-scroll ww-scroll-dialog',
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? <div className="dialog-panel-footer shrink-0 relative z-[6]">{footer}</div> : null}
      </ParchmentPanel>
      {showDecor ? <DialogBottomDecor /> : null}
    </div>
  )
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard/screen-reader plumbing for a modal: move focus in on open, keep Tab
 * inside it while it is up, close on Escape, and hand focus back to whatever
 * opened it. `role="dialog"` alone announces the modal but still lets Tab walk
 * off into the board behind it.
 */
function useModalFocus(
  panelRef: React.RefObject<HTMLDivElement | null>,
  onClose?: () => void,
): void {
  React.useEffect(() => {
    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    // Focus the first control, else the panel itself, so the reader starts here.
    const first = focusables()[0]
    if (first) first.focus()
    else panel?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === firstItem || !panel.contains(active))) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Return focus where the player left it.
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus()
    }
  }, [panelRef, onClose])
}

export function ModalShell({
  children,
  onClose,
  labelledBy,
  className,
  overlayClassName,
  dim = true,
}: {
  children: React.ReactNode
  onClose?: () => void
  labelledBy?: string
  className?: string
  overlayClassName?: string
  dim?: boolean
}) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  useModalFocus(panelRef, onClose)

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', overlayClassName, dim && 'bg-[#101a10]/70 backdrop-blur-[3px]')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {onClose && <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} tabIndex={-1} />}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn('anim-modal-in relative w-full max-w-[380px] pointer-events-auto overflow-visible outline-none', className)}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------------- Stars ---------------- */

export function StarIcon({
  size = 24,
  lit = true,
  style,
  className,
  /** `bright` empty stars stay readable on dark HUD pills */
  empty = 'muted',
}: {
  size?: number
  lit?: boolean
  style?: React.CSSProperties
  className?: string
  empty?: 'muted' | 'bright'
}) {
  const emptyFill = empty === 'bright' ? 'rgba(217, 174, 98, 0.28)' : 'rgba(84, 72, 52, 0.30)'
  const emptyStroke = empty === 'bright' ? 'rgba(255, 233, 168, 0.72)' : 'rgba(84, 72, 52, 0.45)'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} className={className} aria-hidden>
      {lit && (
        <defs>
          <linearGradient id="ww-star-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="55%" stopColor="#ffc94d" />
            <stop offset="100%" stopColor="#e8963c" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 1.8l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.6 5.8 20.9 7 14 2 9.1l6.9-1L12 1.8z"
        fill={lit ? 'url(#ww-star-gold)' : emptyFill}
        stroke={lit ? '#a3681c' : emptyStroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {lit && (
        <path d="M12 5.4l1.7 3.4 3.7.55-2.7 2.6.65 3.7L12 13.9l-3.35 1.75.65-3.7-2.7-2.6 3.7-.55L12 5.4z" fill="rgba(255,255,255,0.35)" />
      )}
    </svg>
  )
}

export function StarRow({
  count,
  total = 3,
  size = 28,
  animate = false,
  className,
}: {
  count: number
  total?: number
  size?: number
  animate?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)} role="img" aria-label={`${count} of ${total} stars`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="inline-flex drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
          <StarIcon
            size={size}
            lit={i < count}
            style={{ animationDelay: animate && i < count ? `${0.25 + i * 0.35}s` : undefined }}
            className={cn(i < count && animate && 'anim-star-pop block', i >= count && 'opacity-90')}
          />
        </span>
      ))}
    </div>
  )
}

/* ---------------- HUD bits ---------------- */

export function HudPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('hud-pill rounded-full px-3 py-1 flex items-center gap-1.5 text-sm font-bold', className)}>{children}</div>
}

/** Compact stage marker — atlas chapter art + chapter-stage label; opens current chapter when tapped. */
export function StagePill({
  stageLabel,
  chapterBg,
  onClick,
  className,
}: {
  /** e.g. 1-2 */
  stageLabel: string
  /** Chapter backdrop key — same asset as atlas list thumbnails (e.g. bg-sky). */
  chapterBg: string
  onClick?: () => void
  className?: string
}) {
  const [chapter, stage] = stageLabel.split('-')
  const label = chapter && stage ? `Current stage chapter ${chapter} stage ${stage}` : `Current stage ${stageLabel}`
  const thumbStyle = { backgroundColor: chapterBackdropTint(chapterBg) } as const
  const body = (
    <>
      <span className="stage-pill-thumb" style={thumbStyle} aria-hidden>
        <img
          src={A(chapterBg)}
          alt=""
          draggable={false}
          className="stage-pill-art absolute object-cover object-center"
        />
      </span>
      <span className="tabular-nums text-xs font-bold leading-none tracking-wide">{stageLabel}</span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          initAudio()
          sfx.select()
          onClick()
        }}
        className={cn(
          'hud-pill stage-pill rounded-full relative flex items-center h-8 pl-[2.35rem] pr-3 overflow-hidden min-w-0 shrink-0 cursor-pointer',
          className,
        )}
        aria-label={`${label} — open chapter map`}
      >
        {body}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'hud-pill stage-pill rounded-full relative flex items-center h-8 pl-[2.35rem] pr-3 overflow-hidden min-w-0 shrink-0',
        className,
      )}
      aria-label={label}
    >
      {body}
    </div>
  )
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div className={cn('h-3 rounded-full bg-[#3a2a16]/80 border border-[#a97b42]/70 overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-b from-[#ffe28a] via-[#ffc94d] to-[#e8963c] transition-[width] duration-500', barClassName)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

/* ---------------- Toggle switch (storybook style) ---------------- */

export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        initAudio()
        sfx.ui()
        onChange(!checked)
      }}
      className={cn(
        'relative w-[52px] h-[28px] rounded-full border-2 border-[#7c4a1e] transition-colors cursor-pointer shrink-0',
        checked ? 'bg-gradient-to-b from-[#9ed86e] to-[#5da238]' : 'bg-[#8a7a5c]/50',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] w-5 h-5 rounded-full bg-gradient-to-b from-white to-[#e8dcc0] border border-[#7c4a1e]/60 shadow transition-all',
          checked ? 'left-[24px]' : 'left-[2px]',
        )}
      />
    </button>
  )
}

/* ---------------- Slider (storybook style) ---------------- */

export function StyledSlider({
  value,
  onChange,
  label,
  icon,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  icon?: React.ReactNode
}) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-3 w-full">
      {icon ? <span className="text-[#5d3a1a] shrink-0" aria-hidden>{icon}</span> : null}
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        aria-label={label}
        aria-valuetext={`${pct}%`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="ww-range flex-1 cursor-pointer"
        style={{ '--ww-fill': `${pct}%` } as React.CSSProperties}
      />
      <span className="w-10 text-right text-sm font-bold text-[#5d3a1a] tabular-nums shrink-0">{pct}</span>
    </div>
  )
}

/* ---------------- Tabs ---------------- */

export function WoodTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('flex gap-1.5 justify-center', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          onClick={() => {
            initAudio()
            sfx.ui()
            onChange(t.id)
          }}
          className={cn(
            'wood-tab px-3.5 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-widest cursor-pointer min-h-[36px]',
            active === t.id && 'wood-tab-active',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Animated count-up number ---------------- */

export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const [shown, setShown] = React.useState(0)
  const prev = React.useRef(0)
  React.useEffect(() => {
    const from = prev.current
    prev.current = value
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <span className={cn('tabular-nums', className)}>{shown.toLocaleString()}</span>
}

/* ---------------- Ambient decorations ---------------- */

/** True once the component has mounted on the client (avoids SSR hydration mismatches for random layouts).
    useSyncExternalStore returns the server snapshot (false) while hydrating and the
    client snapshot (true) afterwards — no setState-in-effect needed. */
const subscribeToNothing = () => () => {}
function useMounted(): boolean {
  return React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
}

/** Fireflies that halo the hero Play button — bright ring above the pill. */
export function PlayButtonFireflies() {
  const mounted = useMounted()
  const flies = React.useMemo(() => {
    const count = 10
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + 0.35
      return {
        id: i,
        left: 50 + Math.cos(angle) * (44 + (i % 3) * 6),
        top: 50 + Math.sin(angle) * (34 + (i % 2) * 8),
        size: 6 + (i % 4) * 1.8 + Math.random() * 2,
        dur: 3.8 + Math.random() * 4.2,
        delay: -Math.random() * 11,
        dx: (Math.random() * 2 - 1) * 32,
        dy: -14 - Math.random() * 24,
      }
    })
  }, [])
  if (!mounted) return null
  return (
    <div
      aria-hidden
      className="play-btn-fireflies play-btn-fireflies-back ww-living pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
    >
      <div className="play-btn-firefly-halo" />
      {flies.map((f) => (
        <span
          key={f.id}
          className="absolute block rounded-full will-change-transform"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #fffef5 0%, #ffe88a 40%, rgba(255, 200, 80, 0) 74%)',
            boxShadow: `0 0 ${f.size * 3.2}px ${f.size * 1.2}px rgba(255, 238, 160, 0.9)`,
            ['--dx' as string]: `${f.dx}px`,
            ['--dy' as string]: `${f.dy}px`,
            animation: `ww-lantern-firefly ${f.dur}s ease-in-out ${f.delay}s infinite alternate, ww-play-firefly-glow ${2.2 + (f.id % 3) * 0.5}s ease-in-out ${f.id * 0.38}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
const LEAF_COLORS = [
  { fill: '#a8d474', vein: '#5d7a2f' },
  { fill: '#d4bc5e', vein: '#8a6a2a' },
  { fill: '#e2a854', vein: '#96662a' },
  { fill: '#d48858', vein: '#8a4a2e' },
  { fill: '#8ab854', vein: '#4f6b28' },
  { fill: '#c9b45c', vein: '#7a5c20' },
]

/** Gentle autumn leaves drifting down the screen (pure SVG, transform/opacity only).
    `layer` — depth tier: back (behind UI), front (over hero), over (past mascot). */
export function FallingLeaves({
  count = 8,
  className,
  bold = false,
  subtle = false,
  layer = 'back',
}: {
  count?: number
  className?: string
  bold?: boolean
  subtle?: boolean
  layer?: 'back' | 'front' | 'over'
}) {
  const mounted = useMounted()
  const leaves = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const sizeBase = subtle
          ? 10 + Math.random() * 14
          : bold
            ? 26 + Math.random() * 20
            : 15 + Math.random() * 17
        const sizeMul = layer === 'back' ? 0.86 + Math.random() * 0.08 : layer === 'over' ? 1.04 + Math.random() * 0.12 : 1
        const opacityBase = subtle
          ? 0.32 + Math.random() * 0.22
          : bold
            ? 0.82 + Math.random() * 0.18
            : 0.55 + Math.random() * 0.4
        const opacityMul = layer === 'back' ? 0.78 + Math.random() * 0.12 : layer === 'over' ? 1.05 + Math.random() * 0.1 : 1
        return {
          id: i,
          left: Math.random() * 94,
          size: sizeBase * sizeMul,
          dur: subtle
            ? 22 + Math.random() * 18
            : bold
              ? 9 + Math.random() * 11
              : 10 + Math.random() * 11,
          delay: -Math.random() * (subtle ? 36 : 22),
          sway: subtle
            ? 16 + Math.random() * 22
            : bold
              ? 40 + Math.random() * 46
              : 28 + Math.random() * 38,
          spin: 200 + Math.random() * 340,
          color: LEAF_COLORS[i % LEAF_COLORS.length],
          shape: i % 2,
          useAsset: subtle && i % 4 === 0,
          opacity: Math.min(1, opacityBase * opacityMul),
          depthZ: 1 + Math.floor(Math.random() * 6),
        }
      }),
    [count, bold, subtle, layer],
  )
  if (!mounted) return null
  const animName = subtle ? 'ww-leaf-fall-subtle' : 'ww-leaf-fall'
  const layerClass =
    layer === 'over' ? 'ww-leaves-over' : layer === 'front' ? 'ww-leaves-front' : 'ww-leaves-back'
  const depthClass = layer === 'back' ? 'ww-leaf-depth-back' : layer === 'over' ? 'ww-leaf-depth-over' : undefined
  return (
    <div aria-hidden className={cn('ww-ambient pointer-events-none absolute inset-0 overflow-hidden', layerClass, className)}>
      {leaves.map((l) => (
        <span
          key={l.id}
          className={cn('absolute -top-10 block will-change-transform', depthClass)}
          style={{
            left: `${l.left}%`,
            width: l.size,
            height: l.size,
            opacity: l.opacity,
            zIndex: l.depthZ,
            ['--sway' as string]: `${l.sway}px`,
            ['--spin' as string]: `${l.spin}deg`,
            animation: `${animName} ${l.dur}s linear ${l.delay}s infinite`,
          }}
        >
          {l.useAsset ? (
            <img
              src={l.id % 2 === 0 ? A('fx-petal') : A('tile-leaf')}
              alt=""
              draggable={false}
              className="h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            />
          ) : l.shape === 0 ? (
            /* round storybook leaf */
            <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
              <path d="M2 10 C 5 3.5, 15 3.5, 18 10 C 15 16.5, 5 16.5, 2 10 Z" fill={l.color.fill} stroke={l.color.vein} strokeWidth="1" />
              <path d="M3.5 10 H 17 M10 10 C 9 7.5, 9 5.5, 10 4 M10 10 C 11 12.5, 11 14.5, 10 16" stroke={l.color.vein} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8" />
              <ellipse cx="7.4" cy="7.6" rx="2.6" ry="1.4" fill="rgba(255,255,255,0.28)" transform="rotate(-28 7.4 7.6)" />
            </svg>
          ) : (
            /* pointed willow leaf */
            <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
              <path d="M10 1.5 C 15.5 6, 16.5 13, 10 18.5 C 3.5 13, 4.5 6, 10 1.5 Z" fill={l.color.fill} stroke={l.color.vein} strokeWidth="1" />
              <path d="M10 3 V 17 M10 7 L 7 5.4 M10 10 L 6.6 8.2 M10 13 L 7.2 11.4 M10 7 L 13 5.4 M10 10 L 13.4 8.2 M10 13 L 12.8 11.4" stroke={l.color.vein} strokeWidth="0.85" strokeLinecap="round" fill="none" opacity="0.75" />
            </svg>
          )}
        </span>
      ))}
    </div>
  )
}

/** Soft glowing fireflies wandering over the scene — warm lantern-light dots. */
export function Fireflies({ count = 8, className }: { count?: number; className?: string }) {
  const mounted = useMounted()
  const flies = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        top: 15 + Math.random() * 70,
        size: 5 + Math.random() * 6,
        dur: 10 + Math.random() * 12,
        delay: -Math.random() * 18,
        dx: (Math.random() * 2 - 1) * 60,
        dy: -18 - Math.random() * 48,
        glow: 2 + Math.random() * 2.5,
      })),
    [count],
  )
  if (!mounted) return null
  return (
    <div aria-hidden className={cn('ww-ambient pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {flies.map((f) => (
        <span
          key={f.id}
          className="absolute block rounded-full will-change-transform"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            background: 'radial-gradient(circle, #fffdf0 0%, #ffec9e 40%, rgba(255, 214, 110, 0) 72%)',
            boxShadow: `0 0 ${f.glow * 3}px ${f.glow}px rgba(255, 238, 160, 0.55)`,
            ['--dx' as string]: `${f.dx}px`,
            ['--dy' as string]: `${f.dy}px`,
            animation: `ww-firefly-drift ${f.dur}s ease-in-out ${f.delay}s infinite alternate, ww-firefly-glow ${2.2 + (f.id % 4) * 0.7}s ease-in-out ${f.id * 0.35}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/** Fireflies that orbit and drift around a lantern — cluster near the mascot. */
export function LanternFireflies({ count = 5, className }: { count?: number; className?: string }) {
  const mounted = useMounted()
  const flies = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        top: 8 + Math.random() * 72,
        size: 5 + Math.random() * 6,
        dur: 4.5 + Math.random() * 5.5,
        delay: -Math.random() * 8,
        dx: (Math.random() * 2 - 1) * 36,
        dy: (Math.random() * 2 - 1) * 28,
        orbit: 18 + Math.random() * 22,
        orbitDur: 7 + Math.random() * 6,
      })),
    [count],
  )
  if (!mounted) return null
  return (
    <div
      aria-hidden
      className={cn(
        'ww-living pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[58px] w-[130px] h-[100px] sm:w-[150px] sm:h-[115px]',
        className,
      )}
    >
      {flies.map((f) => (
        <span
          key={f.id}
          className="absolute block rounded-full will-change-transform"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            ['--orbit-r' as string]: `${f.orbit}px`,
            ['--dx' as string]: `${f.dx}px`,
            ['--dy' as string]: `${f.dy}px`,
            background: 'radial-gradient(circle, #fffef5 0%, #ffe88a 38%, rgba(255, 200, 80, 0) 72%)',
            boxShadow: `0 0 ${f.size * 2.8}px ${f.size * 1.1}px rgba(255, 230, 140, 0.85)`,
            animation: `ww-lantern-firefly ${f.dur}s ease-in-out ${f.delay}s infinite alternate, ww-firefly-glow ${1.8 + (f.id % 3) * 0.6}s ease-in-out ${f.id * 0.4}s infinite`,
          }}
        />
      ))}
      {/* soft warm pool of light under the lantern */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[88%] h-[72%] rounded-full anim-lantern-glow"
        style={{
          background: 'radial-gradient(circle, rgba(255, 210, 100, 0.42) 0%, rgba(255, 170, 60, 0.14) 48%, transparent 72%)',
        }}
      />
    </div>
  )
}

export function FloatingPetals({ count = 8 }: { count?: number }) {
  const mounted = useMounted()
  const petals = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: 8 + Math.random() * 80,
        delay: Math.random() * 10,
        dur: 9 + Math.random() * 10,
        size: 10 + Math.random() * 12,
        reverse: Math.random() > 0.5,
      })),
    [count],
  )
  if (!mounted) return null
  return (
    <div aria-hidden className="ww-ambient pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p) => (
        <img
          key={p.id}
          src={A('fx-petal')}
          alt=""
          draggable={false}
          className="absolute opacity-60"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            animation: `ww-float-y ${p.dur}s ease-in-out ${p.delay}s infinite`,
            transform: p.reverse ? 'scaleX(-1)' : undefined,
          }}
        />
      ))}
    </div>
  )
}

export function Twinkles({ count = 14 }: { count?: number }) {
  const mounted = useMounted()
  const stars = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 3,
      })),
    [count],
  )
  if (!mounted) return null
  return (
    <div aria-hidden className="ww-ambient pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <img
          key={s.id}
          src={A('fx-sparkle')}
          alt=""
          draggable={false}
          className="absolute anim-twinkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  )
}
