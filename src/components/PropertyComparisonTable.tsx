import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

interface IProperty {
  id: number;
  listing_type?: string;
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  house_type?: string;
  time_on_market?: string;
  created_at?: string;
}

const PropertyComparisonTable: React.FC = () => {
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [listingFilter, setListingFilter] = useState<string>("");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const [houseTypeFilter, setHouseTypeFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/orchestration/properties/");
        setProperties(response.data.results || []);
        setFilteredProperties(response.data);
      } catch (err) {
        setError("Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [navigate]);

  useEffect(() => {
    let temp = [...properties];
    if (listingFilter) {
      temp = temp.filter((p) => p.listing_type?.toLowerCase() === listingFilter.toLowerCase());
    }
    if (addressFilter) {
      temp = temp.filter((p) => p.address?.toLowerCase().includes(addressFilter.toLowerCase()));
    }
    if (houseTypeFilter) {
      temp = temp.filter((p) => p.house_type?.toLowerCase().includes(houseTypeFilter.toLowerCase()));
    }
    if (priceFilter) {
      const maxPrice = parseFloat(priceFilter);
      if (!isNaN(maxPrice)) {
        temp = temp.filter((p) => {
          const parsed = p.price ? parseFloat(p.price) : 0;
          return parsed <= maxPrice;
        });
      }
    }
    setFilteredProperties(temp);
  }, [listingFilter, addressFilter, houseTypeFilter, priceFilter, properties]);

  return (
    <div className="px-6 py-8 bg-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Property Comparison</h1>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p>Loading properties...</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="mb-2 text-sm text-gray-600">Listing Type:</label>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={listingFilter}
            onChange={(e) => setListingFilter(e.target.value)}
          >
            <option value="">--All--</option>
            <option value="sales">Sales</option>
            <option value="lettings">Letting</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm text-gray-600">Address:</label>
          <input
            type="text"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            placeholder="Search address..."
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm text-gray-600">House Type:</label>
          <input
            type="text"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={houseTypeFilter}
            onChange={(e) => setHouseTypeFilter(e.target.value)}
            placeholder="e.g. detached"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm text-gray-600">Max Price:</label>
          <input
            type="number"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            placeholder="1000000"
          />
        </div>
      </div>

      {!loading && filteredProperties.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created (Newest)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Listing</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Bedrooms</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Bathrooms</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">House Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time on Market</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.listing_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.address}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">£{prop.price}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.bedrooms}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.bathrooms}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.house_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{prop.time_on_market}</td>
                  <td className="px-4 py-3">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => navigate(`/property-analysis/${prop.id}`)}
                    >
                      View Analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredProperties.length === 0 && (
        <p className="text-gray-500 text-center py-8">No properties found matching your filters.</p>
      )}
    </div>
  );
};

export default PropertyComparisonTable;