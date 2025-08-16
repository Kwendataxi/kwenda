import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserVerification {
  id: string;
  user_id: string;
  phone_verified: boolean;
  identity_verified: boolean;
  verification_level: string; // Changed from union type to string to match Supabase type
  verification_documents: any[];
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserVerification = () => {
  const { user } = useAuth();
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchVerificationStatus();
  }, [user?.id]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: verificationError } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (verificationError) {
        throw verificationError;
      }

      // Si aucun enregistrement de vérification n'existe, en créer un
      if (!data) {
        const { data: newVerification, error: createError } = await supabase
          .from('user_verification')
          .insert({
            user_id: user.id,
            verification_level: 'none'
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setVerification(newVerification as UserVerification);
      } else {
        setVerification(data as UserVerification);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (updates: Partial<UserVerification>) => {
    try {
      const { data, error } = await supabase
        .from('user_verification')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVerification(data as UserVerification);
      return data;
    } catch (err) {
      console.error('Error updating verification:', err);
      throw err;
    }
  };

  const isVerifiedForSelling = () => {
    if (!verification) return false;
    return verification.phone_verified && verification.verification_level !== 'none';
  };

  const getVerificationProgress = () => {
    if (!verification) return 0;
    
    let progress = 0;
    if (verification.phone_verified) progress += 50;
    if (verification.identity_verified) progress += 50;
    
    return progress;
  };

  return {
    verification,
    loading,
    error,
    fetchVerificationStatus,
    updateVerificationStatus,
    isVerifiedForSelling,
    getVerificationProgress
  };
};