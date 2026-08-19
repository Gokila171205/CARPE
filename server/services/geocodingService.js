const Location = require('../models/Location');

/**
 * Clean and normalize location string
 */
const normalizeLocationName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim();
};

/**
 * Geocode a location in Tamil Nadu, India using OpenStreetMap Nominatim API.
 * Uses query format: "<Location>, Tamil Nadu, India".
 * Returns { latitude: Number, longitude: Number } or null if not found.
 */
const fetchCoordinatesFromGeocoder = async (locationName) => {
  const cleanName = normalizeLocationName(locationName);
  if (!cleanName) return null;

  const query = `${cleanName}, Tamil Nadu, India`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=1&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CARPE-Municipal-Waste-Intelligence/1.0 (contact: admin@carpe-tn.gov.in)',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(5000) // 5s timeout safeguard
    });

    if (!response.ok) {
      console.warn(`Geocoding HTTP error for "${query}": status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lon.toFixed(6)),
          displayName: data[0].display_name
        };
      }
    }
  } catch (err) {
    console.warn(`Geocoding failed for "${query}":`, err.message);
  }

  return null;
};

/**
 * Ensure location coordinates are cached in MongoDB Location model.
 * If already present with coordinates, returns cached document without making API calls.
 * If missing coordinates, fetches from geocoder and updates MongoDB.
 */
const resolveAndCacheLocation = async (locationName) => {
  const cleanName = normalizeLocationName(locationName);
  if (!cleanName) return null;
  if (require('mongoose').connection.readyState !== 1) return null;

  try {
    // 1. Check if location already exists in MongoDB Location model with valid coordinates
    let locDoc = await Location.findOne({
      name: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    if (
      locDoc &&
      typeof locDoc.latitude === 'number' &&
      typeof locDoc.longitude === 'number' &&
      !isNaN(locDoc.latitude) &&
      !isNaN(locDoc.longitude)
    ) {
      return locDoc; // Reuse cached coordinates (0 API calls)
    }

    // 2. Fetch coordinates from geocoder
    const coords = await fetchCoordinatesFromGeocoder(cleanName);
    if (coords) {
      if (locDoc) {
        locDoc.latitude = coords.latitude;
        locDoc.longitude = coords.longitude;
        await locDoc.save();
      } else {
        locDoc = await Location.create({
          name: cleanName,
          latitude: coords.latitude,
          longitude: coords.longitude,
          areaType: 'Mixed'
        });
      }
      return locDoc;
    }
  } catch (err) {
    if (require('mongoose').connection.readyState === 1) {
      console.warn(`Error resolving and caching location "${cleanName}":`, err.message);
    }
  }

  return null;
};

module.exports = {
  fetchCoordinatesFromGeocoder,
  resolveAndCacheLocation,
  normalizeLocationName
};
