import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernJobHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  jobCount: number;
}

const quickLocations = [
  { id: 'kinshasa', label: 'Kinshasa' },
  { id: 'lubumbashi', label: 'Lubumbashi' },
  { id: 'remote', label: '🌐 Remote' },
];

export const ModernJobHero = ({
  searchQuery,
  onSearchChange,
  location,
  onLocationChange,
  jobCount,
}: ModernJobHeroProps) => {
  const { t } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />

      <div className="relative px-4 pt-4 pb-5">
        {/* Job count with animation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <motion.span 
              key={jobCount}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              {jobCount} offres disponibles
            </motion.span>
          </div>
        </motion.div>

        {/* Unified search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`
            relative bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl 
            border-2 transition-all duration-300
            ${isFocused 
              ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
              : 'border-border/50 shadow-sm'
            }
          `}
        >
          <div className="flex items-center gap-2 p-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Rechercher un emploi..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto text-base placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Ville"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto w-24 text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </motion.div>

        {/* Quick location presets */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide"
        >
          <span className="text-xs text-muted-foreground shrink-0">Rapide:</span>
          {quickLocations.map((loc) => (
            <Button
              key={loc.id}
              variant="ghost"
              size="sm"
              onClick={() => onLocationChange(loc.id === 'remote' ? '' : loc.label)}
              className={`
                h-7 px-3 text-xs rounded-full shrink-0 transition-all
                ${location.toLowerCase() === loc.label.toLowerCase() || (loc.id === 'remote' && location === '')
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-muted/50 hover:bg-muted'
                }
              `}
            >
              {loc.label}
            </Button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
