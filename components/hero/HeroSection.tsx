'use client'

// ── WebGL imports — commented out for performance ──
// import dynamic from 'next/dynamic'
// import { useDeviceCapability } from '@/hooks/useDeviceCapability'
// import { useMouseParallax } from '@/hooks/useMouseParallax'
// import { useScrollProgress } from '@/hooks/useScrollProgress'
// const WebGLCanvas = dynamic(
//   () => import('./WebGLCanvas').then((m) => m.WebGLCanvas),
//   { ssr: false, loading: () => null }
// )

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, Lock, Zap, Star,
  Sparkles, GraduationCap,
  ClipboardCheck, Award, Calendar, Bell, Wallet, BarChart3,
} from 'lucide-react'
import gsap from 'gsap'

interface HeroSectionProps {
  isMobile: boolean
  isTablet: boolean
}

export function HeroSection({ isMobile, isTablet }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null!)

  // Track scroll for background opacity fade
  const [bgOpacity, setBgOpacity] = useState(1)
  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY
          const heroH = window.innerHeight // Since hero is 100vh
          const fadeStart = heroH * 0.7
          const fadeEnd   = heroH * 3.5
          const minOpacity = 0.45
          
          let newOpacity = 1
          if (scrolled <= fadeStart) newOpacity = 1
          else if (scrolled >= fadeEnd) newOpacity = minOpacity
          else newOpacity = 1 - (1 - minOpacity) * ((scrolled - fadeStart) / (fadeEnd - fadeStart))
          
          setBgOpacity(newOpacity)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── GSAP hero entrance timeline ── */
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 })

      // Badge — pop in from above
      tl.fromTo('.hero-anim-badge',
        { y: -20, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
      )

      // Title — smooth rise
      .fromTo('.hero-anim-title',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.3'
      )

      // CTAs — slide up with slight stagger
      .fromTo('.hero-anim-cta',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.35'
      )

      // Trust badges — fade in
      .fromTo('.hero-anim-trust',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.25'
      )

      // Dashboard card — slide from right with rotation
      .fromTo('.hero-anim-card',
        { x: 50, opacity: 0, rotateY: 5 },
        { x: 0, opacity: 1, rotateY: 0, duration: 0.9, ease: 'power3.out' },
        '-=0.6'
      )

    }, hero)

    return () => ctx.revert()
  }, [])

  const kpiCards = [
    { label: 'Attendance', value: '87%',  color: '#51A2FF', trend: '↑ 2%' },
    { label: 'CGPA',       value: '8.4',  color: '#C4B4FF', trend: '↑ 0.2' },
    { label: 'Subjects',   value: '6',    color: '#86efac', trend: 'Active' },
    { label: 'Rank',       value: '#12',  color: '#FDC745', trend: 'Top 15%' },
  ]

  const upcomingItems = [
    { label: 'DSA Lecture',      time: 'Today 10:00 AM', color: '#51A2FF' },
    { label: 'Assignment Due',   time: 'Today 11:59 PM', color: '#FF6467' },
    { label: 'End-Sem Results',  time: 'March 5, 2026',  color: '#86efac' },
  ]

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile
          ? '96px 24px 56px'
          : isTablet
          ? '88px 40px 72px'
          : '88px 40px 0 40px',
        overflow: 'hidden',
        // Dark hero — distinct from the light sections below
        background: '#0f172a',
      }}
    >
      {/* ── CSS Animated Background (replaces WebGL for performance) ── */}
      <div
        aria-hidden="true"
        className="hero-css-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: bgOpacity,
          transition: 'opacity 0.15s linear',
          willChange: 'opacity',
          overflow: 'hidden',
        }}
      >
      </div>

      {/* ── DOM Content (SEO-safe — stays in HTML) ── */}
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? 44 : isTablet ? 48 : 80,
        }}
      >
        {/* Left: Text */}
        <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 520, textAlign: isMobile ? 'center' : undefined }}>

          {/* Badge */}
          <div
            className="hero-anim-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 99,
              marginBottom: isMobile ? 24 : 32,
              background: 'rgba(81,162,255,0.1)',
              border: '1px solid rgba(81,162,255,0.22)',
            }}
          >
            <Sparkles size={11} color="#51A2FF" strokeWidth={2.5} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#51A2FF', letterSpacing: '0.04em' }}>
              NEXT-GEN UNIVERSITY PLATFORM
            </span>
          </div>

          {/* H1 — in DOM for SEO, never inside canvas */}
          <h1
            className="hero-anim-title"
            style={{
              fontSize: isMobile ? 'clamp(26px, 7vw, 36px)' : isTablet ? 44 : 56,
              fontWeight: 900,
              lineHeight: 1.08,
              color: '#F1F5F9',
              marginBottom: isMobile ? 22 : 24,
              letterSpacing: '-0.03em',
            }}
          >
            The operating system <br />
            <span
              style={{
                color: '#3B82F6',
              }}
            >
              for your college
            </span>
          </h1>



          {/* CTAs */}
          <div
            className="hero-anim-cta"
            style={{
              display: 'flex',
              gap: isMobile ? 12 : 14,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: isMobile ? 36 : 48,
              flexDirection: isMobile ? 'row' : 'row',
              justifyContent: isMobile ? 'center' : undefined,
            }}
          >
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '11px 20px' : '13px 28px',
                borderRadius: 12,
                background: '#2563EB',
                color: '#fff',
                fontWeight: 700,
                fontSize: isMobile ? 13 : 15,
                textDecoration: 'none',
                width: undefined,
                justifyContent: undefined,
                transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
              }}
            >
              Get Started Free <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '11px 20px' : '13px 28px',
                borderRadius: 12,
                background: 'rgba(241,245,249,0.06)',
                border: '1px solid rgba(241,245,249,0.14)',
                color: '#CBD5E1',
                fontWeight: 700,
                fontSize: isMobile ? 13 : 15,
                textDecoration: 'none',
                width: undefined,
                justifyContent: undefined,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
              }}
            >
              Sign In <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Trust badges */}
          <div
            className="hero-anim-trust"
            style={{ display: 'flex', gap: isMobile ? 14 : 24, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : undefined }}
          >
            {[
              { icon: Lock, text: 'Privacy Focused' },
              { icon: Zap,  text: '99.9% Uptime' },
              { icon: Star, text: '4.9/5 Rating' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <b.icon size={12} color="rgba(148,163,184,0.7)" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.7)' }}>
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dashboard glass card (desktop/tablet) */}
        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div
              className="hero-anim-card"
              style={{
                width: '100%',
                maxWidth: 400,
                background: '#1e293b',
                border: '1px solid #334155',
                borderTop: '1px solid #475569',
                borderRadius: 24,
                boxShadow: `
                  0 4px 12px rgba(0,0,0,0.20),
                  0 16px 40px rgba(0,0,0,0.35)
                `,
                overflow: 'hidden',
              }}
            >
              {/* Top accent bar */}
              <div style={{ height: 3, background: 'linear-gradient(to right, #1D4ED8, #51A2FF, #B795FF, #FF6467)' }} />

              <div style={{ padding: '24px 24px 20px' }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>Dashboard</p>
                    <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Semester 4 — CSE</p>
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'linear-gradient(135deg, #86efac, #4ade80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(134,239,172,0.3)',
                  }}>
                    <GraduationCap size={15} color="#14532d" />
                  </div>
                </div>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {kpiCards.map((k, i) => (
                    <div key={i} style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderTop: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}>
                      <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 5, letterSpacing: '0.03em' }}>
                        {k.label}
                      </p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#F1F5F9', lineHeight: 1 }}>
                        {k.value}
                      </p>
                      <p style={{ fontSize: 10, color: k.color, fontWeight: 700, marginTop: 5 }}>
                        {k.trend}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Attendance bars */}
                <div style={{
                  padding: 14, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderTop: '1px solid rgba(255,255,255,0.10)',
                  marginBottom: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>
                    Attendance Trend
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 48 }}>
                    {[65, 72, 80, 75, 87, 84, 90].map((h, i) => (
                      <div
                        key={i}
                        className="hero-bar hero-bar-hover"
                        style={{
                          flex: 1,
                          borderRadius: '3px 3px 0 0',
                          background: i === 6
                            ? 'linear-gradient(to top, #1D4ED8, #51A2FF)'
                            : 'rgba(81,162,255,0.15)',
                          height: `${h}%`,
                          animationDelay: `${0.8 + i * 0.07}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Upcoming */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {upcomingItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderTop: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: item.color, flexShrink: 0,
                        boxShadow: `0 0 6px ${item.color}80`,
                      }} />
                      <p style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, flex: 1 }}>{item.label}</p>
                      <p style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
