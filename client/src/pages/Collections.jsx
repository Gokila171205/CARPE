import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash } from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data } = await api.get('/waste');
      setCollections(data);
    } catch (error) {
      console.error('Failed to fetch collections', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/waste/${id}`);
        fetchCollections();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading collections...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Search collections..."
          />
        </div>
        <Link
          to="/collections/add"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add Collection
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div>Date</div>
            <div>Location</div>
            <div>Type</div>
            <div>Quantity</div>
            <div>Vehicle</div>
            <div className="text-right">Actions</div>
          </div>
          {collections.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No collections found.</div>
          ) : (
            collections.map((record) => (
              <li key={record._id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-gray-50">
                <div className="text-sm text-gray-900">{new Date(record.collectedAt).toLocaleDateString()}</div>
                <div className="text-sm text-gray-900">{record.location}</div>
                <div className="text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    {record.wasteType}
                  </span>
                </div>
                <div className="text-sm text-gray-900">{record.quantity} kg</div>
                <div className="text-sm text-gray-500">{record.vehicle}</div>
                <div className="text-sm text-right font-medium flex justify-end gap-3">
                  <button className="text-indigo-600 hover:text-indigo-900"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(record._id)} className="text-red-600 hover:text-red-900"><Trash className="h-4 w-4" /></button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
