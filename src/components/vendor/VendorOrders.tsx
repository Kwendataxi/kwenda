import { OrderTracker } from '@/components/marketplace/OrderTracker';

export const VendorOrders = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Mes commandes</h1>
      <OrderTracker />
    </div>
  );
};
