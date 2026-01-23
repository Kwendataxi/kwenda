import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { FileText, IdCard, Calendar, Upload } from 'lucide-react';

interface LicenseStepProps {
  formData: {
    licenseNumber: string;
    licenseExpiry: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export const LicenseStep: React.FC<LicenseStepProps> = ({
  formData,
  onFieldChange
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
          <FileText className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <IdCard className="w-4 h-4" />
            Numéro de Permis *
          </Label>
          <Input
            value={formData.licenseNumber}
            onChange={(e) => onFieldChange('licenseNumber', e.target.value)}
            placeholder="ABC123456"
            className="h-12 rounded-xl"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date d'Expiration
          </Label>
          <Input
            type="date"
            value={formData.licenseExpiry}
            onChange={(e) => onFieldChange('licenseExpiry', e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
      </div>
      
      {/* Upload Permis (Optionnel) */}
      <div className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-amber-500 transition-colors cursor-pointer">
        <div className="text-center space-y-2">
          <Upload className="w-8 h-8 mx-auto text-zinc-400" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Télécharger une photo de votre permis (Optionnel)
          </p>
          <p className="text-xs text-zinc-500">
            Formats acceptés: JPG, PNG (max 5MB)
          </p>
        </div>
      </div>
    </motion.div>
  );
};
