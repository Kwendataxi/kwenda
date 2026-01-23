import { UserProfile } from './UserProfile';

interface ResponsiveUserProfileProps {
  userType?: 'client' | 'driver' | 'partner';
  onWalletAccess?: () => void;
  onViewChange?: (view: string) => void;
  onClose?: () => void;
}

export const ResponsiveUserProfile = ({ 
  userType = 'client', 
  onWalletAccess,
  onViewChange,
  onClose 
}: ResponsiveUserProfileProps) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        <UserProfile 
          onWalletAccess={onWalletAccess}
          onViewChange={onViewChange}
          onClose={onClose}
        />
      </div>
    </div>
  );
};