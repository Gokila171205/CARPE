import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  RotateCcw,
  AlertCircle,
  Map as MapIcon,
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
  const { t, translateWasteType, translatePriority, language } = useLanguage();

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
        return 'bg-red-50 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'LOW':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN', { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
        <h2 className="govt-section-header text-base uppercase tracking-wide">
          {t('map.pageTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('map.pageSubtitle')}
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-sm shadow-xs border-2 border-slate-300">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.dateFrom')}
            </label>
            <input
              type="date"
              name="startDate"
              value={filterInputs.startDate}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.dateTo')}
            </label>
            <input
              type="date"
              name="endDate"
              value={filterInputs.endDate}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.locationFilter')}
            </label>
            <select
              name="location"
              value={filterInputs.location}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            >
              <option value="">{t('analytics.allLocations')}</option>
              {locationList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.wasteTypeFilter')}
            </label>
            <select
              name="wasteType"
              value={filterInputs.wasteType}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            >
              <option value="">{t('analytics.allTypes')}</option>
              {WASTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {translateWasteType(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-xs text-xs font-bold rounded text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-[#003366] disabled:opacity-50"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {t('analytics.applyFilters')}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className="inline-flex justify-center items-center px-3 py-2 border border-slate-300 shadow-xs text-xs font-bold rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none disabled:opacity-50"
              title={t('analytics.resetFilters')}
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded bg-red-50 p-4 border border-red-200 text-xs">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="font-medium text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => fetchMapData(activeFilters)}
                className="mt-2 md:mt-0 font-bold text-red-800 hover:underline"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Waste Map Container */}
      <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('map.cardTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('map.cardSubtitle')}
            </p>
          </div>

          {/* 3. Map Legend */}
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded border border-slate-300 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">{t('map.legendTitle')}:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-xs"></span>
              <span className="font-bold text-slate-700">{t('map.legendHigh')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>
              <span className="font-bold text-slate-700">{t('map.legendMedium')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
              <span className="font-bold text-slate-700">{t('map.legendLow')}</span>
            </div>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="h-[520px] w-full rounded overflow-hidden border border-slate-300 relative bg-slate-100">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 space-y-2 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
              <p className="font-bold">{t('common.loading')}</p>
            </div>
          ) : mappedMarkers.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2 text-xs">
              <MapIcon className="h-10 w-10 stroke-1 text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">{t('map.noDataTitle')}</h4>
              <p className="max-w-md text-slate-500">
                {t('map.noDataDesc')}
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
                        <div className="border-b border-slate-200 pb-2 mb-2">
                          <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                          <span className="text-xs text-slate-500">{loc.areaType}</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t('map.thTotalCollected')}:</span>
                            <span className="font-bold text-slate-900">{formatKG(loc.quantity)} KG</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t('map.thCollections')}:</span>
                            <span className="font-semibold text-slate-900">{loc.recordCount} entries</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Avg / Collection:</span>
                            <span className="font-semibold text-slate-900">{formatKG(loc.avgQuantity)} KG</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-slate-500">{t('map.thPriority')}:</span>
                            <span
                              className={`px-2 py-0.5 font-bold rounded text-[10px] uppercase border ${getPriorityBadgeClass(
                                loc.priority
                              )}`}
                            >
                              {translatePriority(loc.priority)}
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
      <div className="bg-white shadow-xs overflow-hidden rounded-sm border-2 border-slate-300">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('map.tableTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('map.tableSubtitle')}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {locationsData.length} {t('analytics.allLocations')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="govt-table">
            <thead>
              <tr>
                <th>{t('map.thLocation')}</th>
                <th>{t('map.thZoneType')}</th>
                <th>{t('map.thTotalCollected')}</th>
                <th>{t('map.thCollections')}</th>
                <th>{t('map.thStatus')}</th>
                <th style={{ textAlign: 'right' }}>{t('map.thPriority')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 text-xs">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : locationsData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 text-xs">
                    {t('common.noRecordsFound')}
                  </td>
                </tr>
              ) : (
                locationsData.map((loc) => (
                  <tr key={loc.location}>
                    <td className="font-bold text-slate-900">{loc.name}</td>
                    <td className="text-slate-600">{loc.areaType}</td>
                    <td className="font-bold text-slate-900">{formatKG(loc.quantity)} KG</td>
                    <td className="text-slate-600">{loc.recordCount} entries</td>
                    <td className="text-xs text-slate-500">
                      {loc.hasCoordinates ? (
                        <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">
                          <MapPin className="h-3 w-3 mr-1 text-emerald-600" />
                          {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Info className="h-3 w-3 mr-1 text-slate-400" />
                          Coordinates unavailable
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <span
                        className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded uppercase border ${getPriorityBadgeClass(
                          loc.priority
                        )}`}
                      >
                        {translatePriority(loc.priority)}
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

