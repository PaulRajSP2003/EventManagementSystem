// D:\Project\campmanagementsystem\src\user\pages\api\PlaceList.ts

// Interface for Photon API response
export interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    city?: string;
    country?: string;
    state?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

export interface PlaceSearchResult {
  features: PhotonFeature[];
  displayName: string;
  latitude: number;
  longitude: number;
}

/**
 * Search for places using Photon API (OpenStreetMap based)
 * @param query - The search query (minimum 2 characters)
 * @param limit - Maximum number of results (default: 5)
 * @returns Promise with array of PhotonFeature objects
 */
export const searchPlaces = async (
  query: string, 
  limit: number = 5
): Promise<PhotonFeature[]> => {
  if (query.length < 1) {
    return [];
  }

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

/**
 * Get a human-readable display name from a Photon feature
 * @param feature - The Photon feature object
 * @returns Formatted place name string
 */
export const getPlaceDisplayName = (feature: PhotonFeature): string => {
  const props = feature.properties;
  const parts = [];
  
  if (props.name) parts.push(props.name);
  if (props.city && props.city !== props.name) parts.push(props.city);
  if (props.state && props.state !== props.city) parts.push(props.state);
  if (props.country && props.country !== props.state) parts.push(props.country);
  
  return parts.join(', ') || 'Unknown location';
};

/**
 * Extract coordinates from a Photon feature
 * @param feature - The Photon feature object
 * @returns Object containing latitude and longitude
 */
export const getPlaceCoordinates = (feature: PhotonFeature): { lat: number; lng: number } => {
  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng };
};

/**
 * Get place type/OSM information
 * @param feature - The Photon feature object
 * @returns Object containing OSM key and value
 */
export const getPlaceType = (feature: PhotonFeature): { osmKey: string; osmValue: string } => {
  return {
    osmKey: feature.properties.osm_key || 'unknown',
    osmValue: feature.properties.osm_value || 'unknown',
  };
};

/**
 * Validate if a place search result has valid coordinates
 * @param feature - The Photon feature object
 * @returns Boolean indicating if coordinates are valid
 */
export const hasValidCoordinates = (feature: PhotonFeature): boolean => {
  const [lng, lat] = feature.geometry.coordinates;
  return (
    typeof lng === 'number' && 
    typeof lat === 'number' && 
    !isNaN(lng) && 
    !isNaN(lat) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// Default export with all functions
const PlaceAPI = {
  searchPlaces,
  getPlaceDisplayName,
  getPlaceCoordinates,
  getPlaceType,
  hasValidCoordinates,
};

export default PlaceAPI;