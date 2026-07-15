import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const LOOP_DURATION = 7;

const ACTIVITY_MARKERS = [
  { cx: 52, cy: 38, color: '#a78bfa', delay: 0 },
  { cx: 148, cy: 52, color: '#60a5fa', delay: 0.15 },
  { cx: 130, cy: 98, color: '#34d399', delay: 0.3 },
  { cx: 68, cy: 105, color: '#f472b6', delay: 0.45 },
];

const CONNECTIONS = [
  { x1: 100, y1: 72, x2: 52, y2: 38 },
  { x1: 100, y1: 72, x2: 148, y2: 52 },
  { x1: 100, y1: 72, x2: 130, y2: 98 },
  { x1: 100, y1: 72, x2: 68, y2: 105 },
  { x1: 52, y1: 38, x2: 148, y2: 52 },
  { x1: 130, y1: 98, x2: 68, y2: 105 },
];

const sequenceVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const CampusMapAnimation = memo(function CampusMapAnimation() {
  const reduceMotion = useReducedMotion();
  const loop = reduceMotion ? false : Infinity;

  return (
    <div className="relative w-full max-w-[220px] sm:max-w-[260px] mx-auto aspect-[10/7]" aria-hidden="true">
      <svg
        viewBox="0 0 200 140"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mapFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(30, 58, 138, 0.25)" />
            <stop offset="100%" stopColor="rgba(49, 46, 129, 0.15)" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0)" />
            <stop offset="50%" stopColor="rgba(96, 165, 250, 0.9)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Step 1: Map fades in */}
        <motion.g
          variants={sequenceVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.path
            d="M 28 95 L 45 55 L 78 42 L 115 48 L 155 38 L 172 65 L 165 105 L 120 118 L 75 112 L 35 108 Z"
            fill="url(#mapFill)"
            stroke="rgba(96, 165, 250, 0.35)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {[45, 78, 115, 140].map((x, i) => (
            <motion.rect
              key={i}
              x={x - 6}
              y={58 + (i % 2) * 12}
              width={12}
              height={10}
              rx={2}
              fill="rgba(148, 163, 184, 0.12)"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="0.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
            />
          ))}

          <motion.path
            d="M 55 78 Q 100 68 145 75"
            stroke="rgba(96, 165, 250, 0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          />
        </motion.g>

        {/* Step 5: Connection lines */}
        <g filter="url(#glow)">
          {CONNECTIONS.map((line, i) => {
            const length = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
            return (
              <motion.line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="url(#lineGrad)"
                strokeWidth="1"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 0.7, 0.7, 0],
                }}
                transition={{
                  duration: LOOP_DURATION,
                  repeat: loop,
                  times: [0, 0.55, 0.78, 1],
                  delay: 2.2 + i * 0.12,
                  ease: 'easeInOut',
                }}
                style={{ strokeDasharray: length, strokeDashoffset: 0 }}
              />
            );
          })}
        </g>

        {/* Step 3: Pulse from main marker */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`pulse-${i}`}
            cx="100"
            cy="72"
            r="8"
            fill="none"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="1.5"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
              scale: [0.3, 2.8, 2.8],
              opacity: [0.7, 0, 0],
            }}
            transition={{
              duration: LOOP_DURATION,
              repeat: loop,
              times: [0, 0.35, 0.5],
              delay: 1.4 + i * 0.35,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: '100px 72px' }}
          />
        ))}

        {/* Step 4: Activity markers */}
        {ACTIVITY_MARKERS.map((marker, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={marker.cx}
              cy={marker.cy}
              r="5"
              fill={marker.color}
              filter="url(#glow)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1, 1, 0],
                opacity: [0, 1, 0.9, 1, 0],
              }}
              transition={{
                duration: LOOP_DURATION,
                repeat: loop,
                times: [0, 0.42, 0.48, 0.82, 1],
                delay: 1.8 + marker.delay,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ transformOrigin: `${marker.cx}px ${marker.cy}px` }}
            />
            <motion.circle
              cx={marker.cx}
              cy={marker.cy}
              r="2"
              fill="white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                duration: LOOP_DURATION,
                repeat: loop,
                times: [0, 0.45, 0.82, 1],
                delay: 1.9 + marker.delay,
              }}
            />
          </motion.g>
        ))}

        {/* Step 2: Main pin drops */}
        <motion.g
          filter="url(#glow)"
          initial={{ y: -30, opacity: 0 }}
          animate={{
            y: [ -30, 4, 0, 0, 0 ],
            opacity: [0, 1, 1, 1, 1],
          }}
          transition={{
            duration: LOOP_DURATION,
            repeat: loop,
            times: [0, 0.12, 0.18, 0.88, 1],
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <motion.path
            d="M 100 52 C 92 52 86 58 86 66 C 86 76 100 92 100 92 C 100 92 114 76 114 66 C 114 58 108 52 100 52 Z"
            fill="#3b82f6"
            animate={
              reduceMotion
                ? {}
                : {
                    filter: [
                      'drop-shadow(0 0 4px rgba(59,130,246,0.5))',
                      'drop-shadow(0 0 12px rgba(59,130,246,0.9))',
                      'drop-shadow(0 0 4px rgba(59,130,246,0.5))',
                    ],
                  }
            }
            transition={{ duration: 2.5, repeat: loop, ease: 'easeInOut', delay: 2.5 }}
          />
          <circle cx="100" cy="64" r="4" fill="white" opacity="0.9" />
        </motion.g>

        {/* Step 6: Global glow overlay */}
        <motion.rect
          x="20"
          y="30"
          width="160"
          height="90"
          rx="8"
          fill="rgba(59, 130, 246, 0.06)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.5, 0.5, 0] }}
          transition={{
            duration: LOOP_DURATION,
            repeat: loop,
            times: [0, 0.65, 0.75, 0.88, 1],
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  );
});

export default CampusMapAnimation;
