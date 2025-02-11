// PropertyList.tsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitCompare, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from "../utils/axiosConfig";

interface Property {
  id: number;
  url: string;
  created_at: string;
  updated_at: string;
  analysis_source: string; // "email" or "original"
}

const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/check-authenticated/');
        if (response.status === 200) {
          setAuthenticated(true);
          fetchProperties();
        } else {
          navigate('/enter-phone');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/enter-phone');
      }
    };
    checkAuthentication();
  }, [navigate]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/orchestration/properties/', {});
      setProperties(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to fetch properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((property) =>
    property.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompare = () => {
    navigate("/compare");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Property List</h1>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-3 w-full sm:w-auto">
          <Link to="/email/auth/gmail/">
            <Button variant="secondary" className="flex items-center">
              Connect Gmail
            </Button>
          </Link>
          <Button onClick={handleCompare} variant="outline" className="flex items-center">
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Link to="/analyze">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </Link>
        </div>
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading properties...</div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredProperties.length === 0 ? (
        <Alert>
          <AlertDescription>
            No properties found. Try adding some properties or adjusting your search.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">URL</TableHead>
                <TableHead>Analysis Source</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      to={`/property-analysis/${property.id}`}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {property.url}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{property.analysis_source}</TableCell>
                  <TableCell>{new Date(property.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(property.updated_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
