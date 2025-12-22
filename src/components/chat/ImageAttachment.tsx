import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface ImageAttachmentProps {
  onImageSelect: (url: string, file: File) => void;
  onImageClear: () => void;
  selectedImage: string | null;
  disabled?: boolean;
}

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  onImageSelect,
  onImageClear,
  selectedImage,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse (max 10 Mo)');
      return;
    }

    setIsUploading(true);

    try {
      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      });

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile);
      onImageSelect(previewUrl, compressedFile as File);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={cn(
          "h-11 w-11 rounded-xl border-2 hover:bg-primary/10 hover:border-primary transition-all",
          selectedImage && "border-primary bg-primary/10"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Preview badge */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1"
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={onImageClear}
              className="h-5 w-5 rounded-full p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ImagePreviewProps {
  imageUrl: string;
  onClose: () => void;
  isOpen: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  onClose,
  isOpen
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur">
        <img 
          src={imageUrl} 
          alt="Preview" 
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
};

interface ImageMessageProps {
  imageUrl: string;
  className?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  imageUrl,
  className
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <motion.img
        src={imageUrl}
        alt="Image partagée"
        className={cn(
          "max-w-[200px] max-h-[200px] rounded-lg cursor-pointer object-cover",
          "hover:opacity-90 transition-opacity",
          className
        )}
        onClick={() => setIsPreviewOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      />
      <ImagePreview
        imageUrl={imageUrl}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

// Upload image to Supabase Storage
export const uploadChatImage = async (
  file: File,
  conversationId: string,
  userId: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${conversationId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }

  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};
