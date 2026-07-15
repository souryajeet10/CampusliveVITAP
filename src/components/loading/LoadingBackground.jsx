import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const PARTICLE_COUNT = 28;

function createParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 4,
    opacity: 0.15 + Math.random() * 0.45,
  }));
}

const MESH_BLOBS = [
  { color: 'rgba(59, 130, 246, 0.35)', x: '15%', y: '20%', size: '45vw' },
  { color: 'rgba(99, 102, 241, 0.3)', x: '70%', y: '15%', size: '38vw' },
  { color: 'rgba(168, 85, 247, 0.22)', x: '55%', y: '65%', size: '42vw' },
  { color: 'rgba(37, 99, 235, 0.18)', x: '10%', y: '70%', size: '35vw' },
];

const LoadingBackground = memo(function LoadingBackground() {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(() => createParticles(PARTICLE_COUNT), []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#050810]" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 58, 138, 0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(88, 28, 135, 0.2) 0%, transparent 55%), linear-gradient(165deg, #050810 0%, #0a0f1a 40%, #060a14 100%)',
        }}
      />

      {MESH_BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            background: blob.color,
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
            transform: 'translate(-50%, -50%)',
          }}
          animate={
            reduceMotion
              ? { opacity: 0.6 }
              : {
                  x: [0, 30, -20, 0],
                  y: [0, -25, 15, 0],
                  scale: [1, 1.08, 0.95, 1],
                  opacity: [0.5, 0.75, 0.55, 0.5],
                }
          }
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(96, 165, 250, 0.04) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        animate={reduceMotion ? {} : { backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400/80 pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 ${p.size * 3}px rgba(96, 165, 250, 0.4)`,
          }}
          animate={
            reduceMotion
              ? { opacity: p.opacity }
              : {
                  y: [0, -18, 0],
                  opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.4],
                }
          }
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
});

export default LoadingBackground;
