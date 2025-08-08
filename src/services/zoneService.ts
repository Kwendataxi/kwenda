export interface ZonePolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [lng, lat] pairs
}

export interface ServiceZone {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  type: 'commune' | 'district' | 'quartier';
  center: [number, number]; // [lng, lat]
  polygon: ZonePolygon;
  isActive: boolean;
  surgeMultiplier: number;
  popularPlaces: PopularPlace[];
}

export interface PopularPlace {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  category: 'hospital' | 'school' | 'market' | 'office' | 'hotel' | 'restaurant' | 'transport' | 'landmark';
  coordinates: [number, number]; // [lng, lat]
  address: string;
  zone: string;
}

export class ZoneService {
  private static zones: ServiceZone[] = [
    {
      id: 'gombe',
      name: 'Gombe',
      nameEn: 'Gombe',
      nameFr: 'Gombe',
      type: 'commune',
      center: [15.2663, -4.3319],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [15.2450, -4.3100], [15.2850, -4.3100], 
          [15.2850, -4.3500], [15.2450, -4.3500], 
          [15.2450, -4.3100]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.2,
      popularPlaces: [
        {
          id: 'hopital_general',
          name: 'Hôpital Général de Kinshasa',
          nameEn: 'Kinshasa General Hospital',
          nameFr: 'Hôpital Général de Kinshasa',
          category: 'hospital',
          coordinates: [15.2750, -4.3250],
          address: 'Avenue de la Justice, Gombe',
          zone: 'gombe'
        },
        {
          id: 'ccic',
          name: 'Centre de Commerce International',
          nameEn: 'International Trade Center',
          nameFr: 'Centre de Commerce International',
          category: 'office',
          coordinates: [15.2680, -4.3180],
          address: 'Boulevard du 30 Juin, Gombe',
          zone: 'gombe'
        }
      ]
    },
    {
      id: 'lemba',
      name: 'Lemba',
      nameEn: 'Lemba',
      nameFr: 'Lemba',
      type: 'commune',
      center: [15.2441, -4.4286],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [15.2200, -4.4000], [15.2700, -4.4000],
          [15.2700, -4.4600], [15.2200, -4.4600],
          [15.2200, -4.4000]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.0,
      popularPlaces: [
        {
          id: 'universite_kinshasa',
          name: 'Université de Kinshasa',
          nameEn: 'University of Kinshasa',
          nameFr: 'Université de Kinshasa',
          category: 'school',
          coordinates: [15.2350, -4.4350],
          address: 'Campus Universitaire, Lemba',
          zone: 'lemba'
        }
      ]
    },
    {
      id: 'matete',
      name: 'Matete',
      nameEn: 'Matete',
      nameFr: 'Matete',
      type: 'commune',
      center: [15.3147, -4.4286],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [15.2900, -4.4000], [15.3400, -4.4000],
          [15.3400, -4.4600], [15.2900, -4.4600],
          [15.2900, -4.4000]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.1,
      popularPlaces: [
        {
          id: 'marche_matete',
          name: 'Marché de Matete',
          nameEn: 'Matete Market',
          nameFr: 'Marché de Matete',
          category: 'market',
          coordinates: [15.3100, -4.4200],
          address: 'Avenue Matete, Matete',
          zone: 'matete'
        }
      ]
    },
    {
      id: 'masina',
      name: 'Masina',
      nameEn: 'Masina',
      nameFr: 'Masina',
      type: 'commune',
      center: [15.3441, -4.3848],
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [15.3200, -4.3600], [15.3700, -4.3600],
          [15.3700, -4.4100], [15.3200, -4.4100],
          [15.3200, -4.3600]
        ]]
      },
      isActive: true,
      surgeMultiplier: 1.0,
      popularPlaces: [
        {
          id: 'aeroport_ndjili',
          name: 'Aéroport International de N\'djili',
          nameEn: 'N\'djili International Airport',
          nameFr: 'Aéroport International de N\'djili',
          category: 'transport',
          coordinates: [15.4450, -4.3850],
          address: 'Route de l\'Aéroport, Masina',
          zone: 'masina'
        }
      ]
    }
  ];

  static getZones(): ServiceZone[] {
    return this.zones.filter(zone => zone.isActive);
  }

  static getZoneByPoint(lng: number, lat: number): ServiceZone | null {
    for (const zone of this.zones) {
      if (this.isPointInZone(lng, lat, zone)) {
        return zone;
      }
    }
    return null;
  }

  static getZoneById(id: string): ServiceZone | null {
    return this.zones.find(zone => zone.id === id) || null;
  }

  static getPopularPlacesInZone(zoneId: string): PopularPlace[] {
    const zone = this.getZoneById(zoneId);
    return zone ? zone.popularPlaces : [];
  }

  static getAllPopularPlaces(): PopularPlace[] {
    return this.zones.flatMap(zone => zone.popularPlaces);
  }

  static searchPopularPlaces(query: string, limit = 5): PopularPlace[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const places = this.getAllPopularPlaces();
    const matches = places.filter(place => 
      place.name.toLowerCase().includes(normalizedQuery) ||
      place.nameEn.toLowerCase().includes(normalizedQuery) ||
      place.nameFr.toLowerCase().includes(normalizedQuery) ||
      place.address.toLowerCase().includes(normalizedQuery)
    );

    return matches.slice(0, limit);
  }

  static getProximityBias(userLng: number, userLat: number): { lng: number; lat: number } | null {
    const zone = this.getZoneByPoint(userLng, userLat);
    if (zone) {
      return { lng: zone.center[0], lat: zone.center[1] };
    }
    
    // Default to Kinshasa center if no zone found
    return { lng: 15.2663, lat: -4.3319 };
  }

  static getSurgeMultiplier(lng: number, lat: number): number {
    const zone = this.getZoneByPoint(lng, lat);
    return zone ? zone.surgeMultiplier : 1.0;
  }

  private static isPointInZone(lng: number, lat: number, zone: ServiceZone): boolean {
    // Simple bounding box check for performance
    const coords = zone.polygon.coordinates[0];
    const minLng = Math.min(...coords.map(c => c[0]));
    const maxLng = Math.max(...coords.map(c => c[0]));
    const minLat = Math.min(...coords.map(c => c[1]));
    const maxLat = Math.max(...coords.map(c => c[1]));

    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  }

  static getNearbyZones(lng: number, lat: number, radiusKm = 10): ServiceZone[] {
    return this.zones.filter(zone => {
      const distance = this.calculateDistance(
        lat, lng,
        zone.center[1], zone.center[0]
      );
      return distance <= radiusKm;
    });
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static getZoneStatistics() {
    return {
      totalZones: this.zones.length,
      activeZones: this.zones.filter(z => z.isActive).length,
      totalPopularPlaces: this.getAllPopularPlaces().length,
      zonesByType: {
        commune: this.zones.filter(z => z.type === 'commune').length,
        district: this.zones.filter(z => z.type === 'district').length,
        quartier: this.zones.filter(z => z.type === 'quartier').length,
      }
    };
  }
}