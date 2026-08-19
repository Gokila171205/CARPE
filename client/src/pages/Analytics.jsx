import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  MapPin,
  Activity,
  Layers,
  Calendar,
  Filter,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6b7280'  // gray-500
];

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

export default function Analytics() {
  // Filter states
  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  // Locations dropdown list
  const [locationList, setLocationList] = useState([]);

  // Data states
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [growth, setGrowth] = useState(null);

  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available locations for the filter dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get('/locations');
        if (Array.isArray(data)) {
          setLocationList(data.map((l) => (typeof l === 'string' ? l : l.name)));
        }
      } catch (err) {
        console.error('Failed to fetch dynamic locations', err);
        setLocationList([]);
      }
    };
    fetchLocations();
  }, []);

  // Fetch all analytics data based on active filters
  const fetchAnalyticsData = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const [summaryRes, trendsRes, categoriesRes, locationsRes, growthRes] = await Promise.all([
        api.get(`/analytics/summary${queryString}`),
        api.get(`/analytics/trends${queryString}`),
        api.get(`/analytics/categories${queryString}`),
        api.get(`/analytics/locations${queryString}`),
        api.get(`/analytics/growth${queryString}`)
      ]);

      setSummary(summaryRes.data);
      setTrends(Array.isArray(trendsRes.data) ? trendsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      setGrowth(growthRes.data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err?.response?.data?.message || 'Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData(activeFilters);
  }, [fetchAnalyticsData, activeFilters]);

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

  // Helper formatting functions
  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatDateRange = (isoString) => {
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

  const hasData = summary && summary.totalWaste > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Analytics &amp; Decision Intelligence</h2>
        <p className="mt-1 text-sm text-gray-500">
          Municipal waste collection telemetry, operational trends, and resource recovery metrics.
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date From
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={filterInputs.startDate}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date To
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={filterInputs.endDate}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
              />
            </div>
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

      {/* Error Alert */}
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
                onClick={() => fetchAnalyticsData(activeFilters)}
                className="mt-2 md:mt-0 text-sm font-semibold text-red-800 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Six KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1: Total Waste */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-emerald-50 rounded-md">
                <Trash2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  Total Waste
                </dt>
                <dd className="mt-1 flex items-baseline">
                  {loading ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">{formatKG(summary?.totalWaste)} KG</span>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Average Daily Waste */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-md">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  Avg Daily Waste
                </dt>
                <dd className="mt-1 flex items-baseline">
                  {loading ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">
                      {formatKG(summary?.averageDailyWaste)} KG/d
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Waste Growth */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 p-2 rounded-md ${
                  (summary?.growthPercentage || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                {(summary?.growthPercentage || 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  Waste Growth
                </dt>
                <dd className="mt-1 flex items-baseline">
                  {loading ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <span
                      className={`text-xl font-bold ${
                        (summary?.growthPercentage || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {(summary?.growthPercentage || 0) >= 0 ? '+' : ''}
                      {summary?.growthPercentage || 0}%
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Recyclable Waste */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-purple-50 rounded-md">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  Recyclable
                </dt>
                <dd className="mt-1 flex flex-col">
                  {loading ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-gray-900">
                        {formatKG(summary?.recyclableWaste || summary?.recyclable)} KG
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {summary?.recyclablePercentage || 0}% of total
                      </span>
                    </>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 5: Top Waste Location */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-amber-50 rounded-md">
                <MapPin className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  Top Location
                </dt>
                <dd className="mt-1 flex flex-col">
                  {loading ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-gray-900 truncate">
                        {summary?.highestWasteLocation?.name || summary?.topArea?.name || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatKG(summary?.highestWasteLocation?.total || summary?.topArea?.total)} KG
                      </span>
                    </>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 6: Top Waste Category */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-teal-50 rounded-md">
                <Layers className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  Top Category
                </dt>
                <dd className="mt-1 flex flex-col">
                  {loading ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-gray-900 truncate">
                        {summary?.highestWasteCategory?.name || summary?.topCategory?.name || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatKG(summary?.highestWasteCategory?.total || summary?.topCategory?.total)} KG
                      </span>
                    </>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Trends & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Waste Trend Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Waste Collection Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily aggregated volume over time (KG)</p>
            </div>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : trends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <Calendar className="h-10 w-10 mb-2 stroke-1 text-gray-300" />
                <p>No collection trend records found for the selected period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${formatKG(val)} KG`, 'Collected']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="waste"
                    name="Waste (KG)"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#059669' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Waste Category Breakdown Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Waste Categories Distribution</h3>
              <p className="text-xs text-gray-500 mt-0.5">Breakdown by material classification</p>
            </div>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <Layers className="h-10 w-10 mb-2 stroke-1 text-gray-300" />
                <p>No category data available for the selected period.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col sm:flex-row items-center justify-between">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categories.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name || index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px'
                        }}
                        formatter={(val, name, item) => [
                          `${formatKG(val)} KG (${item.payload.percentage || 0}%)`,
                          item.payload.name || name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend Listing */}
                <div className="w-full sm:w-1/2 pl-0 sm:pl-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.name || idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center min-w-0 pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        ></span>
                        <span className="font-medium text-gray-700 truncate">{cat.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-gray-900">{formatKG(cat.value || cat.total)} KG</span>
                        <span className="text-gray-500 ml-1.5 font-normal">({cat.percentage || 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Location Analysis & 6. Growth Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Location Analysis Table (2 Cols on Large screens) */}
        <div className="lg:col-span-2 bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Location-Wise Collection Analysis</h3>
              <p className="text-xs text-gray-500 mt-0.5">Waste volumes and collection intensity by zone</p>
            </div>
            <span className="text-xs text-gray-500 font-medium">{locations.length} Zones tracked</span>
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
                    Total Collected
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Share of Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Avg / Entry
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
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                      No location data available for the selected filters.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => {
                    const totalWasteAll = summary?.totalWaste || 1;
                    const sharePct = summary?.totalWaste
                      ? Math.round((loc.total / totalWasteAll) * 100)
                      : 0;

                    return (
                      <tr key={loc.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loc.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatKG(loc.total)} KG
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, sharePct))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{sharePct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatKG(loc.averagePerRecord)} KG
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              loc.status === 'High'
                                ? 'bg-red-100 text-red-800'
                                : loc.status === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {loc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Growth Comparison Card (1 Col on Large screens) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900">Growth Intelligence</h3>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  growth?.trend === 'increasing'
                    ? 'bg-emerald-100 text-emerald-800'
                    : growth?.trend === 'decreasing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {growth?.trend ? growth.trend.toUpperCase() : 'STABLE'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Period-over-period comparative operational performance.
            </p>

            {loading ? (
              <div className="space-y-4 py-4">
                <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Period */}
                <div className="p-3.5 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-semibold uppercase tracking-wider text-gray-700">
                      Current Period
                    </span>
                    <span>
                      {formatDateRange(growth?.currentPeriod?.startDate)} –{' '}
                      {formatDateRange(growth?.currentPeriod?.endDate)}
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {formatKG(growth?.currentPeriod?.totalWaste)} KG
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({growth?.currentPeriod?.recordCount || 0} entries)
                    </span>
                  </div>
                </div>

                {/* Previous Period */}
                <div className="p-3.5 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="font-semibold uppercase tracking-wider text-gray-700">
                      Previous Period
                    </span>
                    <span>
                      {formatDateRange(growth?.previousPeriod?.startDate)} –{' '}
                      {formatDateRange(growth?.previousPeriod?.endDate)}
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {formatKG(growth?.previousPeriod?.totalWaste)} KG
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({growth?.previousPeriod?.recordCount || 0} entries)
                    </span>
                  </div>
                </div>

                {/* Growth Metric Box */}
                <div className="p-4 bg-emerald-50 rounded-md border border-emerald-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Net Growth
                      </span>
                      <div className="text-2xl font-bold text-emerald-900 mt-0.5">
                        {(growth?.growthPercentage || 0) >= 0 ? '+' : ''}
                        {growth?.growthPercentage || 0}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-emerald-700">Absolute Change</span>
                      <div className="text-sm font-semibold text-emerald-900 mt-0.5">
                        {(growth?.absoluteChange || 0) >= 0 ? '+' : ''}
                        {formatKG(growth?.absoluteChange)} KG
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5 flex-shrink-0" />
            <span>Values computed dynamically from verified waste collection records.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
