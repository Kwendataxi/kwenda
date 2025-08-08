
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RentalBooking } from "@/hooks/usePartnerRentals";

interface Props {
  bookings: RentalBooking[];
  onUpdateStatus: (id: string, status: RentalBooking["status"]) => void;
}

const statusOrder: RentalBooking["status"][] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
  "no_show",
];

export default function PartnerBookingsList({ bookings, onUpdateStatus }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {bookings.map((b) => (
        <Card key={b.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">Réservation</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">Retrait: {b.pickup_location}</p>
                <p className="text-sm text-muted-foreground">Retour: {b.return_location}</p>
                <p className="text-sm text-primary mt-1">Total: {Number(b.total_amount).toLocaleString()} FC</p>
                <p className="text-xs text-muted-foreground mt-1">Statut: {b.status}</p>
              </div>
              <div className="flex flex-col gap-2">
                {statusOrder.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => onUpdateStatus(b.id, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {bookings.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-6">Aucune réservation pour le moment.</div>
      )}
    </div>
  );
}
