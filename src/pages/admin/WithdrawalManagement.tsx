/**
 * 💰 Page Admin - Gestion des Demandes de Retrait avec Approbation en Lot
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, CheckCircle, XCircle, Clock, Banknote, 
  Phone, User, Calendar, AlertTriangle, RefreshCw,
  CheckCheck, Filter, Zap, TrendingUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_type: string;
  amount: number;
  currency: string;
  withdrawal_method: string;
  mobile_money_provider: string | null;
  mobile_money_phone: string | null;
  kwenda_pay_phone: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  failure_reason: string | null;
  auto_approved?: boolean | null;
}

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
  processing: { label: 'En cours', color: 'bg-blue-500', icon: Loader2 }
};

const userTypeLabels: Record<string, string> = {
  client: '👤 Client',
  driver: '🚗 Chauffeur',
  vendor: '🏪 Marchand',
  partner: '🤝 Partenaire'
};

export const WithdrawalManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'batch' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Sélection multiple pour approbation en lot
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  
  // Filtres
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>('');

  // Charger les demandes de retrait
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['withdrawal-requests', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WithdrawalRequest[];
    }
  });

  // Appliquer les filtres
  const filteredRequests = requests.filter(r => {
    if (filterProvider !== 'all' && r.mobile_money_provider !== filterProvider) return false;
    if (filterUserType !== 'all' && r.user_type !== filterUserType) return false;
    if (maxAmountFilter && r.amount > parseInt(maxAmountFilter)) return false;
    return true;
  });

  // Mutation pour approuver
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: { action: 'approve_withdrawal', withdrawalId: requestId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur');
      return data;
    },
    onSuccess: () => {
      toast({ title: "Retrait approuvé", description: "Le paiement a été envoyé" });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      setSelectedRequest(null);
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Mutation pour rejeter
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: { action: 'reject_withdrawal', withdrawalId: requestId, rejectionReason: reason }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur');
      return data;
    },
    onSuccess: () => {
      toast({ title: "Retrait rejeté", description: "Le montant a été remboursé au wallet" });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      setSelectedRequest(null);
      setConfirmAction(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Mutation pour approbation en lot
  const batchApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: { action: 'batch_approve_withdrawals', withdrawalIds: ids }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erreur');
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Approbation en lot terminée", 
        description: data.message 
      });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      setSelectedIds(new Set());
      setShowBatchConfirm(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const handleAction = (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setConfirmAction(action);
  };

  const confirmHandler = () => {
    if (!selectedRequest) return;
    
    if (confirmAction === 'approve') {
      approveMutation.mutate(selectedRequest.id);
    } else if (confirmAction === 'reject') {
      rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectionReason });
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const pendingIds = filteredRequests
      .filter(r => r.status === 'pending')
      .map(r => r.id);
    setSelectedIds(new Set(pendingIds));
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    setShowBatchConfirm(true);
  };

  const confirmBatchApprove = () => {
    batchApproveMutation.mutate(Array.from(selectedIds));
  };

  // Quick batch actions
  const selectUnder = (maxAmount: number) => {
    const ids = filteredRequests
      .filter(r => r.status === 'pending' && r.amount <= maxAmount)
      .map(r => r.id);
    setSelectedIds(new Set(ids));
  };

  // Stats
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const totalPending = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);
  const autoApprovedToday = requests
    .filter(r => r.auto_approved && r.status === 'approved')
    .length;

  const selectedTotal = filteredRequests
    .filter(r => selectedIds.has(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            Gestion des Retraits
          </h2>
          <p className="text-muted-foreground">
            Approuvez ou rejetez les demandes de retrait
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approuvés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejetés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{autoApprovedToday}</p>
              <p className="text-sm text-muted-foreground">Auto-approuvés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPending.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">CDF en attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions Bar */}
      {activeTab === 'pending' && pendingCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CheckCheck className="w-5 h-5 text-primary" />
                <span className="font-medium">Approbation en lot</span>
                {selectedIds.size > 0 && (
                  <Badge variant="secondary">
                    {selectedIds.size} sélectionné(s) • {selectedTotal.toLocaleString()} CDF
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => selectUnder(50000)}>
                  ≤ 50k CDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectUnder(100000)}>
                  ≤ 100k CDF
                </Button>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Désélectionner
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleBatchApprove}
                  disabled={selectedIds.size === 0 || batchApproveMutation.isPending}
                >
                  {batchApproveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4 mr-2" />
                  )}
                  Approuver ({selectedIds.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterUserType} onValueChange={setFilterUserType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="driver">Chauffeurs</SelectItem>
                <SelectItem value="vendor">Marchands</SelectItem>
                <SelectItem value="partner">Partenaires</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="airtel">Airtel Money</SelectItem>
                <SelectItem value="orange">Orange Money</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Montant max (CDF)" 
              className="w-40"
              type="number"
              value={maxAmountFilter}
              onChange={(e) => setMaxAmountFilter(e.target.value)}
            />
            {(filterProvider !== 'all' || filterUserType !== 'all' || maxAmountFilter) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterProvider('all');
                  setFilterUserType('all');
                  setMaxAmountFilter('');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="w-4 h-4" />
            En attente ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex gap-2">
            <CheckCircle className="w-4 h-4" />
            Approuvés
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex gap-2">
            <XCircle className="w-4 h-4" />
            Rejetés
          </TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune demande de retrait</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredRequests.map((request, index) => {
                  const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isSelected = selectedIds.has(request.id);

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "hover:shadow-md transition-all",
                        isSelected && "ring-2 ring-primary"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            {/* Checkbox pour sélection */}
                            {request.status === 'pending' && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(request.id)}
                                className="mt-1"
                              />
                            )}

                            <div className="flex-1 space-y-3">
                              {/* Header */}
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn(config.color, "text-white")}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {userTypeLabels[request.user_type] || request.user_type}
                                </span>
                                {request.auto_approved && (
                                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Auto
                                  </Badge>
                                )}
                              </div>

                              {/* Amount */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                  {request.amount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">{request.currency}</span>
                              </div>

                              {/* Details */}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {request.mobile_money_phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Banknote className="w-4 h-4" />
                                  {request.mobile_money_provider || request.withdrawal_method}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDistanceToNow(new Date(request.created_at), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })}
                                </div>
                              </div>

                              {/* Rejection reason */}
                              {request.failure_reason && (
                                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                                  <span>{request.failure_reason}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleAction(request, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rejeter
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAction(request, 'approve')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approuver
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Single Confirmation Dialog */}
      <AlertDialog open={!!confirmAction && confirmAction !== 'batch'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' ? 'Approuver le retrait ?' : 'Rejeter le retrait ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'approve' ? (
                <>
                  Vous allez approuver un retrait de{' '}
                  <strong>{selectedRequest?.amount.toLocaleString()} {selectedRequest?.currency}</strong>{' '}
                  vers {selectedRequest?.mobile_money_phone}.
                </>
              ) : (
                <div className="space-y-4">
                  <p>
                    Le montant de{' '}
                    <strong>{selectedRequest?.amount.toLocaleString()} {selectedRequest?.currency}</strong>{' '}
                    sera remboursé au wallet de l'utilisateur.
                  </p>
                  <div>
                    <label className="text-sm font-medium">Raison du rejet :</label>
                    <textarea
                      className="w-full mt-2 p-2 border rounded-md text-sm"
                      placeholder="Ex: Informations incomplètes, numéro invalide..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHandler}
              className={confirmAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {confirmAction === 'approve' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Confirmation Dialog */}
      <AlertDialog open={showBatchConfirm} onOpenChange={setShowBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver {selectedIds.size} retrait(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez approuver <strong>{selectedIds.size}</strong> demandes de retrait 
              pour un total de <strong>{selectedTotal.toLocaleString()} CDF</strong>.
              <br /><br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={batchApproveMutation.isPending}
            >
              {batchApproveMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirmer l'approbation en lot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WithdrawalManagement;
