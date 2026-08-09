import React from 'react';

interface LeavesLoaderProps {
  message?: string;
  submessage?: string;
  compact?: boolean;
  fullscreen?: boolean;
}

const LEAF_COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#1b4332', '#95d5b2'];

const LEAF_DROP = [
  { left: '4%', size: 24, duration: 5.2, delay: 0.1, sway: 22, spin: -360 },
  { left: '12%', size: 16, duration: 6.1, delay: 1.2, sway: -20, spin: 320 },
  { left: '20%', size: 20, duration: 4.8, delay: 0.5, sway: 26, spin: -290 },
  { left: '29%', size: 15, duration: 5.8, delay: 2.1, sway: -18, spin: 340 },
  { left: '38%', size: 22, duration: 4.5, delay: 0.2, sway: 24, spin: -310 },
  { left: '47%', size: 18, duration: 5.5, delay: 1.8, sway: -25, spin: 300 },
  { left: '55%', size: 21, duration: 4.9, delay: 0.7, sway: 20, spin: -350 },
  { left: '64%', size: 14, duration: 6.3, delay: 2.4, sway: -22, spin: 330 },
  { left: '72%', size: 19, duration: 5.1, delay: 0.4, sway: 28, spin: -270 },
  { left: '81%', size: 16, duration: 5.7, delay: 1.5, sway: -19, spin: 310 },
  { left: '89%', size: 23, duration: 4.6, delay: 0.9, sway: 25, spin: -330 },
  { left: '96%', size: 17, duration: 6.0, delay: 2.0, sway: -21, spin: 290 }
];

const Leaf: React.FC<{ style: React.CSSProperties; color: string }> = ({ style, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    style={style}
    className="absolute pointer-events-none"
  >
    <path
      d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
      fill={color}
      opacity="0.9"
    />
    <path
      d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.7"
    />
  </svg>
);

export const LeavesLoader: React.FC<LeavesLoaderProps> = ({
  message = 'Cargando datos desde la base de datos...',
  submessage,
  compact = false,
  fullscreen = true
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full my-auto ${
        compact ? 'min-h-[240px] py-6' : 'min-h-[60vh] sm:min-h-[70vh] py-12'
      }`}
    >
      {/* Fullscreen Floating Leaves Layer */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {LEAF_DROP.map((leaf, i) => (
          <Leaf
            key={i}
            color={LEAF_COLORS[i % LEAF_COLORS.length]}
            style={{
              width: leaf.size,
              height: leaf.size,
              left: leaf.left,
              top: '-40px',
              ['--fall-distance' as any]: '108vh',
              ['--sway' as any]: `${leaf.sway}px`,
              ['--leaf-spin' as any]: `${leaf.spin}deg`,
              animation: `leaf-fall ${leaf.duration}s linear ${leaf.delay}s infinite`
            }}
          />
        ))}
      </div>

      {/* Centered Transparent Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 text-center p-4">
        <div className="flex items-end gap-2.5 mb-1">
          {[0, 1, 2].map((i) => (
            <Leaf
              key={i}
              color={LEAF_COLORS[i]}
              style={{
                width: 22,
                height: 22,
                position: 'relative',
                animation: `leaf-dot 1.4s ease-in-out ${i * 0.22}s infinite`
              }}
            />
          ))}
        </div>
        <p className="text-xs sm:text-sm font-black text-vivero-primary text-center tracking-wide">{message}</p>
        {submessage && (
          <p className="text-[11px] font-semibold text-slate-400 text-center animate-pulse">{submessage}</p>
        )}
      </div>
    </div>
  );
};

export default LeavesLoader;
