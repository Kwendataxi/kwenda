import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  duration: string;
  comment: string;
}

interface VehicleReviewsProps {
  vehicleId: string;
}

// Mock data - à remplacer par vraies données Supabase
const mockReviews: Review[] = [
  {
    id: '1',
    userName: 'Jean Mukendi',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jean',
    rating: 5,
    date: 'Il y a 2 jours',
    duration: 'Location de 3 jours',
    comment: 'Excellent véhicule, très confortable et en parfait état. Le chauffeur était professionnel et ponctuel. Je recommande vivement!'
  },
  {
    id: '2',
    userName: 'Marie Kalala',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
    rating: 4,
    date: 'Il y a 5 jours',
    duration: 'Location de 1 jour',
    comment: 'Très bonne expérience. Le véhicule était propre et bien entretenu. Légère attente au départ mais rien de grave.'
  },
  {
    id: '3',
    userName: 'Patrick Nzuzi',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=patrick',
    rating: 5,
    date: 'Il y a 1 semaine',
    duration: 'Location de 5 jours',
    comment: 'Parfait pour un voyage en famille. Espace suffisant et très confortable sur les longues distances.'
  }
];

const ratingDistribution = [
  { stars: 5, count: 34, percentage: 81 },
  { stars: 4, count: 6, percentage: 14 },
  { stars: 3, count: 2, percentage: 5 },
  { stars: 2, count: 0, percentage: 0 },
  { stars: 1, count: 0, percentage: 0 }
];

export const VehicleReviews: React.FC<VehicleReviewsProps> = ({ vehicleId }) => {
  const averageRating = 4.8;
  const totalReviews = 42;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Avis clients
          </h3>
          <Button variant="link" size="sm" className="text-xs sm:text-sm">
            Voir tous
          </Button>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 p-4 bg-muted/50 rounded-lg">
          {/* Score global */}
          <div className="text-center sm:text-left sm:pr-6 sm:border-r">
            <p className="text-3xl sm:text-4xl font-bold">{averageRating}</p>
            <div className="flex items-center gap-1 justify-center sm:justify-start mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${
                    i <= Math.floor(averageRating) 
                      ? 'fill-yellow-500 text-yellow-500' 
                      : 'text-muted-foreground'
                  }`} 
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{totalReviews} avis</p>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs w-3 text-muted-foreground">{stars}</span>
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des avis */}
        <div className="space-y-3">
          {mockReviews.map(review => (
            <div key={review.id} className="p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={review.userAvatar} />
                  <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="font-semibold text-sm truncate">{review.userName}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-semibold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {review.date} · {review.duration}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
