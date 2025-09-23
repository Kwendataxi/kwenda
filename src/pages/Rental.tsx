import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const RentalPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Kwenda Location
              </h1>
              <p className="text-sm text-muted-foreground">Location de véhicules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Service de Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Service en développement</h3>
              <p className="text-muted-foreground">
                Le service de location de véhicules sera bientôt disponible.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RentalPage;