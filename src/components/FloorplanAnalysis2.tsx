import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as floorplanService from '../services/floorplanService';

interface AreaData {
  area_name: string;
  square_feet: number;
  square_meters: number;
  id: number;
  // other properties may be available but not needed for our UI
}

interface Floor {
  id: number;
  floor: string;
  image_url: string;
  csv_url: string;
  // other properties may be available but not needed for our UI
}

interface PropertySpace {
  category: string;
  spacePercentage: number;
  sqft: number;
  sqm: number;
  costSpace: string | number;
  otherCost: string | number;
}

interface DetailedViewItem {
  floor: string;
  spaceType: string;
  spaceName: string;
  areaSqftPercentage: number;
  areaSqft: number;
  areaSqm: number;
  pricePerSpace: string | number;
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
          const floorPlan = response.floor_plans[0]; // Use the first floorplan
          
          // Calculate costs based on total area data
          const totalAreas = floorPlan.floor_plan?.total_areas_csv_data || [];
          const totalArea = totalAreas.find((area: AreaData) => area.area_name.toLowerCase().includes('total'));
          const totalSqFt = totalArea?.square_feet || 0;
          
          // Process plan floors to extract room types and measurements
          const floors = floorPlan.plan_floors || [];
          
          // Create property spaces array (categories with aggregated data)
          // For this example, we'll create them from the total areas data
          const propertySpaces: PropertySpace[] = totalAreas
            .filter((area: AreaData) => !area.area_name.toLowerCase().includes('total'))
            .map((area: AreaData) => {
              const name = area.area_name.split('=')[0].trim();
              const sqft = area.square_feet;
              const sqm = area.square_meters;
              const percentage = totalSqFt > 0 ? Math.round((sqft / totalSqFt) * 100) : 0;
              
              return {
                category: name,
                spacePercentage: percentage,
                sqft: sqft,
                sqm: sqm,
                costSpace: 'N/A', // We don't have cost data in the API response
                otherCost: 'N/A'
              };
            });
          
          // Create detailed view items by combining floor data and area data
          const detailedView: DetailedViewItem[] = [];
          
          // First add entries from the totalAreas data that aren't the total
          totalAreas
            .filter((area: AreaData) => !area.area_name.toLowerCase().includes('total'))
            .forEach((area: AreaData) => {
              // Parse the area name to extract more meaningful information
              const nameParts = area.area_name.split('=');
              const areaName = nameParts[0].trim();
              
              detailedView.push({
                floor: 'All Floors', // We don't know which floor this area belongs to
                spaceType: areaName,
                spaceName: areaName,
                areaSqftPercentage: totalSqFt > 0 ? Math.round((area.square_feet / totalSqFt) * 100) : 0,
                areaSqft: area.square_feet,
                areaSqm: area.square_meters,
                pricePerSpace: 'N/A'
              });
            });
          
          // Then add entries for each floor
          floors.forEach((floor: Floor) => {
            const floorName = floor.floor.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            detailedView.push({
              floor: floorName,
              spaceType: 'Floor',
              spaceName: floorName,
              areaSqftPercentage: 0, // We don't have percentage data per floor
              areaSqft: 0, // We don't have exact square footage for this floor
              areaSqm: 0,
              pricePerSpace: 'N/A'
            });
          });
          
          // If we have no detailed data at all, add the total area as a fallback
          if (detailedView.length === 0 && totalArea) {
            detailedView.push({
              floor: 'All Floors',
              spaceType: 'Entire Property',
              spaceName: 'All Spaces',
              areaSqftPercentage: 100,
              areaSqft: totalArea.square_feet,
              areaSqm: totalArea.square_meters,
              pricePerSpace: 'N/A'
            });
          }
          
          // Build the floorplan2 data structure
          const transformedData: FloorplanAnalysisData = {
            propertySpaces: propertySpaces,
            detailedView: detailedView
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
                {floorplanData.propertySpaces.length > 0 ? (
                  floorplanData.propertySpaces.map((space, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{space.category}</td>
                      <td className="px-4 py-2">{space.spacePercentage}%</td>
                      <td className="px-4 py-2">{space.sqft}</td>
                      <td className="px-4 py-2">{space.sqm}</td>
                      <td className="px-4 py-2">{space.costSpace}</td>
                      <td className="px-4 py-2">{space.otherCost}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-center">No property space data available</td>
                  </tr>
                )}
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
                {floorplanData.detailedView.length > 0 ? (
                  floorplanData.detailedView.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{item.floor}</td>
                      <td className="px-4 py-2">{item.spaceType}</td>
                      <td className="px-4 py-2">{item.spaceName}</td>
                      <td className="px-4 py-2">{item.areaSqftPercentage}%</td>
                      <td className="px-4 py-2">{item.areaSqft}</td>
                      <td className="px-4 py-2">{item.areaSqm}</td>
                      <td className="px-4 py-2">{item.pricePerSpace}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-2 text-center">No detailed view data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloorplanAnalysis2;
