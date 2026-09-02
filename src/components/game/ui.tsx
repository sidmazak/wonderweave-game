'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A } from '@/lib/game/assets'
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

/* ---------------- Ribbon banner ---------------- */

export function RibbonBanner({
  title,
  subtitle,
  className,
  size = 'md',
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('ribbon-wrap flex flex-col items-center select-none', className)}>
      <div className={cn('ribbon', size === 'sm' ? 'ribbon-sm' : '')}>
        <span className={cn('ribbon-title', size === 'sm' ? 'text-sm' : 'text-lg sm:text-xl')}>{title}</span>
        {subtitle ? <span className={cn('ribbon-sub', size === 'sm' ? 'text-[10px]' : 'text-[11px]')}>{subtitle}</span> : null}
      </div>
    </div>
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
}: {
  active: NavTab
  onNavigate: (tab: NavTab) => void
  dailyDone?: boolean
}) {
  const items: { id: NavTab; label: string; badge?: boolean }[] = [
    { id: 'home', label: 'Home' },
    { id: 'map', label: 'Map' },
    { id: 'codex', label: 'Codex' },
    { id: 'relics', label: 'Relics' },
    { id: 'daily', label: 'Daily', badge: !dailyDone },
  ]
  return (
    <nav aria-label="Main navigation" className="bottom-nav relative z-20 grid grid-cols-5 gap-0.5 px-1.5 pt-1.5">
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

export function LumenPill({ amount, className }: { amount: number; className?: string }) {
  return (
    <div className={cn('hud-pill rounded-full pl-1.5 pr-3 py-1 flex items-center gap-1.5', className)} aria-label={`${amount} lumens`}>
      <span className="lumen-gem w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0" aria-hidden>
        ✦
      </span>
      <span className="font-bold tabular-nums text-sm">{amount.toLocaleString()}</span>
    </div>
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
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('panel-parchment relative', className)}>
      {/* corner vine flourishes (pure SVG — crisp at any size) */}
      <CornerVine className="-top-1 -left-1 opacity-90" />
      <CornerVine flip className="-bottom-1 -right-1 opacity-90" />
      {children}
    </div>
  )
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
  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', overlayClassName, dim && 'bg-[#101a10]/70 backdrop-blur-[3px]')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {onClose && <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} tabIndex={-1} />}
      <div className={cn('anim-modal-in relative w-full max-w-[380px] pointer-events-auto', className)}>{children}</div>
    </div>
  )
}

/* ---------------- Stars ---------------- */

export function StarIcon({
  size = 24,
  lit = true,
  style,
  className,
}: {
  size?: number
  lit?: boolean
  style?: React.CSSProperties
  className?: string
}) {
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
        fill={lit ? 'url(#ww-star-gold)' : 'rgba(84, 72, 52, 0.30)'}
        stroke={lit ? '#a3681c' : 'rgba(84, 72, 52, 0.45)'}
        strokeWidth="1.1"
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

/** True once the component has mounted on the client (avoids SSR hydration mismatches for random layouts). */
function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted
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
    `bold` renders a bigger, brighter layer that floats in FRONT of the scene. */
export function FallingLeaves({
  count = 12,
  className,
  bold = false,
}: {
  count?: number
  className?: string
  bold?: boolean
}) {
  const mounted = useMounted()
  const leaves = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 94,
        size: (bold ? 26 : 15) + Math.random() * (bold ? 20 : 17),
        dur: (bold ? 9 : 10) + Math.random() * 11,
        delay: -Math.random() * 22,
        sway: (bold ? 40 : 28) + Math.random() * (bold ? 46 : 38),
        spin: 200 + Math.random() * 340,
        color: LEAF_COLORS[i % LEAF_COLORS.length],
        shape: i % 2, // 0 = round leaf, 1 = pointed leaf
        opacity: bold ? 0.82 + Math.random() * 0.18 : 0.55 + Math.random() * 0.4,
      })),
    [count, bold],
  )
  if (!mounted) return null
  return (
    <div aria-hidden className={cn('ww-particle pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {leaves.map((l) => (
        <span
          key={l.id}
          className="absolute -top-10 block will-change-transform"
          style={{
            left: `${l.left}%`,
            width: l.size,
            height: l.size,
            opacity: l.opacity,
            ['--sway' as string]: `${l.sway}px`,
            ['--spin' as string]: `${l.spin}deg`,
            animation: `ww-leaf-fall ${l.dur}s linear ${l.delay}s infinite`,
          }}
        >
          {l.shape === 0 ? (
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
export function Fireflies({ count = 12, className }: { count?: number; className?: string }) {
  const mounted = useMounted()
  const flies = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        top: 20 + Math.random() * 72,
        size: 6 + Math.random() * 7,
        dur: 8 + Math.random() * 10,
        delay: -Math.random() * 14,
        dx: (Math.random() * 2 - 1) * 80,
        dy: -24 - Math.random() * 66,
        glow: 3 + Math.random() * 3.5,
      })),
    [count],
  )
  if (!mounted) return null
  return (
    <div aria-hidden className={cn('ww-particle pointer-events-none absolute inset-0 overflow-hidden', className)}>
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
            boxShadow: `0 0 ${f.glow * 3.4}px ${f.glow * 1.15}px rgba(255, 238, 160, 0.62)`,
            ['--dx' as string]: `${f.dx}px`,
            ['--dy' as string]: `${f.dy}px`,
            animation: `ww-firefly-drift ${f.dur}s ease-in-out ${f.delay}s infinite alternate, ww-firefly-glow ${2.2 + (f.id % 4) * 0.7}s ease-in-out ${f.id * 0.35}s infinite`,
          }}
        />
      ))}
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
    <div aria-hidden className="ww-particle pointer-events-none absolute inset-0 overflow-hidden">
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
    <div aria-hidden className="ww-particle pointer-events-none absolute inset-0 overflow-hidden">
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
