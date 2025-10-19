import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const VendorDocuments = () => {
  const { toast } = useToast();

  const documents = [
    {
      id: 1,
      name: "Registre de commerce",
      type: "RCCM",
      status: "verified",
      uploadedAt: "2024-01-15",
      expiresAt: null
    },
    {
      id: 2,
      name: "Numéro d'identification fiscale",
      type: "NIF",
      status: "pending",
      uploadedAt: "2024-03-20",
      expiresAt: null
    },
    {
      id: 3,
      name: "Certificat d'assurance",
      type: "Insurance",
      status: "expired",
      uploadedAt: "2023-06-10",
      expiresAt: "2024-06-10"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Vérifié</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expiré</Badge>;
      default:
        return <Badge variant="outline">Non fourni</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Documents Légaux</h2>
        <p className="text-muted-foreground">
          Gérez vos documents d'entreprise et certifications
        </p>
      </div>

      <div className="grid gap-4">
        {documents.map(doc => (
          <Card key={doc.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">{doc.type}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Ajouté le {doc.uploadedAt}</span>
                    {doc.expiresAt && <span>Expire le {doc.expiresAt}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(doc.status)}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({ title: "Téléchargement du document..." })}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-dashed">
        <div className="text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Ajouter un document</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Téléchargez vos documents légaux pour vérification
          </p>
          <Button onClick={() => toast({ title: "Fonctionnalité à venir" })}>
            <Upload className="h-4 w-4 mr-2" />
            Télécharger un document
          </Button>
        </div>
      </Card>
    </div>
  );
};
