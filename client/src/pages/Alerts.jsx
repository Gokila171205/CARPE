import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Filter,
  RotateCcw,
  Bell,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

export default function Alerts() {
  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  const [locationList, setLocationList] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations for filter dropdown
  useEffect(() => {
    const fetchLocations = async () => {
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
    fetchLocations();
  }, []);

  // Fetch alerts with active filters
  const fetchAlerts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const { data } = await api.get(`/alerts${queryString}`);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err?.response?.data?.message || 'Unable to load waste-management alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(activeFilters);
  }, [fetchAlerts, activeFilters]);

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

  const resolveAlert = async (id) => {
    try {
      await api.put(`/alerts/${id}/resolve`);
      // Update state locally
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'RESOLVED' } : a))
      );
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  // Summary counts calculated from real alerts
  const summaryCounts = useMemo(() => {
    const total = alerts.length;
    const high = alerts.filter((a) => a.priority === 'HIGH').length;
    const medium = alerts.filter((a) => a.priority === 'MEDIUM').length;
    const low = alerts.filter((a) => a.priority === 'LOW').length;
    return { total, high, medium, low };
  }, [alerts]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Waste Management Alerts</h2>
        <p className="mt-1 text-sm text-gray-500">
          Operational risk detection, anomalous waste spikes, and decision intelligence recommendations.
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
                onClick={() => fetchAlerts(activeFilters)}
                className="mt-2 md:mt-0 text-sm font-semibold text-red-800 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Alert Statistics Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Alerts */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-gray-100 rounded-md">
              <Bell className="h-6 w-6 text-gray-700" />
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Alerts</dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">
                {loading ? <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div> : summaryCounts.total}
              </dd>
            </div>
          </div>
        </div>

        {/* Card 2: High Priority */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-red-50 rounded-md">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-xs font-semibold text-red-600 uppercase tracking-wider">High Priority</dt>
              <dd className="mt-1 text-2xl font-bold text-red-700">
                {loading ? <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div> : summaryCounts.high}
              </dd>
            </div>
          </div>
        </div>

        {/* Card 3: Medium Priority */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-amber-50 rounded-md">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Medium Priority</dt>
              <dd className="mt-1 text-2xl font-bold text-amber-700">
                {loading ? <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div> : summaryCounts.medium}
              </dd>
            </div>
          </div>
        </div>

        {/* Card 4: Low Priority */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-emerald-50 rounded-md">
              <Info className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4 flex-1">
              <dt className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Low Priority</dt>
              <dd className="mt-1 text-2xl font-bold text-emerald-700">
                {loading ? <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div> : summaryCounts.low}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alerts Listing */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">All Operations Normal</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              No significant waste-management alerts were detected for the selected period.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isHigh = alert.priority === 'HIGH';
            const isMedium = alert.priority === 'MEDIUM';

            return (
              <div
                key={alert._id}
                className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
                  isHigh
                    ? 'border-red-200 hover:border-red-300'
                    : isMedium
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  {/* Left: Priority Badge & Title */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide uppercase ${
                          isHigh
                            ? 'bg-red-100 text-red-800'
                            : isMedium
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {alert.priority} PRIORITY
                      </span>
                      <span className="text-xs text-gray-400">&bull;</span>
                      <span className="text-xs font-medium text-gray-500">
                        {alert.location} {alert.wasteType && alert.wasteType !== 'All Types' ? `(${alert.wasteType})` : ''}
                      </span>
                      <span className="text-xs text-gray-400">&bull;</span>
                      <span className="text-xs text-gray-500">{formatDate(alert.detectedAt)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{alert.message}</p>
                  </div>

                  {/* Right: Resolve Button / Status */}
                  <div className="flex items-center gap-2">
                    {alert.status === 'ACTIVE' ? (
                      <button
                        onClick={() => resolveAlert(alert._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Resolve Alert
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantitative Data Metrics Banner */}
                {(alert.currentQuantity != null || alert.growthPercentage != null) && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-md border border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">Observed Current:</span>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {alert.currentQuantity?.toLocaleString()} KG
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Previous Period:</span>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {alert.previousQuantity != null ? `${alert.previousQuantity.toLocaleString()} KG` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Observed Growth / Variance:</span>
                      <p
                        className={`text-sm font-bold mt-0.5 ${
                          (alert.growthPercentage || 0) > 0 ? 'text-red-700' : 'text-gray-900'
                        }`}
                      >
                        {alert.growthPercentage != null
                          ? `${alert.growthPercentage > 0 ? '+' : ''}${alert.growthPercentage}%`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommendation Banner */}
                {alert.recommendation && (
                  <div className="mt-3.5 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start space-x-2.5">
                    <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900">
                      <span className="font-semibold">Recommended Action: </span>
                      <span>{alert.recommendation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
