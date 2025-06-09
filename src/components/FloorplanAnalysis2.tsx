import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as floorplanService from '../services/floorplanService';

// Type for the API response
interface FloorplanApiResponse {
  id?: string;
  message?: string;
  property_id?: string;
  user_id?: string;
  floor_plans?: {
    floorplan_id: string;
    all_floors_data?: {
      total_areas_csv_data?: {
        area_name?: string;
        square_meters?: number;
        square_feet?: number;
      }[];
      all_floors_csv_data?: {
        floor_name?: string;
        room_name?: string;
        room_id?: number;
        is_segment?: string;
        calculated_sq_area_metric?: number;
        calculated_area_imperial?: number;
      }[];
    };
  }[];
}

// Excel-like data structure for property spaces
interface PropertySpace {
  category: string;
  spacePercentage: number;
  sqft: number;
  sqm: number;
  costSpace: string | number;
  otherCost: string | number;
}

// Excel-like data structure for detailed view
interface DetailedViewItem {
  floor: string;
  spaceType: string;
  spaceName: string;
  areaSqftPercentage: number;
  areaSqft: number;
  areaSqm: number;
  pricePerSpace: string | number;
}

// Helper function to calculate the cost based on area and average price per sqft
const calculateCost = (sqft: number): string => {
  // Assuming an average price of £133.38 per sqft - adjust as needed
  const averagePricePerSqft = 133.38;
  const cost = sqft * averagePricePerSqft;
  return `£${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Helper function to format percentages based on area ratios
const calculatePercentage = (area: number, totalArea: number): number => {
  if (!totalArea) return 0;
  return Math.round((area / totalArea) * 100);
};

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
    // Fetch actual API data and transform to match the Excel format
    const fetchFloorplanData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await floorplanService.getPropertyDetail(id);
        console.log('Floorplan API response:', response);
        
        // Transform the API data to our frontend format
        const transformedData = transformApiResponseToFloorplanData(response);
        setFloorplanData(transformedData);
      } catch (err) {
        console.error('Error fetching floorplan2 data:', err);
        setError('Failed to fetch floorplan data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFloorplanData();
  }, [id]);
  
  // Transform the API response to match the expected frontend format
  const transformApiResponseToFloorplanData = (apiResponse: FloorplanApiResponse): FloorplanAnalysisData => {
    // Default empty data structure
    const result: FloorplanAnalysisData = {
      propertySpaces: [],
      detailedView: []
    };
    
    if (!apiResponse?.floor_plans?.length) return result;
    
    const floorPlan = apiResponse.floor_plans[0]; // Get first floor plan
    if (!floorPlan?.all_floors_data) return result;
    
    // Access areas data
    const totalAreasData = floorPlan.all_floors_data.total_areas_csv_data || [];
    const allFloorsData = floorPlan.all_floors_data.all_floors_csv_data || [];
    
    // Calculate total area for percentage calculations
    const totalAreaSqFt = totalAreasData.reduce((sum, area) => sum + (area.square_feet || 0), 0);
    
    // Process rooms by type to generate property spaces summary
    const spacesByCategory: { [key: string]: PropertySpace } = {};
    
    // Map room types based on common naming patterns
    allFloorsData.forEach(room => {
      if (!room.room_name || !room.calculated_area_imperial) return;
      
      let category = 'Other';
      const roomName = room.room_name.toLowerCase();
      
      if (roomName.includes('living') || roomName.includes('lounge') || roomName.includes('dining') || roomName.includes('snug')) {
        category = 'Living';
      } else if (roomName.includes('kitchen')) {
        category = 'Kitchen';
      } else if (roomName.includes('bedroom') || roomName.includes('master')) {
        category = 'Bedrooms';
      } else if (roomName.includes('bath') || roomName.includes('shower') || roomName.includes('wc') || roomName.includes('toilet')) {
        category = 'Bathrooms';
      }
      
      // Add to appropriate category
      if (!spacesByCategory[category]) {
        spacesByCategory[category] = {
          category,
          spacePercentage: 0,
          sqft: 0,
          sqm: 0,
          costSpace: '£0',
          otherCost: '£0'
        };
      }
      
      // Add area to category totals
      spacesByCategory[category].sqft += room.calculated_area_imperial || 0;
      spacesByCategory[category].sqm += room.calculated_sq_area_metric || 0;
    });
    
    // Calculate percentages and costs for each category
    result.propertySpaces = Object.values(spacesByCategory).map(space => {
      // Calculate percentage of total area
      space.spacePercentage = calculatePercentage(space.sqft, totalAreaSqFt);
      
      // Calculate cost based on area
      space.costSpace = calculateCost(space.sqft);
      space.otherCost = `£${133.38.toFixed(2)}`; // Fixed average price per sqft
      
      return space;
    });
    
    // Create detailed view from all_floors_csv_data
    result.detailedView = allFloorsData
      .filter(room => room.room_name && !room.is_segment) // Filter out segments and empty names
      .map(room => {
        const areaSqft = room.calculated_area_imperial || 0;
        
        return {
          floor: room.floor_name || 'Unknown Floor',
          spaceType: mapRoomTypeToSpaceType(room.room_name),
          spaceName: room.room_name || `Room ${room.room_id}`,
          areaSqftPercentage: calculatePercentage(areaSqft, totalAreaSqFt),
          areaSqft: areaSqft,
          areaSqm: room.calculated_sq_area_metric || 0,
          pricePerSpace: calculateCost(areaSqft)
        };
      });
    
    return result;
  };
  
  // Helper function to map room names to space types
  const mapRoomTypeToSpaceType = (roomName?: string): string => {
    if (!roomName) return 'Other';
    
    const name = roomName.toLowerCase();
    if (name.includes('living') || name.includes('lounge') || name.includes('dining') || name.includes('snug')) {
      return 'Living';
    } else if (name.includes('kitchen')) {
      return 'Kitchen';
    } else if (name.includes('bedroom') || name.includes('master')) {
      return 'Bedroom';
    } else if (name.includes('bath') || name.includes('shower') || name.includes('wc') || name.includes('toilet')) {
      return 'Bathroom';
    } else if (name.includes('stair') || name.includes('landing') || name.includes('hallway') || name.includes('corridor')) {
      return 'Other';
    }
    
    return 'Other';
  };


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
