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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              <span className="truncate">Total Chauffeurs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl sm:text-3xl font-bold">{drivers.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Comptes crédits actifs</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              <span className="truncate">Solde Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.totalBalance)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Tous les chauffeurs</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              <span className="truncate">Total Rechargé</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.totalEarned)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Recharges cumulées</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-600" />
              <span className="truncate">Soldes Faibles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.lowBalanceCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Moins de 1000 CDF</p>
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher chauffeur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="low_balance">Solde faible</SelectItem>
                      <SelectItem value="no_balance">Solde nul</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchDriverCredits()
                      fetchTransactions()
                    }}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Actualiser</span>
                  </Button>
                </div>
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
                    <div key={driver.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${balanceStatus.color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{driver.profiles?.display_name || 'Chauffeur'}</p>
                          <p className="text-sm text-muted-foreground truncate">{driver.profiles?.phone_number || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-lg sm:text-base">{formatCurrency(driver.balance)}</p>
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
                                className="flex-1 sm:flex-none"
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
                                <div className="p-3 bg-muted rounded-lg">
                                  <Label className="text-sm font-medium">Chauffeur</Label>
                                  <p className="font-medium text-lg">{selectedDriver?.profiles?.display_name || 'Chauffeur'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Solde actuel: <span className="font-medium">{formatCurrency(selectedDriver?.balance || 0)}</span>
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="amount">Montant (CDF)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    placeholder="5000"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    min="100"
                                    step="100"
                                    className="text-lg"
                                  />
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button 
                                    variant="outline"
                                    onClick={() => setTopUpAmount('5000')}
                                    className="flex-1"
                                  >
                                    5,000 CDF
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => setTopUpAmount('10000')}
                                    className="flex-1"
                                  >
                                    10,000 CDF
                                  </Button>
                                </div>
                                
                                <Button 
                                  onClick={handleTopUp} 
                                  disabled={loading || !topUpAmount || parseInt(topUpAmount) < 100}
                                  className="w-full"
                                  size="lg"
                                >
                                  {loading ? 'Traitement...' : `Ajouter ${topUpAmount ? formatCurrency(parseInt(topUpAmount)) : 'Crédits'}`}
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
                  <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.transaction_type === 'topup' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{transaction.profiles?.display_name || 'Chauffeur'}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`font-bold text-lg sm:text-base ${
                        transaction.transaction_type === 'topup' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'topup' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solde: {formatCurrency(transaction.balance_after)}
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