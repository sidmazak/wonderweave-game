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
  dim = true,
}: {
  children: React.ReactNode
  onClose?: () => void
  labelledBy?: string
  className?: string
  dim?: boolean
}) {
  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', dim && 'bg-[#101a10]/70 backdrop-blur-[3px]')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {onClose && <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} tabIndex={-1} />}
      <div className={cn('anim-modal-in relative w-full max-w-[360px] pointer-events-auto', className)}>{children}</div>
    </div>
  )
}

/* ---------------- Stars ---------------- */

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
        <img
          key={i}
          src={A('star-sparkle')}
          alt=""
          draggable={false}
          style={{ width: size, height: size, animationDelay: animate ? `${0.25 + i * 0.35}s` : undefined }}
          className={cn(
            'object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]',
            i < count ? (animate ? 'anim-star-pop' : '') : 'grayscale opacity-35',
          )}
        />
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
        drift: Math.random() > 0.5 ? 'anim-drift' : 'anim-drift',
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
