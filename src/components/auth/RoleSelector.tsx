import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, User, Building, Package } from 'lucide-react';
import { UserRole } from '@/types/roles';

interface RoleSelectorProps {
  availableRoles: UserRole[];
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole | null;
}

const roleConfig = {
  client: {
    name: 'Client',
    description: 'Réserver des courses et commander des livraisons',
    icon: User,
    color: 'bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
  },
  driver: {
    name: 'Chauffeur / Livreur',
    description: 'Transport de passagers et livraison de colis',
    icon: Car,
    color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40'
  },
  partner: {
    name: 'Partenaire',
    description: 'Gérer une flotte de véhicules et chauffeurs',
    icon: Building,
    color: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/40'
  },
  admin: {
    name: 'Administrateur',
    description: 'Gérer la plateforme Kwenda',
    icon: Package,
    color: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40'
  }
};

export const RoleSelector = ({ availableRoles, onRoleSelect, selectedRole }: RoleSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {availableRoles.map((role) => {
        const config = roleConfig[role];
        const Icon = config.icon;
        const isSelected = selectedRole === role;
        
        return (
          <Card
            key={role}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'ring-2 ring-primary dark:ring-primary/80 shadow-lg dark:shadow-primary/20'
                : 'hover:shadow-md dark:hover:shadow-lg'
            } ${config.color}`}
            onClick={() => onRoleSelect(role)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center backdrop-blur-sm">
                <Icon className="h-8 w-8 text-primary dark:text-primary" />
              </div>
              <CardTitle className="text-xl text-foreground">{config.name}</CardTitle>
              <CardDescription className="text-center text-muted-foreground dark:text-gray-300">
                {config.description}
              </CardDescription>
            </CardHeader>
            {isSelected && (
              <CardContent className="text-center pb-4">
                <Button size="sm" variant="outline" className="pointer-events-none">
                  ✓ Sélectionné
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
