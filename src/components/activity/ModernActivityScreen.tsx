import React, { useEffect, useState, useRef } from 'react';
import { useUnifiedActivityRobust, UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Wifi, WifiOff, TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { ModernActivityItem } from './ModernActivityItem';
import { ActivityDetailsSheet } from './ActivityDetailsSheet';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernActivityScreenProps {
  onBack?: () => void;
}

export const ModernActivityScreen = ({ onBack }: ModernActivityScreenProps) => {
  const { activities, loading, error, refresh, retryCount, stats, isFromCache } = useUnifiedActivityRobust();
  const [filter, setFilter] = useState<'all' | 'transport' | 'delivery' | 'marketplace' | 'payment' | 'wallet_transfer'>('all');
  const [selected, setSelected] = useState<UnifiedActivityItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'transport') return a.type === 'transport';
    if (filter === 'delivery') return a.type === 'delivery';
    if (filter === 'marketplace') return a.type === 'marketplace_purchase' || a.type === 'marketplace_sale';
    if (filter === 'payment') return a.type === 'payment';
    if (filter === 'wallet_transfer') return a.type === 'wallet_transfer';
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    // Petit délai pour l'animation
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount(prev => Math.min(prev + 20, filtered.length));
    }
  };

  // Pull to refresh pour mobile
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    setVisibleCount(20);
  }, [filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header avec design moderne */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted border-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Activité
                </h1>
                <p className="text-xs text-muted-foreground">
                  {activities.length} activités • {stats.completed} terminées
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Indicateur de connexion */}
              <div className="flex items-center gap-1">
                {isFromCache ? (
                  <WifiOff className="h-4 w-4 text-orange-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                )}
              </div>

              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <motion.div 
              className="text-center p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-semibold text-emerald-600">{stats.total}</div>
              <div className="text-xs text-emerald-600/70">Total</div>
            </motion.div>
            <motion.div 
              className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-semibold text-blue-600">{stats.completed}</div>
              <div className="text-xs text-blue-600/70">Finis</div>
            </motion.div>
            <motion.div 
              className="text-center p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-semibold text-orange-600">{stats.pending}</div>
              <div className="text-xs text-orange-600/70">En cours</div>
            </motion.div>
            <motion.div 
              className="text-center p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-xs font-semibold text-primary">
                {(stats.totalAmount / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-primary/70">CDF</div>
            </motion.div>
          </div>

          {/* Filtres avec design amélioré */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'Tous', icon: TrendingUp },
              { key: 'transport', label: 'Transport', icon: Clock },
              { key: 'delivery', label: 'Livraisons', icon: CheckCircle2 },
              { key: 'marketplace', label: 'Marketplace', icon: AlertCircle },
              { key: 'wallet_transfer', label: 'Transferts', icon: ArrowLeftRight },
              { key: 'payment', label: 'Paiements', icon: Clock },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setFilter(key as any)}
                className={`
                  rounded-full flex-shrink-0 transition-all duration-200
                  ${filter === key 
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted border border-border/50'
                  }
                `}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* États d'erreur avec design amélioré et distinction des types */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4"
          >
            <Card className={`border ${
              error.includes('permission') || error.includes('policy') 
                ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100/50'
                : error.includes('cache')
                  ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/50'
                  : 'border-red-200 bg-gradient-to-r from-red-50 to-red-100/50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    error.includes('permission') || error.includes('policy')
                      ? 'bg-yellow-100'
                      : error.includes('cache')
                        ? 'bg-orange-100'
                        : 'bg-red-100'
                  }`}>
                    <AlertCircle className={`h-4 w-4 ${
                      error.includes('permission') || error.includes('policy')
                        ? 'text-yellow-600'
                        : error.includes('cache')
                          ? 'text-orange-600'
                          : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      error.includes('permission') || error.includes('policy')
                        ? 'text-yellow-800'
                        : error.includes('cache')
                          ? 'text-orange-800'
                          : 'text-red-800'
                    }`}>
                      {error.includes('permission') || error.includes('policy')
                        ? 'Problème de permissions' 
                        : error.includes('cache')
                          ? 'Données en cache'
                          : 'Problème de connexion'}
                    </h3>
                    <p className={`text-sm ${
                      error.includes('permission') || error.includes('policy')
                        ? 'text-yellow-600'
                        : error.includes('cache')
                          ? 'text-orange-600'
                          : 'text-red-600'
                    }`}>
                      {error}
                    </p>
                    {(error.includes('permission') || error.includes('policy')) && (
                      <p className="text-xs text-yellow-500 mt-1">
                        Contactez le support si le problème persiste
                      </p>
                    )}
                    {retryCount > 0 && !(error.includes('permission') || error.includes('policy')) && (
                      <p className={`text-xs mt-1 ${
                        error.includes('cache') ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        Tentative {retryCount}/3 • Retry automatique...
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={error.includes('permission') || error.includes('policy')}
                    className={`${
                      error.includes('permission') || error.includes('policy')
                        ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50 opacity-50 cursor-not-allowed'
                        : error.includes('cache')
                          ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {error.includes('permission') || error.includes('policy') ? 'Support' : 'Réessayer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeletons modernes */}
      {loading && activities.length === 0 && (
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-muted to-muted/50 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded animate-pulse" />
                    <div className="h-3 bg-gradient-to-r from-muted/70 to-muted/30 rounded w-2/3 animate-pulse" />
                  </div>
                  <div className="w-16 h-6 bg-gradient-to-r from-muted to-muted/50 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Liste des activités avec infinite scroll */}
      {!loading || activities.length > 0 ? (
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 pb-20"
          style={{ 
            height: 'calc(100vh - 200px)',
            transform: `translateY(${Math.min(pullDistance * 0.5, 50)}px)`
          }}
        >
          <AnimatePresence>
            {filtered.length === 0 && !loading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Aucune activité
                </h3>
                <p className="text-sm text-muted-foreground/70">
                  Vos transactions apparaîtront ici
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, visibleCount).map((item, index) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ModernActivityItem 
                      item={item} 
                      onClick={setSelected}
                    />
                  </motion.div>
                ))}
                
                {visibleCount < filtered.length && (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground mt-2">Chargement...</p>
                  </div>
                )}
                
                {filtered.length > 0 && visibleCount >= filtered.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Toutes les activités affichées
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Cache indicator - masqué */}

      {/* Sheet de détails */}
      <ActivityDetailsSheet 
        open={!!selected} 
        item={selected} 
        onOpenChange={(v) => !v && setSelected(null)} 
      />
    </div>
  );
};