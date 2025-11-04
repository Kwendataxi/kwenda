import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Mail, Calendar, CheckCircle2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

interface VendorShopInfoCardProps {
  shopName: string;
  description: string;
  email: string;
  totalSales: number;
  rating: number;
  memberSince: string;
  status: 'active' | 'inactive';
  onEditClick: () => void;
}

export const VendorShopInfoCard: React.FC<VendorShopInfoCardProps> = ({
  shopName,
  description,
  email,
  totalSales,
  rating,
  memberSince,
  status,
  onEditClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {shopName}
                  {status === 'active' && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Actif
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {description || "Aucune description"}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onEditClick}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email de contact
              </p>
              <p className="font-medium text-sm truncate">{email}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Store className="h-4 w-4" />
                Ventes totales
              </p>
              <p className="font-medium">{totalSales} commandes</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Note moyenne</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{rating.toFixed(1)}</span>
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membre depuis
              </p>
              <p className="font-medium text-sm">{memberSince}</p>
            </div>
          </div>
          
          {/* Status Badge Large */}
          <div className="pt-3 border-t">
            <Badge 
              variant={status === 'active' ? 'default' : 'secondary'}
              className="w-full justify-center py-2"
            >
              Statut: {status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
