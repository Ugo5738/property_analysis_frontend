import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

interface ColumnConfig {
  name: string;
  display_name: string;
  order: number;
  is_visible: boolean;
}

interface IProperty {
  id: number;
  [key: string]: any; // Allows dynamic property access
}

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
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [listingFilter, setListingFilter] = useState<string>("");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const [houseTypeFilter, setHouseTypeFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const navigate = useNavigate();

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      // Toggle asc/desc
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Switch to a new column, default to asc
      setSortColumn(columnName);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    const fetchColumnConfig = async () => {
      try {
        let allColumns: ColumnConfig[] = [];
        let nextUrl = '/api/orchestration/column-configs/?is_visible=true';
        
        while (nextUrl) {
          const response = await axiosInstance.get(nextUrl);
          allColumns = [...allColumns, ...response.data.results];
          nextUrl = response.data.next; // URL for next page
        }

        console.log("This is all columns: ", allColumns)

        setColumns(allColumns)
      } catch (err) {
        setError("Failed to load column configuration.");
      }
    };
    fetchColumnConfig();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/orchestration/properties/dynamic-columns/");
        console.log("This is all columns 2: ", response.data)
        setProperties(response.data);
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

    // Filter listing_type
    if (listingFilter) {
      temp = temp.filter((p) => {
        const listingType = p.listing_type?.toLowerCase();
        return listingType === listingFilter.toLowerCase();
      });
    }

    if (addressFilter) {
      temp = temp.filter((p) =>
        p.address?.toLowerCase().includes(addressFilter.toLowerCase())
      );
    }

    if (houseTypeFilter) {
      temp = temp.filter((p) =>
        p.house_type?.toLowerCase().includes(houseTypeFilter.toLowerCase())
      );
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

    if (sortColumn) {
      temp.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
  
        // If the column is numeric, convert to numbers
        const numA = parseFloat(valA) || 0;
        const numB = parseFloat(valB) || 0;
  
        // If *both* parse as valid numbers, sort numerically
        if (!isNaN(numA) && !isNaN(numB) && !(isNaN(numA) && isNaN(numB))) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
        
        // Otherwise fall back to string sort
        valA = valA?.toString().toLowerCase() || '';
        valB = valB?.toString().toLowerCase() || '';
  
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProperties(temp);
  }, [listingFilter, addressFilter, houseTypeFilter, priceFilter, properties, sortColumn, sortOrder]);

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
            <option value="letting">Letting</option>
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

      {!loading && columns.length > 0 && filteredProperties.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {columns.map((column) => (
                  <th
                    key={column.name}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-600"
                    onClick={() => handleSort(column.name)}
                  >
                    {column.display_name}
                    {/* Show an arrow if this column is actively sorted */}
                    {sortColumn === column.name && (
                      sortOrder === 'asc' ? ' ▲' : ' ▼'
                    )}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProperties.map((prop, index) => (
                <tr key={`property-${index}-${prop.address}`} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.name}
                      className="px-4 py-3 text-sm text-gray-900"
                    >
                      {column.name === 'created_at'
                        ? prop[column.name]?.slice(0, 10)
                        : prop[column.name]}
                    </td>
                  ))}
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