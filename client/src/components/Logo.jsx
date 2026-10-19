import React from 'react';

export default function Logo({ size = 'md', showText = true, className = '', color = 'currentColor' }) {
  // Sizes mapping
  const dimensions = {
    sm: { height: 28, textScale: '1.1rem' },
    md: { height: 36, textScale: '1.4rem' },
    lg: { height: 48, textScale: '1.8rem' },
    xl: { height: 64, textScale: '2.4rem' },
  };

  const dim = dimensions[size] || dimensions.md;

  return (
    <div className={`quizzup-brand ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Official Quizzup Stylized Q Mark */}
      <svg
        height={dim.height}
        viewBox="0 0 130 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, overflow: 'visible' }}
      >
        {/* Main Q / Question Mark Arch */}
        <path
          d="M 65 10 
             C 95 10 120 35 120 65 
             C 120 85 109 102 92 111 
             L 76 92 
             C 86 86 93 76 93 65 
             C 93 50 80 37 65 37 
             C 50 37 37 50 37 65 
             C 37 76 44 86 54 92 
             L 38 111 
             C 21 102 10 85 10 65 
             C 10 35 35 10 65 10 Z"
          fill="#FFC700"
        />
        {/* Bottom Right Dot of Question Mark Q */}
        <circle cx="95" cy="115" r="13" fill="#FFC700" />
      </svg>

      {showText && (
        <span
          className="quizzup-wordmark"
          style={{
            fontFamily: "'Outfit', 'Poppins', sans-serif",
            fontWeight: 900,
            fontSize: dim.textScale,
            letterSpacing: '0.02em',
            color: '#FFC700',
            textTransform: 'uppercase',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          QUIZZUP
        </span>
      )}
    </div>
  );
}
