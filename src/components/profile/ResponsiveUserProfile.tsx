import { UserProfile } from './UserProfile';

interface ResponsiveUserProfileProps {
  userType?: 'client' | 'driver' | 'partner';
}

export const ResponsiveUserProfile = ({ userType = 'client' }: ResponsiveUserProfileProps) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        <UserProfile />
      </div>
    </div>
  );
};