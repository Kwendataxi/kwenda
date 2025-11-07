/**
 * 📄 Section documents réutilisable
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface Document {
  type: string;
  label: string;
  verified: boolean;
}

interface DocumentsSectionProps {
  documents: Document[];
  serviceType: 'taxi' | 'delivery';
}

export const DocumentsSection = ({ documents, serviceType }: DocumentsSectionProps) => {
  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className={`w-5 h-5 text-${serviceColor}-500`} />
          <h3 className="font-semibold text-foreground">Documents</h3>
        </div>
        
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {doc.verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                <div>
                  <p className="font-medium text-foreground">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.verified ? 'Vérifié' : 'En attente de vérification'}
                  </p>
                </div>
              </div>
              
              {!doc.verified && (
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
