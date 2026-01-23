import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  user_type: string;
  bio: string | null;
  cover_url: string | null;
  created_at: string;
  is_public: boolean;
  is_verified_seller: boolean;
  last_seen: string | null;
  updated_at: string;
}

interface UserRating {
  rating: number;
  total_ratings: number;
}

interface CachedProfileData {
  profile: Profile;
  rating: UserRating;
  timestamp: number;
}

const CACHE_KEY = 'kwenda_profile_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState<UserRating>({ rating: 0, total_ratings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // ✅ ÉTAPE 1 : Vérifier le cache localStorage
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const cachedData: CachedProfileData = JSON.parse(cached);
            const age = Date.now() - cachedData.timestamp;
            
            if (age < CACHE_DURATION) {
              console.log('✅ Cache hit - profil chargé instantanément');
              setProfile(cachedData.profile);
              setRating(cachedData.rating);
              setLoading(false);
              return; // ✅ Sortie immédiate, pas de requête !
            }
          } catch (e) {
            console.warn('Cache invalide, rechargement...');
            localStorage.removeItem(CACHE_KEY);
          }
        }

        console.log('🔄 Cache miss - requête Supabase...');

        // ✅ ÉTAPE 2 : Requêtes parallèles (au lieu de séquentielles)
        const [profileResult, ratingsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('user_ratings')
            .select('rating')
            .eq('rated_user_id', user.id)
        ]);

        // ✅ ÉTAPE 3 : Traiter les résultats
        let profileData = profileResult.data;
        
        // Créer un profil par défaut si inexistant
        if (!profileData && !profileResult.error) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([{
              user_id: user.id,
              display_name: user.email?.split('@')[0] || 'Utilisateur',
              user_type: 'client'
            }])
            .select()
            .maybeSingle();
          
          profileData = newProfile;
        }

        if (!profileData) {
          profileData = {
            id: '',
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'Utilisateur',
            phone_number: null,
            avatar_url: null,
            user_type: 'client',
            bio: null,
            cover_url: null,
            created_at: new Date().toISOString(),
            is_public: true,
            is_verified_seller: false,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        const ratingsData = ratingsResult.data || [];
        const avgRating = ratingsData.length > 0
          ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
          : 0;
        
        const ratingData = {
          rating: Math.round(avgRating * 10) / 10,
          total_ratings: ratingsData.length
        };

        // ✅ ÉTAPE 4 : Mettre en cache
        const cacheData: CachedProfileData = {
          profile: profileData,
          rating: ratingData,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        setProfile(profileData);
        setRating(ratingData);
        
        console.log('✅ Profil chargé et mis en cache');
      } catch (error: any) {
        console.error('❌ Erreur chargement profil:', error);
        
        // Profil par défaut en cas d'erreur
        setProfile({
          id: '',
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Utilisateur',
          phone_number: null,
          avatar_url: null,
          user_type: 'client',
          bio: null,
          cover_url: null,
          created_at: new Date().toISOString(),
          is_public: true,
          is_verified_seller: false,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    // ✅ Timeout de 5s avec chargement en arrière-plan
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⏰ Timeout 5s - affichage skeleton');
        setLoading(false);
      }
    }, 5000);

    loadData();

    return () => clearTimeout(timeout);
  }, [user?.id]);

  // ✅ Méthode pour forcer le refresh (après mise à jour)
  const refreshProfile = () => {
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
  };

  return {
    profile,
    rating,
    loading,
    refreshProfile
  };
};
