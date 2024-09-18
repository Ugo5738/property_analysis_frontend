import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axiosInstance from "../utils/axiosConfig";

interface Property {
  id: number;
  url: string;
  created_at: string;
  updated_at: string;
}

const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axiosInstance.get('/api/analysis/properties/');
    //   console.log('API response:', response.data); // Debug log
      if (Array.isArray(response.data)) {
        setProperties(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setProperties(response.data.results);
      } else {
        throw new Error('Unexpected data format from API');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to fetch properties. Please try again.');
      setLoading(false);
    }
  };

  const handleAnalyze = async (propertyId: number) => {
    try {
      // Initiate analysis by sending property_id
      const response = await axiosInstance.post('/api/analysis/properties/analyze/', {
        property_id: propertyId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const taskId = response.data.task_id;

      // Navigate to the analysis page to show progress
      navigate(`/property-analysis/${propertyId}/${taskId}`);
    } catch (error) {
      console.error('Error initiating analysis:', error);
      setError('Failed to initiate analysis. Please try again.');
    }
  };

  if (loading) return <div>Loading properties...</div>;
  if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

  if (properties.length === 0) {
    return <Alert><AlertTitle>No Properties</AlertTitle><AlertDescription>No properties found. Try adding some properties first.</AlertDescription></Alert>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Property List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <Link to={`/property-analysis/${property.id}`}>
                      {property.url}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(property.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(property.updated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleAnalyze(property.id)}>Analyze</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyList;