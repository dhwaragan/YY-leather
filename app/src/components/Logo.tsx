/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  color?: string; // e.g. '#8B5A2B'
  textColor?: string; // e.g. '#000000' or '#white'
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-full max-w-[280px]", 
  showTagline = true,
  color = "#8B5A2B", // Elegant warm leather brown
  textColor = "#171717"
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <svg 
        viewBox="0 0 400 320" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-auto"
      >
        {/* ================= 1. CLASSIC SHOE OUTLINE VECTOR (AT THE TOP) ================= */}
        <g id="shoe-vector" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Main top outline collar & laces */}
          <path d="M160 160 C 185 140, 200 135, 215 142 C 225 148, 230 160, 245 168 C 255 174, 275 178, 295 184 C 302 186, 305 190, 300 195 C 295 200, 280 201, 260 200 C 240 199, 210 204, 195 207 C 185 209, 160 209, 160 201 Z" fill="none" />
          
          {/* Heel outline details */}
          <path d="M160 178 L 160 205 C 160 208, 165 209, 185 209 L 185 201" fill="none" />
          
          {/* Lacing section details */}
          <path d="M195 148 L 210 162" />
          <path d="M202 144 L 217 158" strokeWidth="2.5" />
          <path d="M208 141 L 223 155" />
          
          {/* Captoe dividing stitch */}
          <path d="M272 180 C 270 188, 271 193, 274 199" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* Sole base lift double thread */}
          <path d="M158 206 L 301 206" strokeWidth="1.5" />
          <path d="M160 209 L 297 209" strokeWidth="2" />
        </g>

        {/* ================= 2. REFINED 'Y|Y' BRAND LABELS ================= */}
        <g id="brand-y-y">
          {/* Left Y letter */}
          <text 
            x="145" 
            y="275" 
            fontFamily="'Playfair Display', 'Cormorant Garamond', Georgia, serif" 
            fontSize="102" 
            fontWeight="bold" 
            fill={color} 
            textAnchor="middle"
          >
            Y
          </text>
          
          {/* Middle vertical divider */}
          <line 
            x1="200" 
            y1="200" 
            x2="200" 
            y2="300" 
            stroke={color} 
            strokeWidth="6" 
          />
          
          {/* Right Y letter */}
          <text 
            x="255" 
            y="275" 
            fontFamily="'Playfair Display', 'Cormorant Garamond', Georgia, serif" 
            fontSize="102" 
            fontWeight="bold" 
            fill={color} 
            textAnchor="middle"
          >
            Y
          </text>
        </g>
      </svg>

      {/* ================= 3. LEATHERS TEXT & TAGLINES ================= */}
      <h2 
        className="font-serif text-3xl font-normal tracking-[0.25em] uppercase -mt-4 transition-colors duration-700 font-bold"
        style={{ color: textColor }}
      >
        LEATHERS
      </h2>

      {showTagline && (
        <div className="mt-3 flex flex-col items-center">
          <div className="w-24 h-[1px] bg-neutral-200 mb-2" />
          <p 
            className="font-serif italic text-base font-medium"
            style={{ color: color }}
          >
            "We Buy Your Old Shoes Back"
          </p>
        </div>
      )}
    </div>
  );
};

// Simple, compact inline variant designed specifically for the navbar header (white/gold colored)
export const LogoNavbar: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <button 
      id="navbar-logo-btn"
      onClick={onClick} 
      className="group flex items-center gap-3 cursor-pointer focus:outline-none text-left select-none"
    >
      {/* Brand Icon */}
      <div className="h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center transition-all duration-700 rounded-full overflow-hidden ring-2 ring-gold/20 shadow-xl bg-white/5">
        <img src="https://res.cloudinary.com/domuelr1f/image/upload/f_auto,q_60,w_200/v1781330047/WhatsApp_Image_2026-06-06_at_8.18.23_PM_1_a7mhk6.jpg" alt="YY Leathers Logo" className="h-full w-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700" loading="eager" decoding="async" />
      </div>
    </button>
  );
};
