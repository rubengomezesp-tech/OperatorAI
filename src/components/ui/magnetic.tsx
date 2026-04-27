'use client';

/**
 * Magnetic — Wraps any element to add a subtle "magnetic" hover effect.
 *
 * The child follows the cursor slightly when hovered, creating a
 * premium tactile feeling. Uses framer-motion springs for natural feel.
 *
 * Usage:
 *   <Magnetic>
 *     <Button>Click me</Button>
 *   </Magnetic>
 *
 * Note: child must be a single element that accepts a ref.
 */

import { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface MagneticProps {
  children: React.ReactNode;
  /** strength 0..1 (default: 0.3) */
  strength?: number;
  /** disable on small screens (default: true) */
  disableOnMobile?: boolean;
  className?: string;
}

export function Magnetic({
  children,
  strength = 0.3,
  disableOnMobile = true,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const x = useSpring(0, { stiffness: 250, damping: 28 });
  const y = useSpring(0, { stiffness: 250, damping: 28 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    if (disableOnMobile && window.innerWidth < 768) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    x.set(deltaX);
    y.set(deltaY);
  }

  function handleMouseLeave() {
    setIsHovering(false);
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        x,
        y,
        display: 'inline-block',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
