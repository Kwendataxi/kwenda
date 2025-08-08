
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

export const DriverWalletPanel: React.FC = () => {
  const { wallet, transactions, loading, topUpWallet } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [provider, setProvider] = useState<'airtel' | 'orange' | 'mpesa' | ''>('');
  const [phone, setPhone] = useState<string>('');

  const balanceText = useMemo(() => {
    const value = Number(wallet?.balance || 0);
    return `${value.toLocaleString('fr-CD')} ${wallet?.currency || 'CDF'}`;
  }, [wallet]);

  const canTopup = useMemo(() => {
    return !!provider && !!phone && Number(amount) > 0 && !loading;
  }, [provider, phone, amount, loading]);

  const handleTopup = async () => {
    const ok = await topUpWallet(Number(amount), provider, phone);
    if (ok) {
      setAmount('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Kwenda Pay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Solde disponible</p>
              <p className="text-2xl font-semibold tracking-tight">{balanceText}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {wallet?.is_active ? 'Actif' : 'Inactif'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Opérateur</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airtel">Airtel Money</SelectItem>
                  <SelectItem value="orange">Orange Money</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="099xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleTopup} disabled={!canTopup} className={cn(loading && 'opacity-70')}>
              {loading ? 'Traitement...' : 'Recharger'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune transaction pour l’instant.</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((t) => {
                const isCredit = t.transaction_type === 'credit';
                return (
                  <div key={t.id} className="flex items-center justify-between border-b last:border-b-0 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className={cn('text-sm font-semibold', isCredit ? 'text-green-600' : 'text-red-600')}>
                      {isCredit ? '+' : '-'}
                      {Number(t.amount).toLocaleString('fr-CD')} {t.currency}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverWalletPanel;
