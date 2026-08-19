import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  RotateCcw,
  AlertCircle,
  Layers,
  Map as MapIcon,
  CheckCircle2,
  Info
} from 'lucide-react';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

// Helper component to adjust map bounds to markers
function MapBoundsUpdater({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, markers]);

  return null;
}

export default function Map() {
  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  const [locationList, setLocationList] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default center (Chennai)
  const defaultCenter = [13.0827, 80.2707];

  // Fetch registered locations for the dropdown
  useEffect(() => {
    const fetchLocationsList = async () => {
      try {
        const { data } = await api.get('/locations');
        if (Array.isArray(data)) {
          setLocationList(data.map((l) => (typeof l === 'string' ? l : l.name)).filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to fetch dynamic locations', err);
        setLocationList([]);
      }
    };
    fetchLocationsList();
  }, []);

  // Fetch map analytics data with active filters
  const fetchMapData = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await api.get(`/analytics/map${queryString}`);
      setLocationsData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load location intelligence data:', err);
      setError(err?.response?.data?.message || 'Unable to load location intelligence data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData(activeFilters);
  }, [fetchMapData, activeFilters]);

  // Handle filter changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    if (filterInputs.startDate && filterInputs.endDate) {
      if (new Date(filterInputs.startDate) > new Date(filterInputs.endDate)) {
        alert('Date From cannot be later than Date To.');
        return;
      }
    }
    setActiveFilters({ ...filterInputs });
  };

  const handleResetFilters = () => {
    const resetValues = { startDate: '', endDate: '', location: '', wasteType: '' };
    setFilterInputs(resetValues);
    setActiveFilters({});
  };

  // Filter out locations that have valid coordinates for map rendering
  const mappedMarkers = useMemo(() => {
    return locationsData.filter(
      (loc) =>
        loc.hasCoordinates &&
        typeof loc.latitude === 'number' &&
        typeof loc.longitude === 'number' &&
        !isNaN(loc.latitude) &&
        !isNaN(loc.longitude)
    );
  }, [locationsData]);

  // Style helpers
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444'; // Red
      case 'MEDIUM':
        return '#f59e0b'; // Amber
      case 'LOW':
      default:
        return '#10b981'; // Emerald
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800';
      case 'LOW':
      default:
        return 'bg-emerald-100 text-emerald-800';
    }
  };

  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Waste Management Monitoring Map</h2>
        <p className="mt-1 text-sm text-gray-500">
          Geospatial waste distribution, collection density, and municipal priority monitoring.
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date From
            </label>
            <input
              type="date"
              name="startDate"
              value={filterInputs.startDate}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date To
            </label>
            <input
              type="date"
              name="endDate"
              value={filterInputs.endDate}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Location
            </label>
            <select
              name="location"
              value={filterInputs.location}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            >
              <option value="">All Locations</option>
              {locationList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Waste Type
            </label>
            <select
              name="wasteType"
              value={filterInputs.wasteType}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            >
              <option value="">All Types</option>
              {WASTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              title="Reset Filters"
            >
              <RotateCcw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => fetchMapData(activeFilters)}
                className="mt-2 md:mt-0 text-sm font-semibold text-red-800 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Waste Map Container */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Geospatial Collection Density</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Marker radius represents total waste volume; color indicates risk priority tier.
            </p>
          </div>

          {/* 3. Map Legend */}
          <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 text-xs">
            <span className="font-semibold text-gray-700 uppercase tracking-wider">Level:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm"></span>
              <span className="font-medium text-gray-700">HIGH (&gt;1,000 KG)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
              <span className="font-medium text-gray-700">MEDIUM (500-1,000 KG)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
              <span className="font-medium text-gray-700">LOW (≤500 KG)</span>
            </div>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="h-[520px] w-full rounded-lg overflow-hidden border border-gray-200 relative bg-gray-100">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-sm font-medium">Loading geospatial telemetry...</p>
            </div>
          ) : mappedMarkers.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-2">
              <MapIcon className="h-12 w-12 stroke-1 text-gray-300" />
              <h4 className="text-base font-medium text-gray-700">No Geographic Data Available</h4>
              <p className="text-sm max-w-md text-gray-500">
                No geographic location data is available for the selected filters, or coordinates are not yet configured for registered zones.
              </p>
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBoundsUpdater markers={mappedMarkers} />

              {mappedMarkers.map((loc) => {
                const markerRadius = Math.max(12, Math.min(35, Math.sqrt(loc.quantity || 1) * 1.2));
                const color = getPriorityColor(loc.priority);

                return (
                  <CircleMarker
                    key={loc.location}
                    center={[loc.latitude, loc.longitude]}
                    radius={markerRadius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.65,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans min-w-[200px]">
                        <div className="border-b border-gray-200 pb-2 mb-2">
                          <h4 className="font-bold text-gray-900 text-base">{loc.name}</h4>
                          <span className="text-xs text-gray-500">{loc.areaType} Zone</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-700">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Waste Collected:</span>
                            <span className="font-bold text-gray-900">{formatKG(loc.quantity)} KG</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Collections Count:</span>
                            <span className="font-semibold text-gray-900">{loc.recordCount} entries</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Avg / Collection:</span>
                            <span className="font-semibold text-gray-900">{formatKG(loc.avgQuantity)} KG</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                            <span className="text-gray-500">Priority:</span>
                            <span
                              className={`px-2 py-0.5 font-bold rounded text-[10px] ${getPriorityBadgeClass(
                                loc.priority
                              )}`}
                            >
                              {loc.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* 4. Location Analysis Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Location Intelligence &amp; Telemetry</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Detailed breakdown of municipal zones, collection volumes, and geospatial readiness.
            </p>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {locationsData.length} Locations Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Zone Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Waste Collected
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Collections
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Geographic Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : locationsData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                    No location data available for the selected filters.
                  </td>
                </tr>
              ) : (
                locationsData.map((loc) => (
                  <tr key={loc.location} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {loc.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loc.areaType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatKG(loc.quantity)} KG
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loc.recordCount} entries
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {loc.hasCoordinates ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          <MapPin className="h-3 w-3 mr-1 text-emerald-600" />
                          {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                          <Info className="h-3 w-3 mr-1 text-gray-400" />
                          Location coordinates unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getPriorityBadgeClass(
                          loc.priority
                        )}`}
                      >
                        {loc.priority}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
