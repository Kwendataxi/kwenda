import { ImgHTMLAttributes, useState } from 'react';

interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /**
   * Widths for generating srcset (in pixels)
   * Default: [640, 768, 1024, 1280, 1536]
   */
  widths?: number[];
  /**
   * Sizes attribute for responsive images
   * Default: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
   */
  sizes?: string;
  /**
   * Enable WebP format conversion
   * Default: true
   */
  useWebP?: boolean;
}

/**
 * Composant d'image responsive optimisé pour les performances
 * Génère automatiquement srcset et utilise WebP si supporté
 */
export const ResponsiveImage = ({
  src,
  alt,
  widths = [640, 768, 1024, 1280, 1536],
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px",
  useWebP = true,
  loading = 'lazy',
  decoding = 'async',
  className,
  ...props
}: ResponsiveImageProps) => {
  const [imageError, setImageError] = useState(false);

  // Extraire le nom de fichier sans extension
  const getFileNameWithoutExt = (path: string) => {
    const fileName = path.split('/').pop() || '';
    return fileName.replace(/\.[^/.]+$/, '');
  };

  // Générer srcset pour WebP et fallback PNG
  const generateSrcSet = (format: 'webp' | 'png') => {
    const baseName = getFileNameWithoutExt(src);
    return widths
      .map((width) => {
        // Vite gère les imports d'images avec query params
        // On utilise le format original pour le fallback
        if (format === 'png') {
          return `${src} ${width}w`;
        }
        // Pour WebP, on suppose que les images optimisées existent
        const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        return `${webpSrc} ${width}w`;
      })
      .join(', ');
  };

  const handleError = () => {
    setImageError(true);
  };

  // Si WebP est désactivé ou si erreur, utiliser PNG directement
  if (!useWebP || imageError) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
        onError={handleError}
        {...props}
      />
    );
  }

  // Utiliser picture element pour WebP avec fallback PNG
  return (
    <picture>
      {/* Source WebP pour navigateurs modernes */}
      <source
        type="image/webp"
        srcSet={src.replace(/\.(png|jpg|jpeg)$/i, '.webp')}
        sizes={sizes}
      />
      
      {/* Fallback PNG pour navigateurs anciens */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
        sizes={sizes}
        onError={handleError}
        {...props}
      />
    </picture>
  );
};
