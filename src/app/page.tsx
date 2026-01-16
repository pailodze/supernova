'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Cosmic background with flowing nebula
function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Stars
    const stars: { x: number; y: number; size: number; baseOpacity: number; speed: number }[] = []
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3,
        baseOpacity: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.5 + 0.1,
      })
    }

    // Flowing particles
    interface FlowParticle {
      x: number
      y: number
      angle: number
      speed: number
      size: number
      hue: number
      life: number
    }
    const flowParticles: FlowParticle[] = []

    let time = 0
    let animationId: number

    const animate = () => {
      time += 0.008

      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      // Clear with dark background
      ctx.fillStyle = 'rgb(3, 7, 18)'
      ctx.fillRect(0, 0, w, h)

      // Draw multiple layered nebula clouds
      const drawNebula = (offsetX: number, offsetY: number, scale: number, hueShift: number, alpha: number) => {
        const x = cx + Math.sin(time * 0.3 + offsetX) * 50 * scale
        const y = cy + Math.cos(time * 0.2 + offsetY) * 30 * scale
        const radius = 400 * scale

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

        // Smoother gradient stops
        const h1 = (180 + hueShift) % 360 // cyan-ish
        const h2 = (270 + hueShift) % 360 // purple-ish
        const h3 = (320 + hueShift) % 360 // pink-ish

        gradient.addColorStop(0, `hsla(${h1}, 80%, 60%, ${alpha * 0.15})`)
        gradient.addColorStop(0.2, `hsla(${h1}, 70%, 50%, ${alpha * 0.12})`)
        gradient.addColorStop(0.4, `hsla(${h2}, 60%, 45%, ${alpha * 0.08})`)
        gradient.addColorStop(0.6, `hsla(${h3}, 50%, 40%, ${alpha * 0.05})`)
        gradient.addColorStop(0.8, `hsla(${h3}, 40%, 30%, ${alpha * 0.02})`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      }

      // Layer multiple nebulae with different movements
      drawNebula(0, 0, 1.2, 0, 1)
      drawNebula(2, 1, 0.8, 30, 0.7)
      drawNebula(4, 3, 1.0, -20, 0.5)
      drawNebula(1, 5, 0.6, 60, 0.4)

      // Draw stars with subtle movement
      stars.forEach((star) => {
        // Slight parallax movement
        const px = star.x + Math.sin(time + star.y * 0.01) * 2
        const py = star.y + Math.cos(time + star.x * 0.01) * 1

        // Twinkle
        const twinkle = Math.sin(time * 3 + star.x + star.y) * 0.3 + 0.7
        const opacity = star.baseOpacity * twinkle

        ctx.beginPath()
        ctx.arc(px, py, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.fill()
      })

      // Create flow particles from center
      if (flowParticles.length < 150 && Math.random() > 0.5) {
        const angle = Math.random() * Math.PI * 2
        flowParticles.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          angle,
          speed: Math.random() * 0.8 + 0.3,
          size: Math.random() * 2 + 0.5,
          hue: Math.random() > 0.5 ? 190 : 280, // cyan or purple
          life: 0,
        })
      }

      // Update and draw flow particles
      for (let i = flowParticles.length - 1; i >= 0; i--) {
        const p = flowParticles[i]

        // Spiral outward
        p.angle += 0.01
        p.x += Math.cos(p.angle) * p.speed
        p.y += Math.sin(p.angle) * p.speed
        p.life++

        const maxLife = 300
        const lifeRatio = 1 - p.life / maxLife
        const opacity = lifeRatio * 0.4

        if (opacity > 0.01) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${opacity})`
          ctx.fill()
        }

        if (p.life >= maxLife) {
          flowParticles.splice(i, 1)
        }
      }

      // Central glow - pulsing core
      const pulseScale = 1 + Math.sin(time * 2) * 0.1
      const coreRadius = 80 * pulseScale

      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius)
      coreGradient.addColorStop(0, `hsla(190, 90%, 80%, ${0.25 + Math.sin(time * 1.5) * 0.1})`)
      coreGradient.addColorStop(0.3, `hsla(200, 80%, 60%, ${0.15 + Math.sin(time * 1.2) * 0.05})`)
      coreGradient.addColorStop(0.6, `hsla(270, 60%, 50%, ${0.08 + Math.sin(time) * 0.03})`)
      coreGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2)
      ctx.fill()

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'rgb(3, 7, 18)' }}
    />
  )
}

// Supernova explosion effect
function SupernovaEffect() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Core glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-radial from-white/15 via-cyan-500/10 to-transparent animate-pulse" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-gradient-radial from-cyan-400/25 via-purple-500/15 to-transparent animate-pulse" style={{ animationDelay: '0.1s' }} />
      <div className="absolute w-[180px] h-[180px] rounded-full bg-gradient-radial from-white/30 via-cyan-300/20 to-transparent animate-pulse" style={{ animationDelay: '0.2s' }} />

      {/* Rays */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[2px] w-[250px] bg-gradient-to-r from-cyan-400/50 via-purple-400/30 to-transparent origin-left"
          style={{
            transform: `rotate(${i * 30}deg)`,
            animation: `rayPulse 3s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          setIsLoggedIn(true)
        }
      } catch {
        // Not logged in, show login form
      }
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'OTP გაგზავნა ვერ მოხერხდა')
        return
      }

      sessionStorage.setItem('verifyPhone', data.phone)
      router.push('/verify')
    } catch {
      setError('ქსელის შეცდომა. სცადეთ თავიდან.')
    } finally {
      setLoading(false)
    }
  }

  // Show nothing while checking session
  if (checkingSession) {
    return <div className="h-screen bg-[rgb(3,7,18)]" />
  }

  return (
    <div className="min-h-screen text-white flex flex-col">
      <CosmicBackground />

      {/* Main Content - Full Screen */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-4">
        <SupernovaEffect />

        <div className="relative z-10 text-center max-w-3xl mx-auto w-full">
          {/* Tagline */}
          <div className="mb-3 text-cyan-400 text-xs tracking-[0.3em] uppercase animate-pulse">
            SERIES 2
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-1 bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
            SUPERNOVA
          </h1>
          <p className="text-xs text-zinc-400 mb-4 tracking-[0.3em] uppercase">
            GURU EDITION
          </p>

          {/* Story Cards */}
          <div className="flex flex-col md:flex-row justify-center gap-3 mb-8 w-full">
            <div className="flex flex-col items-center p-5 rounded-xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 flex-1">
              <span className="text-3xl mb-2">🚀</span>
              <p className="text-sm font-medium text-cyan-400">სტაჟირების პროგრამა</p>
              <p className="text-xs text-zinc-500 text-center mt-1 leading-relaxed">გააგრძელე სტაჟირების პროგრამა რეალურ პროექტებში.</p>
            </div>
            <div className="flex flex-col items-center p-5 rounded-xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 flex-1">
              <span className="text-3xl mb-2">💼</span>
              <p className="text-sm font-medium text-green-400">ანაზღაურებადი პოზიციები</p>
              <p className="text-xs text-zinc-500 text-center mt-1 leading-relaxed">დააგროვე ქულები ლიდერბორდში და მიიღე ანაზღაურებადი პოზიცია.</p>
            </div>
            <div className="flex flex-col items-center p-5 rounded-xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 flex-1">
              <span className="text-3xl mb-2">🎯</span>
              <p className="text-sm font-medium text-purple-400">მინი პროექტები</p>
              <p className="text-xs text-zinc-500 text-center mt-1 leading-relaxed">დააგროვე ქულები ლიდერბორდში და მიიღე ერთჯერადი ანაზღაურებადი პროექტი.</p>
            </div>
          </div>

          {/* Login Form or Dashboard Button */}
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
            >
              დეშბორდზე გადასვლა
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-amber-400 mb-2">
                ამჟამად მხოლოდ ნოვატორის სტუდენტებისთვის
              </p>
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-center text-lg tracking-wider"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    იგზავნება...
                  </span>
                ) : (
                  'შესვლა'
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-zinc-600 text-[10px] md:text-xs px-4">
        <p className="max-w-sm mx-auto leading-relaxed">
          სუპერნოვა - ვარსკვლავის სიცოცხლის დასასრული, როცა ის ვეღარ ინარჩუნებს საკუთარ სიმძიმეს, ფეთქდება და მცირე დროით, მაგრამ მთელ გალაქტიკაში ყველაზე კაშკაშა ობიექტად იქცევა.
        </p>
      </footer>

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes rayPulse {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50% { opacity: 0.7; transform: scaleX(1.15); }
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}
