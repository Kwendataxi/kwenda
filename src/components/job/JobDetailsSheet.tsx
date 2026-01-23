import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Clock, Briefcase, Star, Building2, Eye } from 'lucide-react';
import { Job, EMPLOYMENT_TYPE_LABELS } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

interface JobDetailsSheetProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const JobDetailsSheet = ({ job, open, onClose, onApply }: JobDetailsSheetProps) => {
  const { language } = useLanguage();

  if (!job) return null;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return 'À négocier';
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min}-${job.salary_max} ${job.currency}`;
    }
    return `${job.salary_min || job.salary_max} ${job.currency}`;
  };

  const employmentLabel = EMPLOYMENT_TYPE_LABELS[job.employment_type]?.[language] || job.employment_type;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={job.company?.logo_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {job.company?.name?.charAt(0) || 'K'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-xl line-clamp-2">{job.title}</SheetTitle>
                {job.is_featured && (
                  <Badge variant="default" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Star className="h-3 w-3 mr-1 fill-amber-600" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{job.company?.name || 'Entreprise'}</span>
                {job.company?.is_verified && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs">✓ Vérifiée</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatSalary()}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location_city}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {employmentLabel}
            </Badge>
            {job.is_remote && (
              <Badge variant="secondary">🏠 Remote</Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Publié {new Date(job.created_at).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {job.views_count} vues
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <h3 className="font-semibold text-lg mb-2">Description du poste</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Compétences requises</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/5">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {job.company?.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">À propos de l'entreprise</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {job.company.description}
              </p>
            </div>
          )}

          {(job.start_date || job.end_date) && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Dates</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                {job.start_date && (
                  <div>Début : {new Date(job.start_date).toLocaleDateString('fr-FR')}</div>
                )}
                {job.end_date && (
                  <div>Fin : {new Date(job.end_date).toLocaleDateString('fr-FR')}</div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-background border-t mt-6">
          <Button 
            onClick={onApply} 
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            Postuler à cette offre
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
