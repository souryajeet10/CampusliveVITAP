import { useMemo } from 'react';

export default function AnimatedBackground() {
  const particles = useMemo(() => {
    const count = 50;
    const colors = {
      indigo: 'rgb(99, 102, 241)',
      blue: 'rgb(59, 130, 246)',
      emerald: 'rgb(16, 185, 129)',
      white: 'rgb(255, 255, 255)',
    };

    return Array.from({ length: count }, (_, i) => {
      // 70% chance of white, 10% indigo, 10% blue, 10% emerald
      const rand = Math.random();
      let colorName = 'white';
      let color = colors.white;
      let minOp = 0.03;
      let maxOp = 0.08;

      if (rand < 0.1) {
        colorName = 'indigo';
        color = colors.indigo;
        minOp = 0.05;
        maxOp = 0.12;
      } else if (rand < 0.2) {
        colorName = 'blue';
        color = colors.blue;
        minOp = 0.04;
        maxOp = 0.11;
      } else if (rand < 0.3) {
        colorName = 'emerald';
        color = colors.emerald;
        minOp = 0.03;
        maxOp = 0.10;
      }

      const size = (Math.random() * 3 + 2).toFixed(1); // 2px to 5px
      const x = (Math.random() * 100).toFixed(2);
      const y = (Math.random() * 100).toFixed(2);
      
      // Gentle drift: -40px to +40px
      const driftX = (Math.random() * 80 - 40).toFixed(1);
      const driftY = (Math.random() * 80 - 40).toFixed(1);
      
      const duration = (Math.random() * 20 + 15).toFixed(1); // 15s to 35s
      const delay = (Math.random() * -35).toFixed(1); // Random starting point

      const scaleMid = (Math.random() * 0.5 + 0.75).toFixed(2); // 0.75 to 1.25 scale

      // Generate random opacities within the allowed bounds
      const op0 = (Math.random() * (maxOp - minOp) + minOp).toFixed(3);
      const op50 = (Math.random() * (maxOp - minOp) + minOp).toFixed(3);
      const op100 = (Math.random() * (maxOp - minOp) + minOp).toFixed(3);

      return {
        id: i,
        x,
        y,
        size,
        color,
        colorName,
        driftX,
        driftY,
        duration,
        delay,
        scaleMid,
        op0,
        op50,
        op100,
      };
    });
  }, []);

  // Generate dynamic keyframes for each particle to ensure organic paths
  const styleSheet = useMemo(() => {
    let css = '';
    particles.forEach((p) => {
      css += `
        @keyframes float-particle-${p.id} {
          0% {
            transform: translate3d(0, 0, 0) scale(1.0);
            opacity: ${p.op0};
          }
          50% {
            transform: translate3d(${p.driftX}px, ${p.driftY}px, 0) scale(${p.scaleMid});
            opacity: ${p.op50};
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1.0);
            opacity: ${p.op100};
          }
        }
      `;
    });

    // Handle prefers-reduced-motion to completely freeze animations for accessibility
    css += `
      @media (prefers-reduced-motion: reduce) {
        .animate-particle-float {
          animation: none !important;
          transform: none !important;
          opacity: 0.06 !important;
        }
      }
    `;
    return css;
  }, [particles]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[-1]">
      <style dangerouslySetInnerHTML={{ __html: styleSheet }} />
      
      {/* Premium subtle grid pattern with radial fading mask */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)',
        }}
      />
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-particle-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 6px 1px ${p.colorName === 'white' ? 'rgba(255,255,255,0.4)' : p.color}`,
            animation: `float-particle-${p.id} ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
