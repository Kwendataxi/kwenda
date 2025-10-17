import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseImageUploadReturn {
  imagePreviews: string[];
  uploadImages: (files: FileList | null) => void;
  removeImage: (index: number) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

export const useImageUpload = (
  maxImages: number = 5,
  maxSizeMB: number = 5
): UseImageUploadReturn => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const uploadImages = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxImages - imagePreviews.length);
    
    newFiles.forEach(file => {
      // Vérifier la taille
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `Les images doivent faire moins de ${maxSizeMB}MB`,
          variant: "destructive"
        });
        return;
      }

      // Lire et prévisualiser l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return {
    imagePreviews,
    uploadImages,
    removeImage,
    isDragging,
    setIsDragging
  };
};
