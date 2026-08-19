import { useState, useEffect } from 'react';
import api from '../services/api';
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
    if (window.confirm('Are you sure you want to remove this vehicle?')) {
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
      alert(error?.response?.data?.message || 'Failed to add vehicle');
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
    if (!isoStr) return 'No collections';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading vehicles...</div>;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Search vehicles..."
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add Vehicle
        </button>
      </div>

      {/* Fleet Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-xs font-semibold text-gray-500 uppercase">
            <Truck className="h-4 w-4 mr-1.5 text-emerald-600" />
            Total Fleet
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">{vehicles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-xs font-semibold text-gray-500 uppercase">
            <History className="h-4 w-4 mr-1.5 text-blue-600" />
            Total Collections
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {vehicles.reduce((acc, v) => acc + (v.totalCollections || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-xs font-semibold text-gray-500 uppercase">
            <Scale className="h-4 w-4 mr-1.5 text-indigo-600" />
            Total Transported
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {formatKG(vehicles.reduce((acc, v) => acc + (v.totalWaste || 0), 0))} KG
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-xs font-semibold text-gray-500 uppercase">
            <Layers className="h-4 w-4 mr-1.5 text-amber-600" />
            Active Fleet
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {vehicles.filter((v) => v.status === 'Active').length}
          </p>
        </div>
      </div>

      {/* Vehicles Table List with Aggregated Collection Stats */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Vehicle / ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type &amp; Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Collections Logged
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Waste Hauled
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Locations Visited
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 text-sm">
                    <Truck className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    No vehicles registered or matching search.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    onClick={() => handleSelectVehicle(vehicle)}
                    className={`cursor-pointer transition-colors ${
                      selectedVehicle?._id === vehicle._id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{vehicle.vehicleNumber}</div>
                      <span
                        className={`mt-1 inline-flex text-[10px] px-2 py-0.5 rounded font-medium ${
                          vehicle.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : vehicle.status === 'Maintenance'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {vehicle.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{vehicle.vehicleType}</div>
                      <div className="text-xs text-gray-500">{formatKG(vehicle.capacity)} KG capacity</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{vehicle.totalCollections || 0}</span>
                      <span className="text-xs text-gray-500 ml-1">trips</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      {formatKG(vehicle.totalWaste)} KG
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs">
                      {vehicle.locationsCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          <span>
                            {vehicle.locationsCount} zones ({vehicle.locationsCovered?.slice(0, 2).join(', ')}
                            {vehicle.locationsCovered?.length > 2 ? '...' : ''})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(vehicle.lastCollectionDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSelectVehicle(vehicle)}
                          className="px-2.5 py-1 text-xs font-semibold rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                          View Logs
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(vehicle._id, e)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Vehicle"
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
        <div className="bg-white rounded-lg shadow-sm border border-emerald-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                Vehicle Activity History
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedVehicle.vehicleNumber} ({selectedVehicle.vehicleType})
              </h3>
            </div>
            <button
              onClick={() => {
                setSelectedVehicle(null);
                setVehicleHistory(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {historyLoading ? (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                Loading collection history...
              </div>
            ) : !vehicleHistory || !vehicleHistory.collections || vehicleHistory.collections.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">No Collection Records Found</p>
                <p className="text-xs text-gray-500 mt-1">
                  This vehicle has not been logged in any collections yet. Add a collection with Vehicle ID{' '}
                  <span className="font-mono font-bold text-gray-800">{selectedVehicle.vehicleNumber}</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 justify-between items-center">
                  <div>
                    <span className="text-gray-500 font-medium">Logged Trips:</span>
                    <span className="ml-1 font-bold text-gray-900">{vehicleHistory.collections.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Total Hauled:</span>
                    <span className="ml-1 font-bold text-emerald-700">{formatKG(vehicleHistory.vehicle.totalWaste)} KG</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Locations Visited:</span>
                    <span className="ml-1 font-bold text-gray-900">{vehicleHistory.vehicle.locationsCovered?.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Waste Types:</span>
                    <span className="ml-1 font-bold text-gray-900">{vehicleHistory.vehicle.wasteTypes?.join(', ')}</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Collection Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Location</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Material Stream</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Quantity (KG)</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Collector</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vehicleHistory.collections.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-900">
                            {formatDate(item.collectedAt)}
                          </td>
                          <td className="px-6 py-3 text-gray-700">{item.location}</td>
                          <td className="px-6 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {item.wasteType}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-bold text-gray-900">{formatKG(item.quantity)} KG</td>
                          <td className="px-6 py-3 text-gray-500">{item.collector || 'N/A'}</td>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add New Vehicle</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CARPE-VEH-01"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Collection Truck">Collection Truck</option>
                  <option value="Mini Truck">Mini Truck</option>
                  <option value="Heavy Truck">Heavy Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Capacity (KG)
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Assigned Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anna Nagar"
                  value={formData.assignedArea}
                  onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium shadow-sm"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
