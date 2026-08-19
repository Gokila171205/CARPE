import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  BrainCircuit,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Layers,
  ShieldAlert,
  Info,
  Scale
} from 'lucide-react';

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

export default function AIInsights() {
  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });

  const [locationList, setLocationList] = useState([]);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
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

  // Generate AI Insights on command
  const generateInsights = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await api.post(`/ai/insights${queryString}`, filters);
      setInsightsData(res.data);
      setInitialLoaded(true);
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
      setError(err?.response?.data?.message || 'AI insights could not be generated at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate on initial load
  useEffect(() => {
    generateInsights({});
  }, [generateInsights]);

  // Handle filter changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateClick = (e) => {
    e.preventDefault();
    if (filterInputs.startDate && filterInputs.endDate) {
      if (new Date(filterInputs.startDate) > new Date(filterInputs.endDate)) {
        alert('Date From cannot be later than Date To.');
        return;
      }
    }
    generateInsights(filterInputs);
  };

  const handleReset = () => {
    const resetValues = { startDate: '', endDate: '', location: '', wasteType: '' };
    setFilterInputs(resetValues);
    generateInsights({});
  };

  const evidence = insightsData?.evidence;
  const insightsList = insightsData?.insights || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-900">AI Decision Intelligence</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
              Decision Support
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Synthesized operational intelligence, anomaly analysis, and policy recommendations.
          </p>
        </div>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleGenerateClick} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
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
              <BrainCircuit className="h-4 w-4 mr-1.5" />
              Generate Insights
            </button>
            <button
              type="button"
              onClick={handleReset}
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
                onClick={() => generateInsights(filterInputs)}
                className="mt-2 md:mt-0 text-sm font-semibold text-red-800 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Structured Evidence Panel */}
      {evidence && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Telemetry Evidence Analyzed
              </h3>
            </div>
            <span className="text-xs text-gray-500">
              {evidence.summary?.totalRecordCount || 0} Records Processed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <span className="text-gray-500 font-medium">Monitored Volume:</span>
              <p className="text-base font-bold text-gray-900 mt-0.5">
                {(evidence.summary?.totalWasteKG || 0).toLocaleString()} KG
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <span className="text-gray-500 font-medium">Period Growth:</span>
              <p
                className={`text-base font-bold mt-0.5 ${
                  (evidence.growth?.growthPercentage || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {(evidence.growth?.growthPercentage || 0) > 0 ? '+' : ''}
                {evidence.growth?.growthPercentage || 0}%
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <span className="text-gray-500 font-medium">Peak Zone:</span>
              <p className="text-base font-bold text-gray-900 mt-0.5 truncate">
                {evidence.summary?.highestWasteLocation || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <span className="text-gray-500 font-medium">Dominant Stream:</span>
              <p className="text-base font-bold text-gray-900 mt-0.5 truncate">
                {evidence.summary?.highestWasteCategory || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Generated Decision Intelligence Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
            <h4 className="text-base font-semibold text-gray-900">Analyzing Waste-Management Data...</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Evaluating period variance, material distribution, and location density for decision support.
            </p>
          </div>
        ) : !initialLoaded ? (
          <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200 space-y-3">
            <BrainCircuit className="h-12 w-12 text-gray-300 mx-auto stroke-1" />
            <h4 className="text-base font-semibold text-gray-700">Ready to Generate Insights</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Select date ranges and municipal filters, then click Generate Insights to produce AI decision analysis.
            </p>
          </div>
        ) : insightsList.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-semibold text-gray-900">No Significant Action Items</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No anomalous volume concentrations or operational bottlenecks were detected for the selected period.
            </p>
          </div>
        ) : (
          insightsList.map((insight, idx) => {
            const isHigh = insight.priority === 'HIGH';
            const isMedium = insight.priority === 'MEDIUM';

            return (
              <div
                key={idx}
                className={`bg-white rounded-lg shadow-sm border p-6 space-y-4 transition-all ${
                  isHigh
                    ? 'border-red-200'
                    : isMedium
                    ? 'border-amber-200'
                    : 'border-emerald-200'
                }`}
              >
                {/* Header: Priority & Engine Tag */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                        isHigh
                          ? 'bg-red-100 text-red-800'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {insight.priority} PRIORITY
                    </span>
                    {insight.affectedLocation && (
                      <span className="text-xs font-medium text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-0.5 text-gray-400" />
                        {insight.affectedLocation}
                      </span>
                    )}
                    {insight.affectedWasteType && (
                      <span className="text-xs font-medium text-gray-600 flex items-center">
                        <Layers className="h-3 w-3 mr-0.5 text-gray-400" />
                        {insight.affectedWasteType}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {insight.engine || 'Decision Support Engine'}
                  </span>
                </div>

                {/* Title & Observation */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{insight.observation}</p>
                </div>

                {/* Evidence Metrics Box */}
                {insight.evidence && (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100 text-xs flex flex-wrap gap-4">
                    {insight.evidence.currentWaste && (
                      <div>
                        <span className="text-gray-500 font-medium">Observed: </span>
                        <strong className="text-gray-900">{insight.evidence.currentWaste}</strong>
                      </div>
                    )}
                    {insight.evidence.previousWaste && (
                      <div>
                        <span className="text-gray-500 font-medium">Previous: </span>
                        <strong className="text-gray-900">{insight.evidence.previousWaste}</strong>
                      </div>
                    )}
                    {insight.evidence.growth && (
                      <div>
                        <span className="text-gray-500 font-medium">Growth Variance: </span>
                        <strong className="text-red-700">{insight.evidence.growth}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis / Reasoning */}
                {insight.analysis && (
                  <div className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                    <span className="font-semibold text-gray-700">Analytical Reasoning: </span>
                    {insight.analysis}
                  </div>
                )}

                {/* Recommendation Box */}
                {insight.recommendation && (
                  <div className="p-4 bg-emerald-50 rounded-md border border-emerald-100 flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        Recommended Action
                      </h4>
                      <p className="text-sm font-medium text-emerald-950 mt-0.5">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Professional AI Disclaimer */}
      <div className="p-4 bg-gray-100 rounded-md border border-gray-200 flex items-center space-x-3 text-xs text-gray-500">
        <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <p>
          AI-generated insights are decision-support recommendations based on available waste-management data. Final operational decisions should be reviewed by authorized personnel.
        </p>
      </div>
    </div>
  );
}
