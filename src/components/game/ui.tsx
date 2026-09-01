'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { A } from '@/lib/game/assets'
import { initAudio, sfx } from '@/lib/game/sound'

/* ---------------- Buttons ---------------- */

type BtnVariant = 'wood' | 'leaf' | 'berry'

export function WoodButton({
  children,
  variant = 'wood',
  size = 'md',
  className,
  onClick,
  disabled,
  ariaLabel,
  type = 'button',
}: {
  children: React.ReactNode
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit'
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
        initAudio()
        sfx.ui()
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
}: {
  img?: string
  alt?: string
  className?: string
  onClick?: () => void
  children?: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        initAudio()
        sfx.ui()
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

/* ---------------- Bottom navigation ---------------- */

export type NavTab = 'map' | 'codex' | 'relics' | 'daily'

export function BottomNav({
  active,
  onNavigate,
  dailyDone,
}: {
  active: NavTab
  onNavigate: (tab: NavTab) => void
  dailyDone?: boolean
}) {
  const items: { id: NavTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    {
      id: 'map',
      label: 'Map',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.2" y="5" width="17.6" height="14" rx="2.4" />
          <path d="M9.2 5.6v12.8M14.8 5.6v12.8" />
        </svg>
      ),
    },
    {
      id: 'codex',
      label: 'Codex',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
          <path d="M9 7h6" />
        </svg>
      ),
    },
    {
      id: 'relics',
      label: 'Relics',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
          <path d="M2 9h20M12 3 8 9l4 12 4-12-4-6" />
        </svg>
      ),
    },
    {
      id: 'daily',
      label: 'Daily',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M8 3v4M16 3v4M3 10h18" />
          <path d="M9.5 15.5 11 17l3.5-3.5" />
        </svg>
      ),
      badge: !dailyDone,
    },
  ]
  return (
    <nav aria-label="Main navigation" className="bottom-nav relative z-20 grid grid-cols-4 gap-1 px-2 py-1.5">
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
            'nav-item relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 cursor-pointer min-h-[54px]',
            active === it.id && 'nav-item-active',
          )}
        >
          <span className="relative">
            {it.icon}
            {it.badge && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-[#e2695c] border border-[#7c1f24]" aria-hidden />}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{it.label}</span>
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

export function ParchmentPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('panel-parchment relative', className)}>
      {/* corner vines */}
      <img src={A('deco-flowers')} alt="" aria-hidden className="absolute -top-2 -left-2 w-14 opacity-90 pointer-events-none select-none" draggable={false} />
      <img src={A('deco-flowers')} alt="" aria-hidden className="absolute -bottom-2 -right-2 w-14 opacity-90 rotate-180 pointer-events-none select-none" draggable={false} />
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

export function FloatingPetals({ count = 8 }: { count?: number }) {
  const petals = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        dur: 9 + Math.random() * 10,
        size: 10 + Math.random() * 12,
        reverse: Math.random() > 0.5,
      })),
    [count],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p) => (
        <img
          key={p.id}
          src={A('fx-petal')}
          alt=""
          draggable={false}
          className="absolute opacity-60"
          style={{
            left: `${p.left}%`,
            top: `${8 + Math.random() * 80}%`,
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
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
