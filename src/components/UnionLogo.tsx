import React from 'react';

// Beautiful SVG representation of the UniOn Logo
export const UnionLogo: React.FC<{ className?: string; size?: number; showText?: boolean }> = ({ 
  className = '', 
  size = 64,
  showText = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 400 360" 
        width={size} 
        height={size * (360 / 400)}
        className="w-full h-full"
      >
        <defs>
          {/* Silver metallic gradient for left side */}
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E0E0E0" />
            <stop offset="75%" stopColor="#A8A8A8" />
            <stop offset="100%" stopColor="#7E7E7E" />
          </linearGradient>

          {/* Charcoal metallic gradient for right side */}
          <linearGradient id="charcoalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A8A8A" />
            <stop offset="35%" stopColor="#555555" />
            <stop offset="70%" stopColor="#2D2D2D" />
            <stop offset="100%" stopColor="#151515" />
          </linearGradient>

          {/* Intermediate smooth crossover gradients */}
          <linearGradient id="silverToCharcoal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A8A8A8" />
            <stop offset="100%" stopColor="#555555" />
          </linearGradient>
          
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        <g filter="url(#dropShadow)">
          {/* TWO DOTS ABOVE THE U-ARMS */}
          {/* Left Dot (Silver) */}
          <circle cx="150" cy="65" r="15" fill="url(#silverGrad)" />
          {/* Right Dot (Charcoal) */}
          <circle cx="250" cy="65" r="15" fill="url(#charcoalGrad)" />

          {/* MAIN U + INFINITY RIBBON */}
          {/* Left Arm of the U (Silver) */}
          <path 
            d="M 135,95 L 135,170 C 135,215 170,250 200,250 C 230,250 265,215 265,170 L 265,95 L 235,95 L 235,170 C 235,190 220,220 200,220 C 180,220 165,190 165,170 L 165,95 Z" 
            fill="url(#silverGrad)" 
            opacity="0.15" 
          />

          {/* Solid Beautiful 3D-effect overlapping curves for the 'U' + Infinity symbol */}
          {/* Left half outer hook & loop */}
          <path
            d="M 135,95 
               C 135,95 135,185 135,185 
               C 135,215 155,230 175,230 
               C 190,230 200,218 200,205 
               C 200,185 170,170 150,170 
               C 135,170 145,145 165,145 
               C 185,145 200,165 200,185
               L 200,185
               C 200,165 185,145 165,145
               C 145,145 135,170 150,170
               C 170,170 200,185 200,205
               C 200,218 190,230 175,230
               C 155,230 135,215 135,185
               Z"
            fill="url(#silverGrad)"
          />

          {/* Right half outer hook & loop */}
          <path
            d="M 265,95 
               C 265,95 265,185 265,185 
               C 265,215 245,230 225,230 
               C 210,230 200,218 200,205 
               C 200,185 230,170 250,170 
               C 265,170 255,145 235,145 
               C 215,145 200,165 200,185
               L 200,185
               C 200,165 215,145 235,145
               C 255,145 265,170 250,170
               C 230,170 200,185 200,205
               C 200,218 210,230 225,230
               C 245,230 265,215 265,185
               Z"
            fill="url(#charcoalGrad)"
          />

          {/* Embedded Infinity sign (overlapping flow in center) */}
          {/* Left loop of infinity */}
          <path 
            d="M 200,185 
               C 180,160 160,160 150,175 
               C 140,190 155,210 175,200 
               C 190,192 195,188 200,185 Z" 
            fill="url(#silverGrad)" 
            opacity="0.9"
          />
          {/* Right loop of infinity */}
          <path 
            d="M 200,185 
               C 220,160 240,160 250,175 
               C 260,190 245,210 225,200 
               C 210,192 205,188 200,185 Z" 
            fill="url(#charcoalGrad)" 
            opacity="0.9"
          />

          {/* Underlay shadow/glow for the central intersection */}
          <circle cx="200" cy="185" r="8" fill="#111111" opacity="0.5" />
          <circle cx="200" cy="185" r="4" fill="url(#silverToCharcoal)" />
        </g>

        {/* Text "UniOn" below the symbol */}
        {showText && (
          <g transform="translate(0, 270)">
            {/* U - Silver */}
            <path d="M 115,15 L 115,38 C 115,48 123,54 133,54 C 143,54 151,48 151,38 L 151,15 L 141,15 L 141,38 C 141,43 137,46 133,46 C 129,46 125,43 125,38 L 125,15 Z" fill="url(#silverGrad)" />
            
            {/* n - Silver */}
            <path d="M 165,25 L 165,54 L 174,54 L 174,34 C 174,29 178,26 183,26 C 188,26 191,29 191,34 L 191,54 L 200,54 L 200,32 C 200,24 194,18 186,18 C 180,18 176,21 174,25 L 174,15 L 165,15 Z" fill="url(#silverGrad)" />
            
            {/* i - Silver */}
            <rect x="212" y="25" width="8" height="29" rx="2" fill="url(#silverGrad)" />
            <circle cx="216" cy="17" r="4" fill="url(#silverGrad)" />

            {/* O - Charcoal (split vertical visual) */}
            <path d="M 245,18 C 233,18 226,27 226,36 C 226,45 233,54 245,54 C 248,54 251,53 254,51" fill="none" stroke="url(#charcoalGrad)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 254,51 C 259,48 262,43 262,36 C 262,27 255,18 245,18" fill="none" stroke="url(#charcoalGrad)" strokeWidth="8" strokeLinecap="round" />

            {/* n - Charcoal */}
            <path d="M 276,25 L 276,54 L 285,54 L 285,34 C 285,29 289,26 294,26 C 299,26 302,29 302,34 L 302,54 L 311,54 L 311,32 C 311,24 305,18 297,18 C 291,18 287,21 285,25 L 285,25 Z" fill="url(#charcoalGrad)" />
          </g>
        )}
      </svg>
    </div>
  );
};

// SVG base64 Data URL representation of the UniOn Logo to use as default entity logo in DB/firebaseStorage
export const UNION_LOGO_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><defs><linearGradient id="s" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FFFFFF"/><stop offset="40%" stop-color="%23E0E0E0"/><stop offset="75%" stop-color="%23A8A8A8"/><stop offset="100%" stop-color="%237E7E7E"/></linearGradient><linearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238A8A8A"/><stop offset="35%" stop-color="%23555555"/><stop offset="70%" stop-color="%232D2D2D"/><stop offset="100%" stop-color="%23151515"/></linearGradient></defs><rect width="400" height="400" fill="%230F0F11" rx="40"/><g transform="translate(0, 10)"><circle cx="150" cy="85" r="18" fill="url(%23s)"/><circle cx="250" cy="85" r="18" fill="url(%23c)"/><path d="M 135,115 C 135,115 135,205 135,205 C 135,235 155,250 175,250 C 190,250 200,238 200,225 C 200,205 170,190 150,190 C 135,190 145,165 165,165 C 185,165 200,185 200,205 C 200,185 185,165 165,165 C 145,165 135,190 150,190 C 170,190 200,205 200,225 C 200,238 190,250 175,250 C 155,250 135,235 135,205 Z" fill="url(%23s)"/><path d="M 265,115 C 265,115 265,205 265,205 C 265,235 245,250 225,250 C 210,250 200,238 200,225 C 200,205 230,190 250,190 C 265,190 255,165 235,165 C 215,165 200,185 200,205 C 200,185 215,165 235,165 C 255,165 265,190 250,190 C 230,190 200,205 200,225 C 200,238 210,250 225,250 C 245,250 265,235 265,205 Z" fill="url(%23c)"/><path d="M 200,205 C 180,180 160,180 150,195 C 140,210 155,230 175,220 C 190,212 195,208 200,205 Z" fill="url(%23s)" opacity="0.9"/><path d="M 200,205 C 220,180 240,180 250,195 C 260,210 245,230 225,220 C 210,212 205,208 200,205 Z" fill="url(%23c)" opacity="0.9"/></g><g transform="translate(45, 295)"><path d="M 15,15 L 15,38 C 15,48 23,54 33,54 C 43,54 51,48 51,38 L 51,15 L 41,15 L 41,38 C 41,43 37,46 33,46 C 29,46 25,43 25,38 L 25,15 Z" fill="url(%23s)"/><path d="M 65,25 L 65,54 L 74,54 L 74,34 C 74,29 78,26 83,26 C 88,26 91,29 91,34 L 91,54 L 100,54 L 100,32 C 100,24 94,18 86,18 C 80,18 76,21 74,25 L 74,15 L 65,15 Z" fill="url(%23s)"/><rect x="112" y="25" width="8" height="29" rx="2" fill="url(%23s)"/><circle cx="116" cy="17" r="4" fill="url(%23s)"/><path d="M 145,18 C 133,18 126,27 126,36 C 126,45 133,54 145,54 C 148,54 151,53 154,51" fill="none" stroke="url(%23c)" stroke-width="8" stroke-linecap="round"/><path d="M 154,51 C 159,48 162,43 162,36 C 162,27 155,18 145,18" fill="none" stroke="url(%23c)" stroke-width="8" stroke-linecap="round"/><path d="M 176,25 L 176,54 L 185,54 L 185,34 C 185,29 189,26 194,26 C 199,26 202,29 202,34 L 202,54 L 211,54 L 211,32 C 211,24 205,18 197,18 C 191,18 187,21 185,25 Z" fill="url(%23c)"/></g></svg>`;
