import React from 'react'

/**
 * WasteWatch AI Main Application Logo
 * 
 * Features an integrated Civic Eco-Loop + AI Vision Scanner motif.
 * Supports:
 * - Direct vector SVG rendering with crisp gradients
 * - Admin and Citizen color themes
 * - Optional custom image fallback if you want to use your own PNG/SVG asset
 */
export default function AppLogo({
  size = 28,
  variant = 'teal', // 'teal' | 'indigo' | 'emerald'
  showText = false,
  subtitle = '',
  imgSrc = null,
  className = '',
  style = {}
}) {
  const isIndigo = variant === 'indigo'
  const primaryGrad = isIndigo ? ['#818cf8', '#4f46e5'] : ['#2dd4bf', '#059669']
  const secondaryGrad = isIndigo ? ['#a5b4fc', '#6366f1'] : ['#38bdf8', '#0d9488']
  const accentColor = isIndigo ? '#818cf8' : '#2dd4bf'
  const borderColor = isIndigo ? 'rgba(99,102,241,0.35)' : 'rgba(20,184,166,0.35)'
  const glowShadow = isIndigo
    ? '0 0 12px rgba(99,102,241,0.25)'
    : '0 0 12px rgba(13,148,136,0.3)'

  // If a custom image source (PNG/SVG/WebP) is provided or imported:
  if (imgSrc) {
    return (
      <div
        className={`app-logo-wrapper ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          ...style
        }}
      >
        <img
          src={imgSrc}
          alt="WasteWatch AI Logo"
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            borderRadius: 8
          }}
        />
        {showText && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
              WasteWatch <span style={{ color: accentColor }}>AI</span>
            </span>
            {subtitle && (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Vector Brand Mark
  return (
    <div
      className={`app-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        ...style
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(${glowShadow})`,
          flexShrink: 0,
          verticalAlign: 'middle'
        }}
      >
        <defs>
          <linearGradient id={`bg-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor={isIndigo ? '#1e1b4b' : '#022c22'} />
          </linearGradient>
          <linearGradient id={`grad-p-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryGrad[0]} />
            <stop offset="100%" stopColor={primaryGrad[1]} />
          </linearGradient>
          <linearGradient id={`grad-s-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondaryGrad[0]} />
            <stop offset="100%" stopColor={secondaryGrad[1]} />
          </linearGradient>
        </defs>

        {/* Badge container with smooth corner squircle */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill={`url(#bg-grad-${variant})`}
          stroke={borderColor}
          strokeWidth="1.5"
        />

        {/* Subtle AI Radar Track */}
        <circle
          cx="32"
          cy="32"
          r="21"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          strokeOpacity="0.3"
        />

        {/* Dynamic Upper Leaf / Recycling Sweep */}
        <path
          d="M19 23C19 16.5 25 12 33 12C39.5 12 45 16 45 22C45 24.8 43 27 40 27C37.2 27 36 25 36 22C36 18.5 33 16 30 16C26 16 23 18.5 23 23C23 25.5 24.5 27 27 28L25 31C21 29 19 26.5 19 23Z"
          fill={`url(#grad-p-${variant})`}
        />

        {/* Dynamic Lower Waste Clean Sweep */}
        <path
          d="M45 41C45 47.5 39 52 31 52C24.5 52 19 48 19 42C19 39.2 21 37 24 37C26.8 37 28 39 28 42C28 45.5 31 48 34 48C38 48 41 45.5 41 41C41 38.5 39.5 37 37 36L39 33C43 35 45 37.5 45 41Z"
          fill={`url(#grad-s-${variant})`}
        />

        {/* Central AI Aperture / Camera Reticle */}
        <circle
          cx="32"
          cy="32"
          r="7"
          fill="#0f172a"
          stroke={`url(#grad-p-${variant})`}
          strokeWidth="2"
        />
        <circle cx="32" cy="32" r="3.2" fill={accentColor} />
        <circle cx="34" cy="30" r="1.2" fill="#ffffff" />

        {/* Crosshair Scanner Indicators */}
        <line x1="32" y1="19" x2="32" y2="22" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="42" x2="32" y2="45" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="32" x2="22" y2="32" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="32" x2="45" y2="32" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
            WasteWatch <span style={{ color: accentColor }}>AI</span>
          </span>
          {subtitle && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export { AppLogo }
