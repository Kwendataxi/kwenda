import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { 
  Wallet, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  RefreshCw,
  Filter
} from 'lucide-react'

interface DriverCredit {
  id: string
  driver_id: string
  balance: number
  total_earned: number
  total_spent: number
  currency: string
  last_topup_date: string | null
  low_balance_alert_sent: boolean
  is_active: boolean
  profiles: {
    display_name: string | null
    phone_number: string | null
  } | null
}

interface CreditTransaction {
  id: string
  driver_id: string
  transaction_type: string
  amount: number
  currency: string
  description: string
  reference_type: string | null
  reference_id: string | null
  balance_before: number
  balance_after: number
  created_at: string
  profiles: {
    display_name: string | null
  } | null
}

export const DriverCreditsManager = () => {
  const { toast } = useToast()
  const [drivers, setDrivers] = useState<DriverCredit[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<DriverCredit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<DriverCredit | null>(null)
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchDriverCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_credits')
        .select(`
          *,
          profiles!driver_credits_driver_id_fkey (
            display_name,
            phone_number
          )
        `)
        .order('balance', { ascending: true })

      if (error) throw error
      setDrivers(data as any || [])
      setFilteredDrivers(data as any || [])
    } catch (error) {
      console.error('Error fetching driver credits:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les crédits chauffeurs",
        variant: "destructive"
      })
    }
  }

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select(`
          *,
          profiles!credit_transactions_driver_id_fkey (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setTransactions(data as any || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleTopUp = async () => {
    if (!selectedDriver || !topUpAmount) return

    setLoading(true)
    try {
      const amount = parseInt(topUpAmount)
      const { data, error } = await supabase.functions.invoke('credit-management', {
        body: {
          action: 'topup',
          driver_id: selectedDriver.driver_id,
          amount,
          payment_method: 'admin_manual',
          description: `Recharge manuelle admin: ${amount} CDF`
        }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Recharge Effectuée",
          description: `${amount} CDF ajoutés au compte de ${selectedDriver.profiles?.display_name || 'chauffeur'}`,
          variant: "default"
        })
        
        setIsTopUpOpen(false)
        setTopUpAmount('')
        setSelectedDriver(null)
        fetchDriverCredits()
        fetchTransactions()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Top-up error:', error)
      toast({
        title: "Erreur",
        description: error.message || "Échec de la recharge",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDrivers = (query: string, filterType: string) => {
    let filtered = drivers

    // Apply text filter
    if (query) {
      filtered = filtered.filter(driver => 
        driver.profiles?.display_name?.toLowerCase().includes(query.toLowerCase()) ||
        driver.profiles?.phone_number?.includes(query)
      )
    }

    // Apply status filter
    switch (filterType) {
      case 'low_balance':
        filtered = filtered.filter(driver => driver.balance < 1000)
        break
      case 'no_balance':
        filtered = filtered.filter(driver => driver.balance === 0)
        break
      case 'active':
        filtered = filtered.filter(driver => driver.is_active)
        break
      case 'inactive':
        filtered = filtered.filter(driver => !driver.is_active)
        break
    }

    setFilteredDrivers(filtered)
  }

  useEffect(() => {
    fetchDriverCredits()
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterDrivers(searchQuery, filter)
  }, [searchQuery, filter, drivers])

  const getBalanceStatus = (balance: number) => {
    if (balance >= 5000) return { status: 'good', color: 'bg-green-500', text: 'Bon' }
    if (balance >= 1000) return { status: 'warning', color: 'bg-yellow-500', text: 'Modéré' }
    return { status: 'low', color: 'bg-red-500', text: 'Faible' }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTotalStats = () => {
    const totalBalance = drivers.reduce((sum, driver) => sum + driver.balance, 0)
    const totalEarned = drivers.reduce((sum, driver) => sum + driver.total_earned, 0)
    const totalSpent = drivers.reduce((sum, driver) => sum + driver.total_spent, 0)
    const lowBalanceCount = drivers.filter(driver => driver.balance < 1000).length

    return { totalBalance, totalEarned, totalSpent, lowBalanceCount }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Total Chauffeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{drivers.length}</p>
            <p className="text-sm text-muted-foreground">Comptes crédits actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-green-600" />
              Solde Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalBalance)}</p>
            <p className="text-sm text-muted-foreground">Tous les chauffeurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Total Gagné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalEarned)}</p>
            <p className="text-sm text-muted-foreground">Recharges cumulées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Soldes Faibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.lowBalanceCount}</p>
            <p className="text-sm text-muted-foreground">Moins de 1000 CDF</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drivers">Gestion Chauffeurs</TabsTrigger>
          <TabsTrigger value="transactions">Historique Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Recherche et Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom ou téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les chauffeurs</SelectItem>
                    <SelectItem value="low_balance">Solde faible</SelectItem>
                    <SelectItem value="no_balance">Solde nul</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchDriverCredits()
                    fetchTransactions()
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Drivers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Liste des Chauffeurs ({filteredDrivers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredDrivers.map((driver) => {
                  const balanceStatus = getBalanceStatus(driver.balance)
                  
                  return (
                    <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${balanceStatus.color}`} />
                        <div>
                          <p className="font-medium">{driver.profiles?.display_name || 'Chauffeur'}</p>
                          <p className="text-sm text-muted-foreground">{driver.profiles?.phone_number || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(driver.balance)}</p>
                          <p className="text-sm text-muted-foreground">
                            Gagné: {formatCurrency(driver.total_earned)}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Dialog open={isTopUpOpen && selectedDriver?.id === driver.id} onOpenChange={setIsTopUpOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDriver(driver)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Recharger
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Recharge Manuelle</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label>Chauffeur</Label>
                                  <p className="font-medium">{selectedDriver?.profiles?.display_name || 'Chauffeur'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Solde actuel: {formatCurrency(selectedDriver?.balance || 0)}
                                  </p>
                                </div>
                                
                                <div>
                                  <Label htmlFor="amount">Montant à ajouter (CDF)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Entrez le montant"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    min="100"
                                    step="100"
                                  />
                                </div>
                                
                                <Button 
                                  onClick={handleTopUp} 
                                  disabled={loading || !topUpAmount || parseInt(topUpAmount) < 100}
                                  className="w-full"
                                >
                                  {loading ? 'Traitement...' : `Ajouter ${topUpAmount ? formatCurrency(parseInt(topUpAmount)) : ''}`}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {filteredDrivers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun chauffeur trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 50).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.transaction_type === 'topup' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{transaction.profiles?.display_name || 'Chauffeur'}</p>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.transaction_type === 'topup' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'topup' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Nouveau solde: {formatCurrency(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune transaction</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}