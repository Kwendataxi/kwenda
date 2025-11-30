import { Link } from 'react-router-dom';

export const LegalFooterLinks = () => {
  return (
    <div className="flex justify-center items-center gap-3 py-4 text-xs text-muted-foreground border-t">
      <Link 
        to="/terms" 
        className="hover:text-primary hover:underline transition-colors"
      >
        Conditions d'utilisation
      </Link>
      <span className="text-muted-foreground/50">•</span>
      <Link 
        to="/privacy" 
        className="hover:text-primary hover:underline transition-colors"
      >
        Politique de confidentialité
      </Link>
    </div>
  );
};
