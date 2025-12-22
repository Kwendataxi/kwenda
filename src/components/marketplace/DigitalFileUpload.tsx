import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileCode, Upload, X, FileText, Music, Video, FileArchive, Image, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DigitalFileUploadProps {
  onFileUploaded: (fileData: {
    url: string;
    name: string;
    size: number;
    type: string;
  }) => void;
  downloadLimit: number;
  onDownloadLimitChange: (limit: number) => void;
  currentFile?: {
    url: string;
    name: string;
    size: number;
    type: string;
  } | null;
}

const ACCEPTED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', color: 'text-red-500' },
  'application/zip': { icon: FileArchive, label: 'ZIP', color: 'text-yellow-500' },
  'application/x-zip-compressed': { icon: FileArchive, label: 'ZIP', color: 'text-yellow-500' },
  'audio/mpeg': { icon: Music, label: 'MP3', color: 'text-purple-500' },
  'audio/mp3': { icon: Music, label: 'MP3', color: 'text-purple-500' },
  'video/mp4': { icon: Video, label: 'MP4', color: 'text-blue-500' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'DOCX', color: 'text-blue-600' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'XLSX', color: 'text-green-600' },
  'image/png': { icon: Image, label: 'PNG', color: 'text-pink-500' },
  'image/jpeg': { icon: Image, label: 'JPG', color: 'text-orange-500' },
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const DigitalFileUpload: React.FC<DigitalFileUploadProps> = ({
  onFileUploaded,
  downloadLimit,
  onDownloadLimitChange,
  currentFile
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<typeof currentFile>(currentFile);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeInfo = (mimeType: string) => {
    return ACCEPTED_TYPES[mimeType as keyof typeof ACCEPTED_TYPES] || { 
      icon: FileCode, 
      label: 'Fichier', 
      color: 'text-muted-foreground' 
    };
  };

  const handleUpload = useCallback(async (file: File) => {
    // Validation type
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Type de fichier non supporté',
        description: 'Formats acceptés : PDF, ZIP, MP3, MP4, DOCX, XLSX, PNG, JPG'
      });
      return;
    }

    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Fichier trop volumineux',
        description: 'La taille maximum est de 100 MB'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Générer un nom unique
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('digital-products')
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      setUploadProgress(100);

      const fileData = {
        url: data.path,
        name: file.name,
        size: file.size,
        type: file.type
      };

      setUploadedFile(fileData);
      onFileUploaded(fileData);

      toast({
        title: 'Fichier téléchargé ✓',
        description: `${file.name} est prêt pour la vente`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible de télécharger le fichier'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onFileUploaded, toast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset l'input pour permettre de re-sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleUpload]);

  const removeFile = async () => {
    if (uploadedFile?.url) {
      try {
        await supabase.storage.from('digital-products').remove([uploadedFile.url]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    setUploadedFile(null);
    onFileUploaded({ url: '', name: '', size: 0, type: '' });
  };

  return (
    <div className="space-y-4">
      {/* Input file TOUJOURS présent et accessible (en dehors de AnimatePresence) */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.zip,.mp3,.mp4,.docx,.xlsx,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
      />

      {/* Zone d'upload */}
      <Card className={cn(
        "border-2 border-dashed transition-all",
        isDragging 
          ? "border-purple-500 bg-purple-500/5" 
          : "border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
      )}>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {uploadedFile?.url ? (
              // Fichier uploadé
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4"
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
                )}>
                  {(() => {
                    const { icon: Icon, color } = getFileTypeInfo(uploadedFile.type);
                    return <Icon className={cn("h-7 w-7", color)} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium truncate">{uploadedFile.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadedFile.size)} • {getFileTypeInfo(uploadedFile.type).label}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : isUploading ? (
              // Upload en cours
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                </div>
                <div>
                  <p className="font-medium">Upload en cours...</p>
                  <Progress value={uploadProgress} className="mt-2 h-2" />
                  <p className="text-sm text-muted-foreground mt-1">{uploadProgress}%</p>
                </div>
              </motion.div>
            ) : (
              // Zone de drop
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.stopPropagation(); setIsDragging(false); }}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <FileCode className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Téléchargez votre fichier digital</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez-déposez ou cliquez pour sélectionner
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {['PDF', 'ZIP', 'MP3', 'MP4', 'DOCX', 'XLSX'].map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  className="gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerFileSelect();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Sélectionner le fichier
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Maximum 100 MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Limite de téléchargements */}
      <div className="space-y-2">
        <Label htmlFor="download-limit">Nombre de téléchargements autorisés</Label>
        <div className="flex items-center gap-3">
          <Input
            id="download-limit"
            type="number"
            min={1}
            max={100}
            value={downloadLimit}
            onChange={(e) => onDownloadLimitChange(Math.max(1, Math.min(100, parseInt(e.target.value) || 5)))}
            className="w-24 text-center"
          />
          <span className="text-sm text-muted-foreground">
            téléchargements par achat
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Les acheteurs pourront télécharger le fichier jusqu'à {downloadLimit} fois après l'achat
        </p>
      </div>
    </div>
  );
};
