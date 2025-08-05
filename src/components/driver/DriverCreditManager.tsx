import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useDriverCredits } from '@/hooks/useDriverCredits'
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CreditCard,
  History,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

export const DriverCreditManager = () => {
  const { credits, transactions, topUpCredits, loading } = useDriverCredits()
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('airtel_money')

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000]

  const handleQuickTopUp = async (amount: number) => {
    const result = await topUpCredits(amount, selectedProvider)
    if (result.success) {
      setIsTopUpOpen(false)
    }
  }

  const handleCustomTopUp = async () => {
    const amount = parseInt(customAmount)
    if (amount && amount > 0) {
      const result = await topUpCredits(amount, selectedProvider)
      if (result.success) {
        setIsTopUpOpen(false)
        setCustomAmount('')
      }
    }
  }

  const getBalanceStatus = () => {
    if (!credits) return { status: 'unknown', message: 'Chargement...', color: 'bg-gray-500' }
    
    if (credits.balance >= 5000) {
      return { status: 'good', message: 'Solde suffisant', color: 'bg-green-500' }
    } else if (credits.balance >= 1000) {
      return { status: 'warning', message: 'Solde modéré', color: 'bg-yellow-500' }
    } else {
      return { status: 'low', message: 'Solde faible', color: 'bg-red-500' }
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup': return <Plus className="w-4 h-4 text-green-500" />
      case 'deduction': return <TrendingUp className="w-4 h-4 text-red-500" />
      default: return <DollarSign className="w-4 h-4 text-blue-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const balanceStatus = getBalanceStatus()

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${balanceStatus.color}`} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Solde Actuel</CardTitle>
              <Badge variant="outline" className="text-xs">
                {balanceStatus.message}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Wallet className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(credits?.balance || 0)}</p>
                  <p className="text-sm text-muted-foreground">Francs Congolais</p>
                </div>
              </div>
              
              <Progress 
                value={credits ? Math.min((credits.balance / 10000) * 100, 100) : 0} 
                className="h-2"
              />
              
              {credits?.balance && credits.balance < 1000 && (
                <div className="flex items-center space-x-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Rechargez pour maintenir votre visibilité</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Total Gagné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(credits?.total_earned || 0)}</p>
            <p className="text-sm text-muted-foreground">Depuis le début</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
              Total Dépensé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(credits?.total_spent || 0)}</p>
            <p className="text-sm text-muted-foreground">En frais de service</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="h-16 flex flex-col"
                onClick={() => handleQuickTopUp(amount)}
                disabled={loading}
              >
                <span className="font-bold">{formatCurrency(amount)}</span>
                <span className="text-xs text-muted-foreground">Recharge</span>
              </Button>
            ))}
          </div>
          
          <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-4" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Recharge Personnalisée
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recharger vos Crédits</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Montant (CDF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Entrez le montant"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="100"
                    step="100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="provider">Méthode de Paiement</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel_money">Airtel Money</SelectItem>
                      <SelectItem value="orange_money">Orange Money</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCustomTopUp} 
                  disabled={loading || !customAmount || parseInt(customAmount) < 100}
                  className="w-full"
                >
                  {loading ? 'Traitement...' : `Recharger ${customAmount ? formatCurrency(parseInt(customAmount)) : ''}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Service Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Frais par Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Transport</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">200 CDF</p>
              <p className="text-sm text-muted-foreground">par course acceptée</p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Livraison</span>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">150 CDF</p>
              <p className="text-sm text-muted-foreground">par livraison acceptée</p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Marketplace</span>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
              <p className="text-2xl font-bold">100 CDF</p>
              <p className="text-sm text-muted-foreground">par commande traitée</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Note importante</p>
                <p className="text-yellow-700">
                  Ces frais sont automatiquement déduits de votre solde lorsque vous acceptez une course. 
                  Assurez-vous d'avoir un solde suffisant pour rester visible dans la file d'attente.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="w-5 h-5 mr-2" />
              Historique des Transactions
            </CardTitle>
            <Badge variant="outline">{transactions.length} transactions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune transaction pour le moment</p>
              </div>
            ) : (
              transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(transaction.created_at).toLocaleString('fr-FR')}</span>
                      </div>
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
                      Solde: {formatCurrency(transaction.balance_after)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}