import { SearchResult } from '@/components/search/UniversalSearchInterface';
import { UnifiedLocationService } from '@/services/unifiedLocationService';
import { supabase } from '@/integrations/supabase/client';

// Provider de recherche pour les lieux
export const locationSearchProvider = async (query: string): Promise<SearchResult[]> => {
  try {
    const locations = await UnifiedLocationService.searchLocation(query);
    
    return locations.map((location, index) => ({
      id: `location-${index}`,
      type: 'location' as const,
      title: location.address,
      subtitle: location.type === 'popular' ? 'Lieu populaire' : 'Adresse trouvée',
      coordinates: { lat: location.lat, lng: location.lng },
      badge: {
        text: location.type === 'popular' ? 'Populaire' : 'Maps',
        variant: location.type === 'popular' ? 'default' : 'secondary' as const
      },
      category: 'Géolocalisation',
      relevanceScore: location.type === 'popular' ? 10 : 5
    }));
  } catch (error) {
    console.error('Erreur recherche lieux:', error);
    return [];
  }
};

// Provider de recherche pour le marketplace - Version simplifiée
export const marketplaceSearchProvider = async (query: string): Promise<SearchResult[]> => {
  try {
    // Version simplifiée pour éviter les erreurs de schéma
    return [
      {
        id: `search-${query}`,
        type: 'product' as const,
        title: `Rechercher "${query}" dans le marketplace`,
        subtitle: 'Produits disponibles',
        badge: { text: 'Marketplace', variant: 'outline' as const },
        category: 'Recherche',
        relevanceScore: 5
      }
    ];
  } catch (error) {
    console.error('Erreur recherche marketplace:', error);
    return [];
  }
};

// Provider de recherche pour les utilisateurs (admin)
export const userSearchProvider = async (query: string): Promise<SearchResult[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%, phone_number.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return (profiles || []).map(profile => ({
      id: `user-${profile.id}`,
      type: 'user' as const,
      title: profile.display_name || 'Utilisateur',
      subtitle: profile.user_id,
      description: profile.phone_number,
      badge: {
        text: profile.user_type || 'Client',
        variant: 'secondary' as const
      },
      category: 'Utilisateurs',
      metadata: profile,
      relevanceScore: 5
    }));
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    return [];
  }
};

// Provider de recherche pour les commandes
export const ordersSearchProvider = async (query: string): Promise<SearchResult[]> => {
  try {
    // Recherche dans les commandes de transport
    const { data: transportBookings, error: transportError } = await supabase
      .from('transport_bookings')
      .select('*')
      .or(`pickup_location.ilike.%${query}%, destination.ilike.%${query}%, id::text.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transportError) throw transportError;

    // Recherche dans les commandes de livraison
    const { data: deliveryOrders, error: deliveryError } = await supabase
      .from('delivery_orders')
      .select('*')
      .or(`pickup_location.ilike.%${query}%, delivery_location.ilike.%${query}%, id::text.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (deliveryError) throw deliveryError;

    const results: SearchResult[] = [];

    // Ajouter les réservations de transport
    (transportBookings || []).forEach(booking => {
      results.push({
        id: `transport-${booking.id}`,
        type: 'action' as const,
        title: `Transport ${booking.id.slice(0, 8)}`,
        subtitle: `${booking.pickup_location} → ${booking.destination}`,
        description: `Statut: ${booking.status}`,
        badge: {
          text: booking.status,
          variant: booking.status === 'completed' ? 'default' : 'secondary' as const
        },
        category: 'Transport',
        metadata: booking,
        relevanceScore: 6
      });
    });

    // Ajouter les commandes de livraison
    (deliveryOrders || []).forEach(order => {
      results.push({
        id: `delivery-${order.id}`,
        type: 'action' as const,
        title: `Livraison ${order.id.slice(0, 8)}`,
        subtitle: `${order.pickup_location} → ${order.delivery_location}`,
        description: `Statut: ${order.status}`,
        badge: {
          text: order.delivery_type || 'Livraison',
          variant: 'outline' as const
        },
        category: 'Livraison',
        metadata: order,
        relevanceScore: 6
      });
    });

    return results;
  } catch (error) {
    console.error('Erreur recherche commandes:', error);
    return [];
  }
};

// Provider de recherche universelle combinant tous les types
export const universalSearchProvider = async (query: string): Promise<SearchResult[]> => {
  try {
    const [locations, products, users, orders] = await Promise.allSettled([
      locationSearchProvider(query),
      marketplaceSearchProvider(query),
      userSearchProvider(query),
      ordersSearchProvider(query)
    ]);

    const allResults: SearchResult[] = [];

    if (locations.status === 'fulfilled') allResults.push(...locations.value.slice(0, 3));
    if (products.status === 'fulfilled') allResults.push(...products.value.slice(0, 3));
    if (users.status === 'fulfilled') allResults.push(...users.value.slice(0, 2));
    if (orders.status === 'fulfilled') allResults.push(...orders.value.slice(0, 2));

    // Trier par pertinence et limiter
    return allResults
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 10);
  } catch (error) {
    console.error('Erreur recherche universelle:', error);
    return [];
  }
};

// Provider de suggestions populaires par contexte
export const getPopularSuggestions = (type: string): SearchResult[] => {
  switch (type) {
    case 'location':
      return [
        {
          id: 'kinshasa-center',
          type: 'popular',
          title: 'Centre-ville de Kinshasa',
          subtitle: 'Gombe, Kinshasa',
          coordinates: { lat: -4.3276, lng: 15.3136 },
          badge: { text: 'Populaire', variant: 'default' },
          relevanceScore: 10
        },
        {
          id: 'ndjili-airport',
          type: 'popular',
          title: 'Aéroport de N\'djili',
          subtitle: 'Transport vers l\'aéroport',
          coordinates: { lat: -4.3857, lng: 15.4446 },
          badge: { text: 'Transport', variant: 'secondary' },
          relevanceScore: 9
        },
        {
          id: 'university-kinshasa',
          type: 'popular',
          title: 'Université de Kinshasa',
          subtitle: 'Campus universitaire',
          coordinates: { lat: -4.4032, lng: 15.4023 },
          badge: { text: 'Éducation', variant: 'outline' },
          relevanceScore: 8
        }
      ];

    case 'product':
      return [
        {
          id: 'trending-electronics',
          type: 'popular',
          title: 'Électronique',
          subtitle: 'Téléphones, ordinateurs...',
          badge: { text: 'Trending', variant: 'default' },
          category: 'Catégorie',
          relevanceScore: 10
        },
        {
          id: 'trending-fashion',
          type: 'popular',
          title: 'Mode & Vêtements',
          subtitle: 'Dernières tendances',
          badge: { text: 'Mode', variant: 'secondary' },
          category: 'Catégorie',
          relevanceScore: 9
        }
      ];

    case 'general':
      return [
        {
          id: 'quick-transport',
          type: 'action',
          title: 'Commander un transport',
          subtitle: 'Réserver un taxi ou VTC',
          badge: { text: 'Transport', variant: 'default' },
          category: 'Action rapide',
          relevanceScore: 10
        },
        {
          id: 'quick-delivery',
          type: 'action',
          title: 'Livraison express',
          subtitle: 'Envoyer un colis',
          badge: { text: 'Livraison', variant: 'secondary' },
          category: 'Action rapide',
          relevanceScore: 9
        }
      ];

    default:
      return [];
  }
};