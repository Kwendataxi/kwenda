import React from "react";
import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";

interface PartnerHeaderProps {
  title?: string;
  subtitle?: string;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({ 
  title = "Tableau de bord", 
  subtitle = "Kwenda Taxi Partner" 
}) => {
  const { signOut, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo & Branding */}
        <div className="flex items-center gap-4">
          <BrandLogo size={40} className="rounded-xl" />
          <div className="hidden md:block">
            <h1 className="text-heading-md font-bold text-foreground">{title}</h1>
            <p className="text-body-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative rounded-xl">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl gap-2">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline text-body-sm">
                  {user?.email?.split('@')[0] || 'Partenaire'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem className="rounded-lg">
                <User className="mr-2 h-4 w-4" />
                <span>Profil partenaire</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="rounded-lg text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default PartnerHeader;