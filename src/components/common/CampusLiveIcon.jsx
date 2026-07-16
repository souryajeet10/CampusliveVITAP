import React from 'react';

const CampusLiveIcon = ({ className = 'w-9 h-9', variant = 'glow', ...props }) => {
  const isGlow = variant === 'glow';
  const isMonochrome = variant === 'monochrome';
  const isSolid = variant === 'solid';
  
  // Choose stroke & fill colors
  const chaliceStroke = isMonochrome ? 'currentColor' : (isSolid ? '#6366f1' : 'url(#chalice-grad)');
  const hexStroke = isMonochrome ? 'currentColor' : (isSolid ? '#22d3ee' : 'url(#hex-grad)');
  const lineStroke = isMonochrome ? 'currentColor' : (isSolid ? '#22d3ee' : 'url(#line-grad)');
  const nodeFill = isMonochrome ? 'currentColor' : '#22d3ee';

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {!isMonochrome && (
        <defs>
          {/* Glow filter */}
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer Glow filter for nodes */}
          <filter id="logo-node-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="chalice-grad" x1="50" y1="45" x2="50" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan */}
            <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
            <stop offset="100%" stopColor="#a855f7" /> {/* Purple */}
          </linearGradient>

          <linearGradient id="hex-grad" x1="50" y1="22" x2="50" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <linearGradient id="line-grad" x1="50" y1="5" x2="50" y2="23.7" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      )}

      {/* Vertical Lines */}
      <line
        x1="47"
        y1="5"
        x2="47"
        y2="23.7"
        stroke={lineStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        filter={isGlow ? "url(#logo-glow)" : undefined}
      />
      <line
        x1="53"
        y1="5"
        x2="53"
        y2="23.7"
        stroke={lineStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        filter={isGlow ? "url(#logo-glow)" : undefined}
      />

      {/* Hexagon Structure */}
      <polygon
        points="50,22 65.588,31 65.588,49 50,58 34.412,49 34.412,31"
        stroke={hexStroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
        filter={isGlow ? "url(#logo-glow)" : undefined}
      />

      {/* Inner Radial Lines */}
      <line x1="50" y1="40" x2="50" y2="22" stroke={hexStroke} strokeWidth="1" filter={isGlow ? "url(#logo-glow)" : undefined} />
      <line x1="50" y1="40" x2="65.588" y2="31" stroke={hexStroke} strokeWidth="1" filter={isGlow ? "url(#logo-glow)" : undefined} />
      <line x1="50" y1="40" x2="65.588" y2="49" stroke={hexStroke} strokeWidth="1" filter={isGlow ? "url(#logo-glow)" : undefined} />
      <line x1="50" y1="40" x2="50" y2="58" stroke={hexStroke} strokeWidth="1" filter={isGlow ? "url(#logo-glow)" : undefined} />
      <line x1="50" y1="40" x2="34.412" y2="49" stroke={hexStroke} strokeWidth="1" filter={isGlow ? "url(#logo-glow)" : undefined} />
      <line x1="50" y1="40" x2="34.412" y2="31" stroke={hexStroke} strokeWidth="1" filter={isGlow ? "url(#logo-glow)" : undefined} />

      {/* Inner Circle */}
      <circle
        cx="50"
        cy="40"
        r="7.5"
        stroke={hexStroke}
        strokeWidth="1"
        filter={isGlow ? "url(#logo-glow)" : undefined}
      />

      {/* Chalice / Wings Shape at bottom - Symmetrical Crossover Loops */}
      <path
        d="M 50 95 C 42 90 14 74 14 48 C 14 45 18 45 22 55 C 38 68 53 78 53 85 C 53 89 51 93 50 95 Z"
        stroke={chaliceStroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={isMonochrome ? 'none' : 'url(#chalice-grad)'}
        fillOpacity={isMonochrome ? 0 : 0.04}
        filter={isGlow ? "url(#logo-glow)" : undefined}
      />
      <path
        d="M 50 95 C 58 90 86 74 86 48 C 86 45 82 45 78 55 C 62 68 47 78 47 85 C 47 89 49 93 50 95 Z"
        stroke={chaliceStroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={isMonochrome ? 'none' : 'url(#chalice-grad)'}
        fillOpacity={isMonochrome ? 0 : 0.04}
        filter={isGlow ? "url(#logo-glow)" : undefined}
      />

      {/* Glowing Nodes / Dots */}
      <circle cx="50" cy="40" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
      <circle cx="50" cy="22" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
      <circle cx="65.588" cy="31" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
      <circle cx="65.588" cy="49" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
      <circle cx="50" cy="58" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
      <circle cx="34.412" cy="49" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
      <circle cx="34.412" cy="31" r="1.8" fill={nodeFill} filter={isGlow ? "url(#logo-node-glow)" : undefined} />
    </svg>
  );
};

export default CampusLiveIcon;
