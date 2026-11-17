import React, { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import gsap from 'gsap'

interface NavItem {
  id: string
  label: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'pipeline', label: 'Pipeline', path: '/pipeline' },
  { id: 'status', label: 'Status Analisis', path: '/status' },
  { id: 'result', label: 'Riwayat Analisis', path: '/result' },
]

export const AppNavbar: React.FC = () => {
  const location = useLocation()
  const navContainerRef = useRef<HTMLDivElement>(null)
  const pillIndicatorRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const isFirstRender = useRef(true)

  const getActiveIndex = (pathname: string): number => {
    if (pathname === '/') return 0
    if (pathname.startsWith('/pipeline')) return 1
    if (pathname.startsWith('/status')) return 2
    if (pathname.startsWith('/result')) return 3
    return -1
  }

  const activeIndex = getActiveIndex(location.pathname)

  // GSAP animation function to slide the pill indicator smoothly
  const animatePill = (targetEl: HTMLElement, immediate = false) => {
    if (!pillIndicatorRef.current || !navContainerRef.current) return

    const containerRect = navContainerRef.current.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()

    const targetX = targetRect.left - containerRect.left
    const targetY = targetRect.top - containerRect.top
    const targetWidth = targetRect.width
    const targetHeight = targetRect.height

    if (immediate) {
      gsap.set(pillIndicatorRef.current, {
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        opacity: 1,
      })
    } else {
      gsap.to(pillIndicatorRef.current, {
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        opacity: 1,
        duration: 0.4,
        ease: 'power3.out',
      })
    }
  }

  // Handle active pill animation on route change or initial load
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = requestAnimationFrame(() => {
      const target = itemRefs.current[activeIndex]
      if (target) {
        animatePill(target, isFirstRender.current || prefersReduced)
        isFirstRender.current = false
      } else if (pillIndicatorRef.current) {
        gsap.to(pillIndicatorRef.current, { opacity: 0, duration: 0.2 })
      }
    })
    return () => cancelAnimationFrame(timer)
  }, [location.pathname, activeIndex])

  // Reposition pill indicator on window resize to ensure pixel-perfect alignment
  useEffect(() => {
    const handleResize = () => {
      const target = itemRefs.current[activeIndex]
      if (target) {
        animatePill(target, true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeIndex])

  const handleLinkClick = (index: number) => {
    const target = itemRefs.current[index]
    if (target) {
      animatePill(target, false)
    }
  }

  const handleCekRiwayat = () => {
    const id = prompt('Masukkan Result ID:')
    if (id) {
      window.location.href = `/status/${id.replace('#', '')}`
    }
  }

  return (
    <div className="flex justify-center pt-6 pb-2 px-4 w-full pointer-events-none">
      {/* 
        Satu shape kapsul utuh dari ujung ke ujung tanpa box terpisah di tengah:
        Mengusung visual bersih, solid, dan elegan dari ujung kiri (Logo) hingga ujung kanan (Tombol)
      */}
      <header className="pointer-events-auto flex items-center justify-between bg-slate-100/90 backdrop-blur-md px-4 sm:px-6 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/80 w-full max-w-4xl text-slate-800 transition-all duration-300">
        {/* Brand / Logo */}
        <Link 
          to="/" 
          onClick={() => handleLinkClick(0)}
          className="flex items-center gap-2.5 pl-1 sm:pl-2 group cursor-pointer shrink-0"
        >
          <img 
            src="/logo.png" 
            alt="Logo Jiwasku" 
            className="w-7 h-7 object-contain rounded-full shadow-xs group-hover:scale-105 transition-transform duration-200" 
          />
          <span className="font-bold text-base text-slate-900 tracking-tight hidden sm:inline">
            Jiwasku
          </span>
        </Link>

        {/* Nav Links langsung di atas bar dengan GSAP Sliding Pill (Tanpa box tengah terpisah & Tanpa ikon) */}
        <nav 
          ref={navContainerRef}
          className="relative flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar"
        >
          {/* GSAP Sliding Active Pill Background dengan efek Glassmorphism */}
          <div 
            ref={pillIndicatorRef}
            className="absolute top-0 left-0 bg-amber-400/80 backdrop-blur-xs rounded-full border border-amber-200/60 shadow-[0_2px_12px_rgba(245,158,11,0.25)] pointer-events-none opacity-0"
            style={{ willChange: 'transform, width' }}
          />

          {NAV_ITEMS.map((item, index) => {
            const isActive = activeIndex === index

            return (
              <Link
                key={item.id}
                to={item.path}
                ref={(el) => { itemRefs.current[index] = el }}
                onClick={() => handleLinkClick(index)}
                className={`relative z-10 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isActive 
                    ? 'text-slate-950 font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Cek Riwayat Button */}
        <button 
          type="button"
          onClick={handleCekRiwayat}
          className="bg-gradient-to-r from-amber-400 via-sky-500 to-cyan-400 text-slate-950 text-xs font-bold px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md animate-gradient-btn hover:shadow-lg hover:scale-102 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cek Riwayat</span>
        </button>
      </header>
    </div>
  )
}
