import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SeedDriver {
  user_id: string;
  display_name: string;
  phone_number: string;
  email: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_class: string;
  latitude: number;
  longitude: number;
  city: string;
  rating_average: number;
  rating_count: number;
  is_online: boolean;
  is_available: boolean;
}

const driversData: SeedDriver[] = [
  // Abidjan - 15 chauffeurs
  {
    user_id: crypto.randomUUID(),
    display_name: "Kouadio Jean",
    phone_number: "+225 07 78 45 12 01",
    email: "kouadio.jean@example.ci",
    vehicle_make: "Toyota",
    vehicle_model: "Corolla",
    vehicle_plate: "AB 2547 CI",
    vehicle_color: "Blanc",
    vehicle_class: "standard",
    latitude: 5.3600,
    longitude: -4.0083,
    city: "Abidjan",
    rating_average: 4.7,
    rating_count: 156,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Yao Christophe",
    phone_number: "+225 05 67 89 34 02",
    email: "yao.christophe@example.ci",
    vehicle_make: "Hyundai",
    vehicle_model: "Accent",
    vehicle_plate: "AB 7834 CI",
    vehicle_color: "Rouge",
    vehicle_class: "standard",
    latitude: 5.3492,
    longitude: -4.0267,
    city: "Abidjan",
    rating_average: 4.5,
    rating_count: 203,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Aya Fatou",
    phone_number: "+225 07 23 56 78 03",
    email: "aya.fatou@example.ci",
    vehicle_make: "Kia",
    vehicle_model: "Picanto",
    vehicle_plate: "AB 9156 CI",
    vehicle_color: "Bleu",
    vehicle_class: "economy",
    latitude: 5.3444,
    longitude: -3.9739,
    city: "Abidjan",
    rating_average: 4.8,
    rating_count: 98,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Traoré Moussa",
    phone_number: "+225 01 45 67 89 04",
    email: "traore.moussa@example.ci",
    vehicle_make: "Renault",
    vehicle_model: "Logan",
    vehicle_plate: "AB 3421 CI",
    vehicle_color: "Gris",
    vehicle_class: "standard",
    latitude: 5.3195,
    longitude: -4.0267,
    city: "Abidjan",
    rating_average: 4.6,
    rating_count: 134,
    is_online: true,
    is_available: false
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Ouattara Salif",
    phone_number: "+225 07 89 12 34 05",
    email: "ouattara.salif@example.ci",
    vehicle_make: "Peugeot",
    vehicle_model: "208",
    vehicle_plate: "AB 6789 CI",
    vehicle_color: "Noir",
    vehicle_class: "premium",
    latitude: 5.3581,
    longitude: -3.9692,
    city: "Abidjan",
    rating_average: 4.9,
    rating_count: 87,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Bamba Seydou",
    phone_number: "+225 05 34 78 90 06",
    email: "bamba.seydou@example.ci",
    vehicle_make: "Nissan",
    vehicle_model: "Sentra",
    vehicle_plate: "AB 1357 CI",
    vehicle_color: "Blanc",
    vehicle_class: "standard",
    latitude: 5.3100,
    longitude: -4.0123,
    city: "Abidjan",
    rating_average: 4.3,
    rating_count: 234,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Diabaté Aminata",
    phone_number: "+225 07 56 89 01 07",
    email: "diabate.aminata@example.ci",
    vehicle_make: "Honda",
    vehicle_model: "City",
    vehicle_plate: "AB 9988 CI",
    vehicle_color: "Rouge",
    vehicle_class: "standard",
    latitude: 5.3389,
    longitude: -3.9864,
    city: "Abidjan",
    rating_average: 4.7,
    rating_count: 176,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Koné Ibrahim",
    phone_number: "+225 01 78 45 23 08",
    email: "kone.ibrahim@example.ci",
    vehicle_make: "Toyota",
    vehicle_model: "Yaris",
    vehicle_plate: "AB 4567 CI",
    vehicle_color: "Bleu",
    vehicle_class: "economy",
    latitude: 5.3528,
    longitude: -4.0400,
    city: "Abidjan",
    rating_average: 4.4,
    rating_count: 145,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Coulibaly Adama",
    phone_number: "+225 07 12 34 56 09",
    email: "coulibaly.adama@example.ci",
    vehicle_make: "Volkswagen",
    vehicle_model: "Polo",
    vehicle_plate: "AB 7890 CI",
    vehicle_color: "Gris",
    vehicle_class: "standard",
    latitude: 5.2944,
    longitude: -3.9889,
    city: "Abidjan",
    rating_average: 4.6,
    rating_count: 189,
    is_online: true,
    is_available: false
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Drogba Yves",
    phone_number: "+225 05 98 76 54 10",
    email: "drogba.yves@example.ci",
    vehicle_make: "Mercedes",
    vehicle_model: "A-Class",
    vehicle_plate: "AB 2468 CI",
    vehicle_color: "Noir",
    vehicle_class: "premium",
    latitude: 5.3667,
    longitude: -4.0167,
    city: "Abidjan",
    rating_average: 4.8,
    rating_count: 112,
    is_online: true,
    is_available: true
  },

  // Kinshasa - 10 chauffeurs
  {
    user_id: crypto.randomUUID(),
    display_name: "Mbala Joseph",
    phone_number: "+243 81 234 56 78",
    email: "mbala.joseph@example.cd",
    vehicle_make: "Toyota",
    vehicle_model: "Hiace",
    vehicle_plate: "CD 1234 KIN",
    vehicle_color: "Blanc",
    vehicle_class: "bus",
    latitude: -4.3217,
    longitude: 15.3069,
    city: "Kinshasa",
    rating_average: 4.5,
    rating_count: 267,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Tshisekedi Marie",
    phone_number: "+243 97 345 67 89",
    email: "tshisekedi.marie@example.cd",
    vehicle_make: "Honda",
    vehicle_model: "CBR",
    vehicle_plate: "CD 5678 KIN",
    vehicle_color: "Rouge",
    vehicle_class: "moto",
    latitude: -4.3456,
    longitude: 15.2890,
    city: "Kinshasa",
    rating_average: 4.7,
    rating_count: 189,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Kabila André",
    phone_number: "+243 82 456 78 90",
    email: "kabila.andre@example.cd",
    vehicle_make: "Hyundai",
    vehicle_model: "Tucson",
    vehicle_plate: "CD 9012 KIN",
    vehicle_color: "Noir",
    vehicle_class: "premium",
    latitude: -4.2890,
    longitude: 15.3245,
    city: "Kinshasa",
    rating_average: 4.8,
    rating_count: 143,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Lumumba Patrick",
    phone_number: "+243 99 567 89 01",
    email: "lumumba.patrick@example.cd",
    vehicle_make: "Toyota",
    vehicle_model: "Corolla",
    vehicle_plate: "CD 3456 KIN",
    vehicle_color: "Bleu",
    vehicle_class: "standard",
    latitude: -4.3678,
    longitude: 15.2567,
    city: "Kinshasa",
    rating_average: 4.4,
    rating_count: 198,
    is_online: true,
    is_available: false
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Mulumba Grace",
    phone_number: "+243 81 678 90 12",
    email: "mulumba.grace@example.cd",
    vehicle_make: "Yamaha",
    vehicle_model: "XTZ",
    vehicle_plate: "CD 7890 KIN",
    vehicle_color: "Jaune",
    vehicle_class: "moto",
    latitude: -4.3123,
    longitude: 15.3456,
    city: "Kinshasa",
    rating_average: 4.6,
    rating_count: 156,
    is_online: true,
    is_available: true
  },

  // Lubumbashi - 5 chauffeurs
  {
    user_id: crypto.randomUUID(),
    display_name: "Katanga Paul",
    phone_number: "+243 97 789 01 23",
    email: "katanga.paul@example.cd",
    vehicle_make: "Ford",
    vehicle_model: "Ranger",
    vehicle_plate: "CD 1357 LUB",
    vehicle_color: "Blanc",
    vehicle_class: "premium",
    latitude: -11.6792,
    longitude: 27.4897,
    city: "Lubumbashi",
    rating_average: 4.7,
    rating_count: 98,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Mujinga Claude",
    phone_number: "+243 82 890 12 34",
    email: "mujinga.claude@example.cd",
    vehicle_make: "Isuzu",
    vehicle_model: "D-Max",
    vehicle_plate: "CD 2468 LUB",
    vehicle_color: "Gris",
    vehicle_class: "standard",
    latitude: -11.6456,
    longitude: 27.5123,
    city: "Lubumbashi",
    rating_average: 4.5,
    rating_count: 134,
    is_online: true,
    is_available: true
  },

  // Kolwezi - 5 chauffeurs
  {
    user_id: crypto.randomUUID(),
    display_name: "Mbuyi Ernest",
    phone_number: "+243 99 901 23 45",
    email: "mbuyi.ernest@example.cd",
    vehicle_make: "Toyota",
    vehicle_model: "Land Cruiser",
    vehicle_plate: "CD 3691 KOL",
    vehicle_color: "Blanc",
    vehicle_class: "premium",
    latitude: -10.7144,
    longitude: 25.4664,
    city: "Kolwezi",
    rating_average: 4.8,
    rating_count: 76,
    is_online: true,
    is_available: true
  },
  {
    user_id: crypto.randomUUID(),
    display_name: "Kasongo Berthe",
    phone_number: "+243 81 012 34 56",
    email: "kasongo.berthe@example.cd",
    vehicle_make: "Nissan",
    vehicle_model: "Navara",
    vehicle_plate: "CD 4802 KOL",
    vehicle_color: "Rouge",
    vehicle_class: "standard",
    latitude: -10.6890,
    longitude: 25.4389,
    city: "Kolwezi",
    rating_average: 4.6,
    rating_count: 92,
    is_online: true,
    is_available: true
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🌱 Début du seeding des chauffeurs...');

    let insertedDrivers = 0;
    let insertedProfiles = 0;
    let insertedLocations = 0;

    for (const driver of driversData) {
      // 1. Insérer dans auth.users (simulé via chauffeurs table)
      const { error: driverError } = await supabase
        .from('chauffeurs')
        .upsert({
          user_id: driver.user_id,
          email: driver.email,
          phone_number: driver.phone_number,
          is_active: true,
          is_verified: true,
          vehicle_documents_verified: true,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (driverError) {
        console.error('❌ Erreur insertion chauffeur:', driverError);
        continue;
      }
      insertedDrivers++;

      // 2. Insérer le profil chauffeur
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .upsert({
          user_id: driver.user_id,
          display_name: driver.display_name,
          phone_number: driver.phone_number,
          vehicle_make: driver.vehicle_make,
          vehicle_model: driver.vehicle_model,
          vehicle_plate: driver.vehicle_plate,
          vehicle_color: driver.vehicle_color,
          vehicle_class: driver.vehicle_class,
          rating_average: driver.rating_average,
          rating_count: driver.rating_count,
          total_trips: Math.floor(Math.random() * 500) + 50,
          years_experience: Math.floor(Math.random() * 10) + 1,
          languages: ['Français', 'Anglais'],
          bio: `Chauffeur professionnel avec ${Math.floor(Math.random() * 10) + 1} ans d'expérience à ${driver.city}`,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('❌ Erreur insertion profil:', profileError);
        continue;
      }
      insertedProfiles++;

      // 3. Insérer la localisation
      const { error: locationError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: driver.user_id,
          latitude: driver.latitude,
          longitude: driver.longitude,
          city: driver.city,
          vehicle_class: driver.vehicle_class,
          is_online: driver.is_online,
          is_available: driver.is_available,
          last_ping: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 40) + 60, // 60-100%
          updated_at: new Date().toISOString()
        }, { onConflict: 'driver_id' });

      if (locationError) {
        console.error('❌ Erreur insertion localisation:', locationError);
        continue;
      }
      insertedLocations++;
    }

    console.log(`✅ Seeding terminé:
    - ${insertedDrivers} chauffeurs insérés
    - ${insertedProfiles} profils créés  
    - ${insertedLocations} localisations ajoutées`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Base de données peuplée avec succès',
        stats: {
          drivers: insertedDrivers,
          profiles: insertedProfiles,
          locations: insertedLocations,
          cities: ['Abidjan', 'Kinshasa', 'Lubumbashi', 'Kolwezi']
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erreur générale seeding:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});