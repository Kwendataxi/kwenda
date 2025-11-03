import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimationController } from "@/services/AnimationController";

interface PremiumLoadingFallbackProps {
  context?: 'client' | 'driver' | 'vendor' | 'admin' | 'default';
}

export const PremiumLoadingFallback = ({ context = 'default' }: PremiumLoadingFallbackProps) => {
  const animConfig = AnimationController.getRecommendedConfig();
  const isReduced = AnimationController.isReducedMode();

  const getContextMessage = () => {
    switch (context) {
      case 'client':
        return "Chargement de votre espace client...";
      case 'driver':
        return "Chargement de votre espace chauffeur...";
      case 'vendor':
        return "Chargement de votre boutique...";
      case 'admin':
        return "Chargement du tableau de bord...";
      default:
        return "Chargement...";
    }
  };

  const renderContextSkeleton = () => {
    switch (context) {
      case 'client':
        return <ClientSkeleton />;
      case 'driver':
        return <DriverSkeleton />;
      case 'vendor':
        return <VendorSkeleton />;
      case 'admin':
        return <AdminSkeleton />;
      default:
        return <DefaultSkeleton />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
        {/* Logo animé */}
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: animConfig.duration / 1000 }}
        >
          <motion.img
            src="/kwenda-splash-logo.png"
            alt="Kwenda"
            className="w-20 h-20 object-contain"
            animate={!isReduced ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Barre de progression fluide */}
        <div className="space-y-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: ["0%", "70%", "100%"] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <motion.p
            className="text-center text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getContextMessage()}
          </motion.p>
        </div>

        {/* Skeleton contextuel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: animConfig.duration / 1000 }}
        >
          {renderContextSkeleton()}
        </motion.div>
      </div>
    </div>
  );
};

// Skeletons contextuels
const ClientSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-lg" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  </div>
);

const DriverSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-48 w-full rounded-lg" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
    </div>
    <Skeleton className="h-32 w-full rounded-lg" />
  </div>
);

const VendorSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

const AdminSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

const DefaultSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-lg" />
    <Skeleton className="h-24 w-full rounded-lg" />
    <Skeleton className="h-24 w-full rounded-lg" />
  </div>
);
