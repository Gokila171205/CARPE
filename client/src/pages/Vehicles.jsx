import { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus,
  Search,
  Trash,
  Truck,
  History,
  MapPin,
  Scale,
  Calendar,
  X,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function Vehicles() {
  const { t, translateWasteType, language } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Selected vehicle for detailed history drawer
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState(null);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'Collection Truck',
    capacity: 2000,
    status: 'Active',
    assignedArea: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch vehicles', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/vehicles/${vehicle._id}/collections`);
      setVehicleHistory(data);
    } catch (err) {
      console.error('Failed to fetch vehicle history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(t('common.delete') + '?')) {
      try {
        await api.delete(`/vehicles/${id}`);
        if (selectedVehicle?._id === id) {
          setSelectedVehicle(null);
          setVehicleHistory(null);
        }
        fetchVehicles();
      } catch (error) {
        console.error('Failed to delete vehicle', error);
      }
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', formData);
      setShowAddModal(false);
      setFormData({
        vehicleNumber: '',
        vehicleType: 'Collection Truck',
        capacity: 2000,
        status: 'Active',
        assignedArea: ''
      });
      fetchVehicles();
    } catch (error) {
      alert(error?.response?.data?.message || t('common.error'));
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const term = search.toLowerCase();
    return (
      v.vehicleNumber?.toLowerCase().includes(term) ||
      v.vehicleType?.toLowerCase().includes(term) ||
      v.assignedArea?.toLowerCase().includes(term)
    );
  });

  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return t('common.noCollectionsFound');
    try {
      return new Date(isoStr).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="govt-section-header text-base uppercase tracking-wide">
            {t('vehicles.pageTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('vehicles.pageSubtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              placeholder={t('common.searchPlaceholder')}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-xs text-xs font-bold rounded text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-[#003366]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('vehicles.registerVehicleBtn')}
          </button>
        </div>
      </div>

      {/* Fleet Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center text-[11px] font-bold text-slate-600 uppercase">
            <Truck className="h-4 w-4 mr-1.5 text-[#003366]" />
            {t('vehicles.statTotalFleet')}
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{vehicles.length}</p>
        </div>

        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center text-[11px] font-bold text-slate-600 uppercase">
            <History className="h-4 w-4 mr-1.5 text-[#003366]" />
            {t('vehicles.statTotalTrips')}
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {vehicles.reduce((acc, v) => acc + (v.totalCollections || 0), 0)}
          </p>
        </div>

        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center text-[11px] font-bold text-slate-600 uppercase">
            <Scale className="h-4 w-4 mr-1.5 text-[#003366]" />
            {t('vehicles.statTotalVolume')}
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatKG(vehicles.reduce((acc, v) => acc + (v.totalWaste || 0), 0))} KG
          </p>
        </div>

        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center text-[11px] font-bold text-slate-600 uppercase">
            <Layers className="h-4 w-4 mr-1.5 text-emerald-700" />
            {t('vehicles.statActiveUnits')}
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {vehicles.filter((v) => v.status === 'Active').length}
          </p>
        </div>
      </div>

      {/* Vehicles Table List with Aggregated Collection Stats */}
      <div className="bg-white border-2 border-slate-300 rounded-sm shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wide">
            {t('vehicles.tableHeading')} ({filteredVehicles.length})
          </span>
          <span className="text-slate-500">{t('vehicles.tableSubtitle')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="govt-table">
            <thead>
              <tr>
                <th>{t('vehicles.colVehicleNo')}</th>
                <th>{t('vehicles.colType')} &amp; {t('vehicles.colCapacity')}</th>
                <th>{t('vehicles.colTrips')}</th>
                <th>{t('vehicles.colTotalWaste')}</th>
                <th>{t('vehicles.colArea')}</th>
                <th>{t('common.date')}</th>
                <th style={{ width: '130px', textAlign: 'right' }}>{t('vehicles.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                    <Truck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    {t('common.noVehiclesFound')}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    onClick={() => handleSelectVehicle(vehicle)}
                    className={`cursor-pointer transition-colors ${
                      selectedVehicle?._id === vehicle._id ? '!bg-blue-50' : ''
                    }`}
                  >
                    <td>
                      <div className="font-mono font-bold text-slate-900">{vehicle.vehicleNumber}</div>
                      <span
                        className={`mt-1 inline-flex text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                          vehicle.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : vehicle.status === 'Maintenance'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {vehicle.status === 'Active' ? t('common.active') : vehicle.status === 'Maintenance' ? t('common.maintenance') : t('common.inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{vehicle.vehicleType}</div>
                      <div className="text-[11px] text-slate-500">{formatKG(vehicle.capacity)} KG</div>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900">{vehicle.totalCollections || 0}</span>
                    </td>
                    <td className="font-bold text-slate-900">
                      {formatKG(vehicle.totalWaste)} KG
                    </td>
                    <td className="text-slate-600 text-xs">
                      {vehicle.locationsCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#003366] flex-shrink-0" />
                          <span>
                            {vehicle.locationsCount} ({vehicle.locationsCovered?.slice(0, 2).join(', ')}
                            {vehicle.locationsCovered?.length > 2 ? '...' : ''})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(vehicle.lastCollectionDate)}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSelectVehicle(vehicle)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded text-[#003366] bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        >
                          {t('common.viewDetails')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(vehicle._id, e)}
                          className="text-red-700 hover:text-red-900 p-1"
                          title={t('common.delete')}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Vehicle Activity Detail Panel */}
      {selectedVehicle && (
        <div className="bg-white border-2 border-[#003366] rounded-sm shadow-xs overflow-hidden">
          <div className="bg-[#003366] text-white px-5 py-3.5 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                {selectedVehicle.vehicleNumber}
              </span>
              <h3 className="text-base font-black text-white mt-0.5">
                {t('vehicles.drawerTitle')}
              </h3>
            </div>
            <button
              onClick={() => {
                setSelectedVehicle(null);
                setVehicleHistory(null);
              }}
              className="text-slate-300 hover:text-white p-1 rounded"
              title={t('vehicles.closeDrawer')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {historyLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">{t('common.loading')}</div>
            ) : !vehicleHistory || !vehicleHistory.collections || vehicleHistory.collections.length === 0 ? (
              <div className="p-6 text-center text-slate-600 bg-slate-50 border border-slate-200 rounded">
                <AlertCircle className="h-7 w-7 text-slate-400 mx-auto mb-1" />
                <p className="font-bold text-xs text-slate-800">{t('common.noCollectionsFound')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-xs bg-slate-50 p-3.5 rounded border border-slate-200 justify-between items-center">
                  <div>
                    <span className="text-slate-500">{t('vehicles.colTrips')}:</span>
                    <span className="ml-1 font-bold text-slate-900">{vehicleHistory.collections.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('vehicles.colTotalWaste')}:</span>
                    <span className="ml-1 font-bold text-[#003366]">{formatKG(vehicleHistory.vehicle.totalWaste)} KG</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('vehicles.colArea')}:</span>
                    <span className="ml-1 font-bold text-slate-900">{vehicleHistory.vehicle.locationsCovered?.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('common.wasteType')}:</span>
                    <span className="ml-1 font-bold text-slate-900">
                      {vehicleHistory.vehicle.wasteTypes?.map((wt) => translateWasteType(wt)).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="govt-table">
                    <thead>
                      <tr>
                        <th>{t('collections.colDate')}</th>
                        <th>{t('collections.colLocation')}</th>
                        <th>{t('collections.colStream')}</th>
                        <th>{t('collections.colQuantity')}</th>
                        <th>{t('collections.colCollector')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleHistory.collections.map((item) => (
                        <tr key={item._id}>
                          <td className="font-medium text-slate-900">
                            {formatDate(item.collectedAt)}
                          </td>
                          <td className="font-bold text-slate-900">{item.location}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                              {translateWasteType(item.wasteType)}
                            </span>
                          </td>
                          <td className="font-bold text-slate-900">{formatKG(item.quantity)} KG</td>
                          <td className="text-slate-600">{item.collector || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-400 rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase">{t('vehicles.modalTitle')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  {t('vehicles.labelVehicleNumber')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('vehicles.placeholderVehicleNumber')}
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  className="block w-full border border-slate-300 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  {t('vehicles.labelVehicleType')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="block w-full border border-slate-300 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                >
                  <option value="Collection Truck">Collection Truck (Standard 2T)</option>
                  <option value="Mini Truck">Mini Truck / Tipper</option>
                  <option value="Heavy Truck">Heavy Compactor (5T+)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  {t('vehicles.labelCapacity')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="block w-full border border-slate-300 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  {t('vehicles.labelAssignedArea')}
                </label>
                <input
                  type="text"
                  placeholder={t('vehicles.placeholderAssignedArea')}
                  value={formData.assignedArea}
                  onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                  className="block w-full border border-slate-300 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  {t('vehicles.labelInitialStatus')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="block w-full border border-slate-300 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                >
                  <option value="Active">{t('common.active')}</option>
                  <option value="Maintenance">{t('common.maintenance')}</option>
                  <option value="Inactive">{t('common.inactive')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded font-bold shadow-xs"
                >
                  {t('vehicles.registerSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

