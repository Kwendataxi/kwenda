import { motion } from 'framer-motion';
import { MapPin, DollarSign, Clock, Briefcase, Star, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface JobCardProps {
  job: Job;
  onClick: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export const JobCard = ({ job, onClick, onSave, isSaved }: JobCardProps) => {
  const { language } = useLanguage();

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min}-${job.salary_max} ${job.currency}`;
    }
    return `${job.salary_min || job.salary_max} ${job.currency}`;
  };

  const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="px-4 mb-3"
    >
      <Card 
        className="p-4 hover:shadow-lg transition-all cursor-pointer border-border/50 bg-card"
        onClick={onClick}
      >
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={job.company?.logo_url} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {job.company?.name?.charAt(0) || 'K'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {job.title}
              </h3>
              {job.is_featured && (
                <Badge variant="default" className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex-shrink-0">
                  <Star className="h-3 w-3 mr-1 fill-amber-600" />
                  Featured
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <span className="line-clamp-1">{job.company?.name || 'Entreprise'}</span>
              {job.company?.is_verified && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">✓</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {formatSalary() && (
                <div className="flex items-center gap-1 text-xs text-foreground bg-primary/5 px-2 py-1 rounded-md">
                  <DollarSign className="h-3 w-3" />
                  {formatSalary()}
                </div>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <MapPin className="h-3 w-3" />
                {job.location_city}
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Briefcase className="h-3 w-3" />
                {employmentLabel}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>

              <div className="flex gap-2">
                {onSave && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave();
                    }}
                    className="h-8 px-3"
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="h-8 px-4"
                >
                  Voir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
