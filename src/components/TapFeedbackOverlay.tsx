import React, { useEffect, useRef, useState } from 'react';

interface TapParticle {
  id: string;
  tx: string;
  ty: string;
  color: string;
  size: number;
  isDiamond: boolean;
}

interface ElementRipple {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
  localX: number;
  localY: number;
  diameter: number;
  gradient: string;
}

interface TapBurst {
  id: number;
  x: number;
  y: number;
  ringColor: string;
  secondaryRingColor: string;
  innerColor: string;
  particles: TapParticle[];
  elementRipple?: ElementRipple;
}

const SCHOOL_SPARK_COLORS = [
  '#10B981', // Emerald Cikawao
  '#0EA5E9', // Cerulean Sky
  '#F59E0B', // Sunny Marigold
  '#F43F5E', // Rose Berry
  '#8B5CF6', // Violet Sunda
  '#F97316', // Warm Coral
  '#14B8A6', // Teal Lagoon
];

export const TapFeedbackOverlay: React.FC = () => {
  const [bursts, setBursts] = useState<TapBurst[]>([]);
  const nextIdRef = useRef(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handlePointerDown = (e: PointerEvent) => {
      if (reducedMotionQuery.matches) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const id = nextIdRef.current++;
      const colorOffset = id % SCHOOL_SPARK_COLORS.length;
      const ringColor = SCHOOL_SPARK_COLORS[colorOffset];
      const secondaryRingColor = SCHOOL_SPARK_COLORS[(colorOffset + 2) % SCHOOL_SPARK_COLORS.length];
      const innerColor = SCHOOL_SPARK_COLORS[(colorOffset + 4) % SCHOOL_SPARK_COLORS.length];

      // Find nearest interactive element to illuminate with an exact local color ripple & hue glow
      let elementRipple: ElementRipple | undefined;
      const rawTarget = e.target as HTMLElement | null;
      const interactiveEl = rawTarget?.closest(
        'button, a, [role="button"], .card-interactive, summary, select, input[type="checkbox"]'
      ) as HTMLElement | null;

      if (interactiveEl) {
        interactiveEl.style.setProperty('--tap-ring', `${ringColor}55`);
        interactiveEl.style.setProperty('--tap-glow', `${secondaryRingColor}70`);
        interactiveEl.setAttribute('data-tapped', 'true');
        window.setTimeout(() => {
          interactiveEl.removeAttribute('data-tapped');
        }, 360);

        const rect = interactiveEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const style = window.getComputedStyle(interactiveEl);
          const localX = e.clientX - rect.left;
          const localY = e.clientY - rect.top;
          const maxDx = Math.max(localX, rect.width - localX);
          const maxDy = Math.max(localY, rect.height - localY);
          const diameter = Math.ceil(Math.hypot(maxDx, maxDy) * 2.15);

          elementRipple = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: style.borderRadius || '12px',
            localX,
            localY,
            diameter,
            gradient: `radial-gradient(circle, ${ringColor}66 0%, ${secondaryRingColor}44 45%, ${innerColor}18 75%, transparent 100%)`,
          };
        }
      }

      const particleCount = 10;
      const particles: TapParticle[] = Array.from({ length: particleCount }, (_, idx) => {
        const angle = (Math.PI * 2 * idx) / particleCount + (id % 4) * 0.22;
        const distance = 26 + ((idx + id) % 3) * 12;
        return {
          id: `${id}-${idx}`,
          tx: `${Math.cos(angle) * distance}px`,
          ty: `${Math.sin(angle) * distance}px`,
          color: SCHOOL_SPARK_COLORS[(colorOffset + idx) % SCHOOL_SPARK_COLORS.length],
          size: idx % 2 === 0 ? 7 : 5,
          isDiamond: idx % 3 === 0,
        };
      });

      const burst: TapBurst = {
        id,
        x: e.clientX,
        y: e.clientY,
        ringColor,
        secondaryRingColor,
        innerColor,
        particles,
        elementRipple,
      };

      setBursts((prev) => [...prev.slice(-10), burst]);

      window.setTimeout(() => {
        setBursts((prev) => prev.filter((item) => item.id !== id));
      }, 520);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  if (bursts.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {bursts.map((burst) => (
        <React.Fragment key={burst.id}>
          {/* Local clipped element color-wave ripple */}
          {burst.elementRipple && (
            <div
              style={{
                top: burst.elementRipple.top,
                left: burst.elementRipple.left,
                width: burst.elementRipple.width,
                height: burst.elementRipple.height,
                borderRadius: burst.elementRipple.borderRadius,
              }}
              className="fixed overflow-hidden"
            >
              <span
                style={{
                  left: burst.elementRipple.localX,
                  top: burst.elementRipple.localY,
                  width: burst.elementRipple.diameter,
                  height: burst.elementRipple.diameter,
                  background: burst.elementRipple.gradient,
                }}
                className="absolute rounded-full animate-tap-element-ripple"
              />
            </div>
          )}

          {/* Point-of-contact multi-color rings, flash aura, and flying sparks */}
          <div style={{ left: burst.x, top: burst.y }} className="fixed w-0 h-0">
            <span
              style={{ borderColor: burst.ringColor }}
              className="absolute w-12 h-12 rounded-full border-[2.5px] animate-tap-ring"
            />
            <span
              style={{ borderColor: burst.secondaryRingColor }}
              className="absolute w-8 h-8 rounded-full border-2 animate-tap-inner"
            />
            <span
              style={{
                background: `radial-gradient(circle, ${burst.innerColor}70 0%, ${burst.ringColor}30 55%, transparent 100%)`,
              }}
              className="absolute w-12 h-12 rounded-full animate-tap-inner"
            />
            {burst.particles.map((p) => (
              <span
                key={p.id}
                style={
                  {
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    borderRadius: p.isDiamond ? '2px' : '9999px',
                    '--tx': p.tx,
                    '--ty': p.ty,
                  } as React.CSSProperties
                }
                className="absolute animate-tap-spark"
              />
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
