-- PHASE 1 : Modèle de paiement restaurants

-- Migration 1 : Ajouter payment_model à restaurant_profiles
ALTER TABLE restaurant_profiles 
ADD COLUMN payment_model TEXT NOT NULL DEFAULT 'commission';

ALTER TABLE restaurant_profiles 
ADD CONSTRAINT valid_payment_model 
CHECK (payment_model IN ('subscription', 'commission'));

CREATE INDEX idx_restaurant_payment_model ON restaurant_profiles(payment_model);

COMMENT ON COLUMN restaurant_profiles.payment_model IS 
'Modèle de paiement : subscription (abonnement mensuel, 0% commission) ou commission (pas d abonnement, X% par vente)';

-- Migration 2 : Configuration des taux de commission
CREATE TABLE restaurant_commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  min_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  max_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_commission_rates CHECK (
    default_commission_rate >= min_commission_rate 
    AND default_commission_rate <= max_commission_rate
  )
);

INSERT INTO restaurant_commission_config (default_commission_rate, min_commission_rate, max_commission_rate)
VALUES (5.00, 3.00, 15.00);

ALTER TABLE restaurant_commission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_commission_config"
ON restaurant_commission_config
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Table : Taux personnalisés par restaurant
CREATE TABLE restaurant_custom_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID UNIQUE NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  
  custom_commission_rate NUMERIC(5,2) NOT NULL,
  reason TEXT,
  
  set_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_custom_rate CHECK (custom_commission_rate >= 0 AND custom_commission_rate <= 50)
);

CREATE INDEX idx_custom_rates_restaurant ON restaurant_custom_commission_rates(restaurant_id);

ALTER TABLE restaurant_custom_commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_custom_rates"
ON restaurant_custom_commission_rates
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "restaurants_view_own_rate"
ON restaurant_custom_commission_rates
FOR SELECT
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
  )
);

-- Migration 3 : Fonction pour obtenir le taux de commission
CREATE OR REPLACE FUNCTION get_restaurant_commission_rate(p_restaurant_id UUID)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC(5,2);
BEGIN
  SELECT custom_commission_rate INTO v_rate
  FROM restaurant_custom_commission_rates
  WHERE restaurant_id = p_restaurant_id;
  
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;
  
  SELECT default_commission_rate INTO v_rate
  FROM restaurant_commission_config
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_rate, 5.00);
END;
$$;