import { motion } from 'framer-motion';
import { MapPin, DollarSign, Clock, Briefcase, Star, Heart, ChevronRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ModernJobCardProps {
  job: Job;
  onClick: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  variant?: 'featured' | 'standard';
  index?: number;
}

export const ModernJobCard = ({ 
  job, 
  onClick, 
  onSave, 
  isSaved,
  variant = 'standard',
  index = 0 
}: ModernJobCardProps) => {
  const { language } = useLanguage();

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()} ${job.currency}`;
    }
    return `${(job.salary_min || job.salary_max)?.toLocaleString()} ${job.currency}`;
  };

  const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;
  const isFeatured = variant === 'featured' || job.is_featured;
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr });

  if (isFeatured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 p-4 shadow-sm hover:shadow-md transition-shadow">
          {/* Featured badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
              <Star className="h-3 w-3 mr-1 fill-white" />
              Featured
            </Badge>
          </div>

          <div className="flex gap-4">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-white/50 shadow-md">
              <AvatarImage src={job.job_companies?.logo_url} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-lg rounded-xl">
                {job.job_companies?.name?.charAt(0) || 'K'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-semibold text-lg text-foreground line-clamp-1 mb-1">
                {job.title}
              </h3>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {job.job_companies?.name || 'Entreprise'}
                </span>
                {job.job_companies?.is_verified && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-emerald-500/10 text-emerald-600 border-0">
                    ✓ Vérifié
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {formatSalary() && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatSalary()}
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-white/50 dark:bg-card/50 px-2.5 py-1 rounded-lg">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location_city}
                  {job.is_remote && ' • Remote'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo}
                </div>

                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
                >
                  Postuler
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-3.5 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200">
        <div className="flex gap-3">
          <Avatar className="h-11 w-11 rounded-lg border border-border/50">
            <AvatarImage src={job.job_companies?.logo_url} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground rounded-lg">
              <Building2 className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {job.job_companies?.name || 'Entreprise'}
                  {job.job_companies?.is_verified && ' ✓'}
                </p>
              </div>
              
              {onSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {formatSalary() && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {formatSalary()}
                </span>
              )}
              
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location_city}
              </span>
              
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {employmentLabel}
              </span>
              
              <span className="text-xs text-muted-foreground/60 ml-auto">
                {timeAgo}
              </span>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 self-center group-hover:text-primary/50 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};
