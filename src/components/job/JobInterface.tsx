import { useState } from 'react';
import { JobHeader } from './JobHeader';
import { JobSearchBar } from './JobSearchBar';
import { JobCategoryFilter } from './JobCategoryFilter';
import { JobCard } from './JobCard';
import { JobDetailsSheet } from './JobDetailsSheet';
import { JobApplyForm } from './JobApplyForm';
import { MyApplicationsScreen } from './MyApplicationsScreen';
import { useJobs, useJobDetails, useJobActions, useJobApplications } from '@/hooks/useJobs';
import { Job } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface JobInterfaceProps {
  onBack: () => void;
}

export const JobInterface = ({ onBack }: JobInterfaceProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState('');
  const [view, setView] = useState<'list' | 'applications'>('list');
  
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { jobs, loading } = useJobs({
    category: selectedCategory,
    search: searchQuery,
    location: location || undefined
  });

  const { job: selectedJob, loading: jobLoading } = useJobDetails(selectedJobId);
  const { applications, loading: appsLoading } = useJobApplications();
  const { applyToJob, saveJob, applying } = useJobActions();

  const handleJobClick = (job: Job) => {
    setSelectedJobId(job.id);
    setShowDetails(true);
  };

  const handleApply = () => {
    setShowDetails(false);
    setShowApplyForm(true);
  };

  const handleSubmitApplication = async (data: { resume_url?: string; cover_letter?: string }) => {
    if (!selectedJobId) return false;
    return await applyToJob(selectedJobId, data);
  };

  const handleSaveJob = async (jobId: string) => {
    await saveJob(jobId);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <JobHeader 
        onBack={onBack}
        savedCount={0}
        notificationCount={applications.filter(a => a.status === 'interview').length}
      />

      {view === 'list' ? (
        <>
          <JobSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            location={location}
            onLocationChange={setLocation}
          />

          <JobCategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <div className="flex-1 overflow-y-auto pb-20">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-64 text-center px-4"
              >
                <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune offre trouvée</h3>
                <p className="text-sm text-muted-foreground">
                  Essayez de modifier vos filtres de recherche
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1 pt-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => handleJobClick(job)}
                    onSave={() => handleSaveJob(job.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <MyApplicationsScreen
            applications={applications}
            loading={appsLoading}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-2">
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          onClick={() => setView('list')}
          className="flex-1 gap-2"
        >
          <Briefcase className="h-4 w-4" />
          Offres
        </Button>
        <Button
          variant={view === 'applications' ? 'default' : 'outline'}
          onClick={() => setView('applications')}
          className="flex-1 gap-2 relative"
        >
          <FileText className="h-4 w-4" />
          Mes candidatures
          {applications.filter(a => a.status === 'interview').length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
              {applications.filter(a => a.status === 'interview').length}
            </span>
          )}
        </Button>
      </div>

      <JobDetailsSheet
        job={selectedJob}
        open={showDetails}
        onClose={() => setShowDetails(false)}
        onApply={handleApply}
      />

      <JobApplyForm
        jobTitle={selectedJob?.title || ''}
        open={showApplyForm}
        onClose={() => setShowApplyForm(false)}
        onSubmit={handleSubmitApplication}
        loading={applying}
      />
    </div>
  );
};
