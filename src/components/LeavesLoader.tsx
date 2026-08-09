import React from 'react';

interface LeavesLoaderProps {
  message?: string;
  submessage?: string;
  compact?: boolean;
}

const LEAF_COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#1b4332', '#95d5b2'];

const LEAF_DROP = [
  { left: '8%', size: 22, duration: 4.6, delay: 0, sway: 18, spin: -340 },
  { left: '26%', size: 15, duration: 5.4, delay: 0.9, sway: -22, spin: 300 },
  { left: '45%', size: 19, duration: 4.2, delay: 0.4, sway: 26, spin: -280 },
  { left: '62%', size: 14, duration: 5.8, delay: 1.6, sway: -18, spin: 320 },
  { left: '76%', size: 21, duration: 4.9, delay: 0.2, sway: 20, spin: -360 },
  { left: '90%', size: 16, duration: 5.2, delay: 2.1, sway: -24, spin: 280 }
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

const UnpluggedConnector: React.FC = () => (
  <svg
    width="64"
    height="30"
    viewBox="0 0 64 30"
    fill="none"
    className="plug-flicker"
    aria-hidden="true"
  >
    {/* dangling cable */}
    <path
      d="M4 8 C 16 8, 18 22, 28 20"
      stroke="#cbd5e1"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* plug body pulled out */}
    <rect x="28" y="12" width="11" height="15" rx="2.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
    <path d="M31.5 15 v9 M 35.5 15 v9" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    {/* plug prongs (separated from socket) */}
    <rect x="39" y="14" width="7" height="2.4" rx="1.2" fill="#64748b" />
    <rect x="39" y="21" width="7" height="2.4" rx="1.2" fill="#64748b" />
    {/* wall socket */}
    <rect x="56" y="10" width="6" height="18" rx="2.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.2" />
    <circle cx="59" cy="15" r="1.4" fill="#94a3b8" />
    <circle cx="59" cy="23" r="1.4" fill="#94a3b8" />
  </svg>
);

export const LeavesLoader: React.FC<LeavesLoaderProps> = ({
  message = 'Cargando datos desde la base de datos...',
  submessage,
  compact = false
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden w-full ${compact ? 'py-10 gap-3' : 'py-16 gap-5 min-h-[280px]'}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {LEAF_DROP.map((leaf, i) => (
          <Leaf
            key={i}
            color={LEAF_COLORS[i % LEAF_COLORS.length]}
            style={{
              width: leaf.size,
              height: leaf.size,
              left: leaf.left,
              top: '-30px',
              ['--fall-distance' as any]: compact ? '180px' : '300px',
              ['--sway' as any]: `${leaf.sway}px`,
              ['--leaf-spin' as any]: `${leaf.spin}deg`,
              animation: `leaf-fall ${leaf.duration}s linear ${leaf.delay}s infinite`
            }}
          />
        ))}
      </div>

      <div className={`relative flex flex-col items-center justify-center gap-2.5 text-center ${compact ? 'scale-95' : ''}`}>
        <div className="flex items-end gap-2.5 mb-1">
          {[0, 1, 2].map((i) => (
            <Leaf
              key={i}
              color={LEAF_COLORS[i]}
              style={{
                width: 20,
                height: 20,
                position: 'relative',
                animation: `leaf-dot 1.4s ease-in-out ${i * 0.22}s infinite`
              }}
            />
          ))}
        </div>
        <p className="text-xs sm:text-sm font-extrabold text-vivero-primary text-center tracking-wide">{message}</p>
        {submessage && (
          <p className="text-[11px] font-semibold text-slate-400 text-center animate-pulse">{submessage}</p>
        )}
      </div>
    </div>
  );
};

export default LeavesLoader;
