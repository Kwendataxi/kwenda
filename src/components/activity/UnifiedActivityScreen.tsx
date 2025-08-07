import { useState } from 'react';
import { useUnifiedActivity, UnifiedActivityItem } from '@/hooks/useUnifiedActivity';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityListItem } from './ActivityListItem';
import { ActivityDetailsSheet } from './ActivityDetailsSheet';
import { ArrowLeft } from 'lucide-react';

interface UnifiedActivityScreenProps {
  onBack?: () => void;
}

export const UnifiedActivityScreen = ({ onBack }: UnifiedActivityScreenProps) => {
  const { activities, loading, error, refresh } = useUnifiedActivity();
  const [filter, setFilter] = useState<'all' | 'delivery' | 'marketplace' | 'payment'>('all');
  const [selected, setSelected] = useState<UnifiedActivityItem | null>(null);

  const filtered = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'delivery') return a.type === 'delivery';
    if (filter === 'marketplace') return a.type === 'marketplace_purchase' || a.type === 'marketplace_sale';
    if (filter === 'payment') return a.type === 'payment';
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Activité</h1>
          <div className="ml-auto">
            <Button variant="secondary" size="sm" onClick={refresh}>Rafraîchir</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'delivery', label: 'Livraisons' },
            { key: 'marketplace', label: 'Marketplace' },
            { key: 'payment', label: 'Paiements' },
          ].map(chip => (
            <Button
              key={chip.key}
              variant={filter === chip.key ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter(chip.key as any)}
              className="rounded-full"
            >
              {chip.label}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-10">Aucune activité pour le moment.</div>
        )}

        <div className="space-y-3">
          {filtered.map(item => (
            <ActivityListItem key={`${item.type}-${item.id}`} item={item} onClick={setSelected} />)
          )}
        </div>
      </div>

      <ActivityDetailsSheet open={!!selected} item={selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
};
