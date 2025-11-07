/**
 * 📄 Section documents réutilisable - Maintenant fonctionnelle
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDriverDocuments } from '@/hooks/useDriverDocuments';

interface DocumentsSectionProps {
  serviceType: 'taxi' | 'delivery';
}

export const DocumentsSection = ({ serviceType }: DocumentsSectionProps) => {
  const { documents, completionRate } = useDriverDocuments();
  const serviceColor = serviceType === 'taxi' ? 'orange' : 'blue';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { label: 'Validé', variant: 'default' as const },
      pending: { label: 'En attente', variant: 'secondary' as const },
      rejected: { label: 'Rejeté', variant: 'destructive' as const },
      expired: { label: 'Expiré', variant: 'destructive' as const }
    };

    const { label, variant } = config[status as keyof typeof config] || 
      { label: 'Non fourni', variant: 'outline' as const };

    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 text-${serviceColor}-500`} />
            <h3 className="font-semibold text-foreground">Documents</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {completionRate}% complet
          </Badge>
        </div>
        
        <div className="space-y-3">
          {documents.slice(0, 4).map((doc, index) => (
            <div 
              key={doc.type}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(doc.status)}
                <div>
                  <p className="font-medium text-foreground text-sm">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.expires_at 
                      ? `Expire le ${new Date(doc.expires_at).toLocaleDateString('fr-FR')}`
                      : doc.status === 'approved' ? 'Vérifié' : 'En attente'
                    }
                  </p>
                </div>
              </div>
              
              {getStatusBadge(doc.status)}
            </div>
          ))}
        </div>

        {documents.length > 4 && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            +{documents.length - 4} autres documents
          </p>
        )}
      </Card>
    </motion.div>
  );
};
