import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as floorplanService from '../services/floorplanService';

interface PropertySpace {
  category: string;
  spacePercentage: number;  // e.g., 30 for 30%
  sqft: number;
  sqm: number;
  costSpace: number;        // or string if your backend sends e.g. "£93,363"
  otherCost: number;        // or string
}

interface DetailedViewItem {
  floor: string;            // e.g., "Ground Floor"
  spaceType: string;        // e.g., "Living"
  spaceName: string;        // e.g., "Snug"
  areaSqftPercentage: number;
  areaSqft: number;
  areaSqm: number;
  pricePerSpace: number;    // or string
}

interface FloorplanAnalysisData {
  propertySpaces: PropertySpace[];
  detailedView: DetailedViewItem[];
}

const FloorplanAnalysis2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [floorplanData, setFloorplanData] = useState<FloorplanAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFloorplanData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Make specific API request to get floorplan2 data
        const response = await floorplanService.getPropertyDetail(id);
        
        console.log('Floorplan2 API response:', response);
        
        // Transform API response into the expected format for this component
        if (response && response.floor_plans && response.floor_plans.length > 0) {
          // Extract the floorplan analysis 2 data from the API response
          const floorPlan = response.floor_plans[0]; // Use the first floorplan or implement logic to select the right one
          
          // Build the floorplan2 data structure from the API response
          const transformedData: FloorplanAnalysisData = {
            propertySpaces: floorPlan.property_spaces?.map((space: any) => ({
              category: space.category || 'Unknown',
              spacePercentage: space.space_percentage || 0,
              sqft: space.sqft || 0,
              sqm: space.sqm || 0,
              costSpace: space.cost_space || 0,
              otherCost: space.other_cost || 0,
            })) || [],
            
            detailedView: floorPlan.detailed_view?.map((item: any) => ({
              floor: item.floor || 'Unknown',
              spaceType: item.space_type || 'Unknown',
              spaceName: item.space_name || 'Unknown',
              areaSqftPercentage: item.area_sqft_percentage || 0,
              areaSqft: item.area_sqft || 0,
              areaSqm: item.area_sqm || 0,
              pricePerSpace: item.price_per_space || 0,
            })) || [],
          };
          
          setFloorplanData(transformedData);
        } else {
          setError('No floorplan data available in the API response');
        }
      } catch (err) {
        console.error('Error fetching floorplan2 data:', err);
        setError('Failed to fetch floorplan data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFloorplanData();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading floorplan data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!floorplanData || !floorplanData.propertySpaces || !floorplanData.detailedView) {
    return <div className="p-4">No floorplan data available.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top-Level Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Spaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left whitespace-nowrap">Category</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Space %</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Sq Ft</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Sq M</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Cost/Space</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Cost/Other</th>
                </tr>
              </thead>
              <tbody>
                {floorplanData.propertySpaces.map((space, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{space.category}</td>
                    <td className="px-4 py-2">{space.spacePercentage}%</td>
                    <td className="px-4 py-2">{space.sqft}</td>
                    <td className="px-4 py-2">{space.sqm}</td>
                    <td className="px-4 py-2">{space.costSpace}</td>
                    <td className="px-4 py-2">{space.otherCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left whitespace-nowrap">Building/Floor</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Space Type</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Space Name</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Area Sqft %</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Area Sqft</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Area Sqm</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Price Per Space</th>
                </tr>
              </thead>
              <tbody>
                {floorplanData.detailedView.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{item.floor}</td>
                    <td className="px-4 py-2">{item.spaceType}</td>
                    <td className="px-4 py-2">{item.spaceName}</td>
                    <td className="px-4 py-2">{item.areaSqftPercentage}%</td>
                    <td className="px-4 py-2">{item.areaSqft}</td>
                    <td className="px-4 py-2">{item.areaSqm}</td>
                    <td className="px-4 py-2">{item.pricePerSpace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloorplanAnalysis2;
