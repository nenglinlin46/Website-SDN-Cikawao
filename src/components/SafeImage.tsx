import React, { useEffect, useState } from 'react';
import { Icon3D } from './Icon3D';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 flex flex-col items-center justify-center p-6 text-center text-[#132A2E] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon3D name="image-off" tone="amber" size="lg" variant="tile" className="mb-2" />
        <span className="text-xs font-semibold text-[#132A2E] line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
