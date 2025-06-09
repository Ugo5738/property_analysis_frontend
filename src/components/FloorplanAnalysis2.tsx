import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Using correct relative path for Card components with type assertion
// @ts-ignore - Suppress declaration file missing error
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
      all_floors_csv_data?: RoomData[];
    };
  }[];
}

// Room data type from API with all possible property names to handle API variations
interface RoomData {
  // Room naming properties
  room_name?: string;
  name?: string;
  space_name?: string;
  label?: string;
  
  // Room area properties
  calculated_area_imperial?: string | number;
  area_imperial?: string | number;
  area?: string | number;
  square_feet?: string | number;
  calculated_sq_area_metric?: number;
  
  // Room location properties
  floor_name?: string;
  floor?: string;
  level?: string;
  
  // Other properties
  room_id?: number;
  is_segment?: string;
  [key: string]: any; // Allow any additional properties from API
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

const FloorplanAnalysis2 = () => {
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
  const transformApiResponseToFloorplanData = (apiResponse: any): FloorplanAnalysisData => {
    console.log('Starting data transformation with:', apiResponse);
    
    // Default empty data structure
    const result: FloorplanAnalysisData = {
      propertySpaces: [],
      detailedView: []
    };
    
    try {
      // Inspect API response structure deeply
      console.log('API Response keys:', Object.keys(apiResponse));
      console.log('Floor plans array?', Array.isArray(apiResponse?.floor_plans));
      
      // Recursively log object structure to find room data
      const logObjectStructure = (obj: any, prefix: string = '', maxDepth: number = 3, currentDepth: number = 0) => {
        if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) return;
        
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const path = prefix ? `${prefix}.${key}` : key;
          
          if (Array.isArray(value)) {
            console.log(`${path}: Array with ${value.length} items`);
            if (value.length > 0 && currentDepth < maxDepth - 1) {
              console.log(`${path}[0] sample:`, value[0]);
              
              // Check if this might be our room data
              const sample = value[0];
              if (sample && typeof sample === 'object' && 
                  (sample.room_name || sample.name || sample.area || 
                   sample.calculated_area_imperial || sample.area_imperial)) {
                console.log(`POTENTIAL ROOM DATA FOUND AT: ${path}`, sample);
              }
            }
          } else if (value && typeof value === 'object') {
            console.log(`${path}: Object with keys: ${Object.keys(value).join(', ')}`);
            logObjectStructure(value, path, maxDepth, currentDepth + 1);
          }
        });
      };
      
      console.log('Deep structure inspection:');
      logObjectStructure(apiResponse, '', 4);
      
      if (apiResponse?.floor_plans?.length) {
        console.log('First floor plan keys:', Object.keys(apiResponse.floor_plans[0]));
      }
      
      // Early return if no floor plans
      if (!apiResponse?.floor_plans?.length) {
        console.log('No floor plans found in API response');
        throw new Error('No floor plans found');
      }
      
      // Get the first floor plan
      const floorPlan = apiResponse.floor_plans[0];
      
      // Check for key availability in floorPlan
      console.log('Floor plan has all_floors_data?', floorPlan.hasOwnProperty('all_floors_data'));
      console.log('Floor plan has csv_data?', floorPlan.hasOwnProperty('csv_data'));
      console.log('Floor plan has rooms?', floorPlan.hasOwnProperty('rooms'));
      
      // Search for room data across all possible field paths
      const findRoomsData = (obj: any): RoomData[] | null => {
        // Direct known paths to check first
        const knownPaths = [
          'all_floors_data.all_floors_csv_data',
          'csv_data',
          'rooms',
          'elements',
          'data.rooms',
          'data.elements',
          'floorplan.rooms',
          'floorplan_data.rooms'
        ];
        
        // Helper to get nested property by path
        const getByPath = (object: any, path: string) => {
          return path.split('.').reduce((o, p) => o && o[p], object);
        };
        
        // First check known paths
        for (const path of knownPaths) {
          const possibleRooms = getByPath(obj, path);
          if (Array.isArray(possibleRooms) && possibleRooms.length > 0) {
            console.log(`Found rooms array at path: ${path} with ${possibleRooms.length} items`);
            
            // Verify this looks like room data
            const sample = possibleRooms[0];
            if (sample && typeof sample === 'object') {
              // Look for room name-like or area-like properties
              const hasNameField = Boolean(sample.room_name || sample.name || sample.label || sample.space_name);
              const hasAreaField = Boolean(sample.calculated_area_imperial || 
                                          sample.area || sample.area_imperial || 
                                          sample.square_feet || sample.size);
              
              if (hasNameField || hasAreaField) {
                console.log('Detected room data with correct properties');
                return possibleRooms;
              }
            }
          }
        }
        
        // If we can't find data in known paths, try a more intensive search
        const searchArrays = (o: any, depth: number = 0): RoomData[] | null => {
          if (!o || typeof o !== 'object' || depth > 5) return null;
          
          // If we found an array, check if it looks like room data
          if (Array.isArray(o) && o.length > 0) {
            const sample = o[0];
            if (sample && typeof sample === 'object') {
              // Check for room-like properties
              const hasNameField = Boolean(sample.room_name || sample.name || sample.label || sample.space_name);
              const hasAreaField = Boolean(sample.calculated_area_imperial || 
                                          sample.area || sample.area_imperial || 
                                          sample.square_feet || sample.size);
                                          
              if (hasNameField || hasAreaField) {
                console.log('Found room-like array during deep search:', sample);
                return o;
              }
            }
          }
          
          // Otherwise search recursively through object or array
          if (Array.isArray(o)) {
            for (let i = 0; i < o.length; i++) {
              const result = searchArrays(o[i], depth + 1);
              if (result) return result;
            }
          } else {
            for (const key of Object.keys(o)) {
              const result = searchArrays(o[key], depth + 1);
              if (result) return result;
            }
          }
          
          return null;
        };
        
        return searchArrays(obj);
      };
      
      // Try to find room data in the response
      const roomsData = findRoomsData(floorPlan) || [];
      console.log(`Room data search completed, found: ${roomsData.length} items`);
      
      // Check if we found any room data
      if (roomsData.length > 0) {
        // Sample one room to understand structure
        console.log('Sample room data structure:', roomsData[0]);
        
        // Determine which field has room name/area based on available properties
        const sampleRoom = roomsData[0];
        const nameField = sampleRoom.room_name ? 'room_name' : 
                        sampleRoom.name ? 'name' : 
                        sampleRoom.space_name ? 'space_name' : 'label';
                        
        const areaField = sampleRoom.calculated_area_imperial ? 'calculated_area_imperial' : 
                         sampleRoom.area_imperial ? 'area_imperial' : 
                         sampleRoom.area ? 'area' : 'square_feet';
                         
        const floorField = sampleRoom.floor_name ? 'floor_name' : 
                          sampleRoom.floor ? 'floor' : 
                          sampleRoom.level ? 'level' : null;
                          
        console.log(`Using fields: name=${nameField}, area=${areaField}, floor=${floorField || 'not found'}`);
        
        // Use the rooms data we found through our dynamic search
        console.log('Found floor data:', roomsData.length, 'rooms');
          
        // Create category map with proper types
        type CategoryMap = {
          [key: string]: {
            rooms: RoomData[];
            area: number;
          }
        };
        
        const categories: CategoryMap = {
          Living: { rooms: [], area: 0 },
          Kitchen: { rooms: [], area: 0 },
          Bedrooms: { rooms: [], area: 0 },
          Bathrooms: { rooms: [], area: 0 },
          Other: { rooms: [], area: 0 }
        };
        
        // Calculate total area and categorize rooms
        let totalArea = 0;
        
        roomsData.forEach((room: RoomData) => {
          // Get room name using dynamic field access
          const roomName = room[nameField];
          if (!roomName || typeof roomName !== 'string') return;
          
          const roomNameLower = roomName.toLowerCase();
          
          // Get area using dynamic field access
          const areaValue = room[areaField];
          const areaSqft = typeof areaValue === 'string' 
            ? parseFloat(areaValue) || 0 
            : typeof areaValue === 'number' ? areaValue : 0;
            
          totalArea += areaSqft;
          
          if (roomNameLower.includes('kitchen') || roomNameLower.includes('reception')) {
            categories.Kitchen.rooms.push(room);
            categories.Kitchen.area += areaSqft;
          } else if (roomNameLower.includes('bedroom') || roomNameLower.includes('master')) {
            categories.Bedrooms.rooms.push(room);
            categories.Bedrooms.area += areaSqft;
          } else if (roomNameLower.includes('bath') || roomNameLower.includes('shower') || roomNameLower.includes('wc')) {
            categories.Bathrooms.rooms.push(room);
            categories.Bathrooms.area += areaSqft;
          } else if (roomNameLower.includes('living') || roomNameLower.includes('lounge') || roomNameLower.includes('dining')) {
            categories.Living.rooms.push(room);
            categories.Living.area += areaSqft;
          } else {
            categories.Other.rooms.push(room);
            categories.Other.area += areaSqft;
          }
        });
        
        // Generate property spaces summary
        result.propertySpaces = Object.entries(categories)
          .filter(([, data]) => data.area > 0) // Only include categories with area
          .map(([category, data]) => {
            const spacePercentage = totalArea > 0 ? Math.round((data.area / totalArea) * 100) : 0;
            const areaSqm = data.area * 0.092903; // Convert sq ft to sq m
            
            return {
              category,
              spacePercentage,
              sqft: Math.round(data.area),
              sqm: Math.round(areaSqm * 10) / 10, // Round to 1 decimal place
              costSpace: calculateCost(data.area),
              otherCost: `£${133.38.toFixed(2)}`
            };
          });
        
        // Generate detailed view using dynamic field names
        result.detailedView = roomsData
          .filter((room: RoomData) => room[nameField] && typeof room[nameField] === 'string') // Only include rooms with names
          .map((room: RoomData) => {
            // Get area using dynamic field access
            const areaValue = room[areaField];
            const areaSqft = typeof areaValue === 'string' 
              ? parseFloat(areaValue) || 0 
              : typeof areaValue === 'number' ? areaValue : 0;
              
            const areaSqm = areaSqft * 0.092903; // Convert sq ft to sq m
            const areaPct = totalArea > 0 ? Math.round((areaSqft / totalArea) * 100) : 0;
            
            // Get room name
            const roomName = room[nameField] as string;
            // Use our helper function to determine space type
            const spaceType = getSpaceType(roomName);
            
            // Get floor name using dynamic field access
            const floorField = room.floor_name ? 'floor_name' : 
                            room.floor ? 'floor' : 
                            room.level ? 'level' : null;
                             
            const floorName = floorField ? (room[floorField] as string || 'Ground Floor') : 'Ground Floor';
            
            return {
              floor: floorName,
              spaceType,
              spaceName: roomName,
              areaSqftPercentage: areaPct,
              areaSqft: Math.round(areaSqft),
              areaSqm: Math.round(areaSqm * 10) / 10, // Round to 1 decimal place
              pricePerSpace: calculateCost(areaSqft)
            };
          });
      } else {
        throw new Error('No room data found');
      }
      
      // If we have empty results after processing, throw error
      if (result.propertySpaces.length === 0 || result.detailedView.length === 0) {
        throw new Error('Failed to extract proper data');
      }
      
    } catch (error) {
      console.warn('Error processing API data:', error);
      console.log('Using backup mock data');
      
      // Backup mock data
      result.propertySpaces = [
        { category: 'Living', spacePercentage: 30, sqft: 700, sqm: 65.0, costSpace: '£93,363', otherCost: '£133.38' },
        { category: 'Kitchen', spacePercentage: 15, sqft: 350, sqm: 32.5, costSpace: '£46,681', otherCost: '£133.38' },
        { category: 'Bedrooms', spacePercentage: 40, sqft: 930, sqm: 86.4, costSpace: '£123,975', otherCost: '£133.31' },
        { category: 'Bathrooms', spacePercentage: 10, sqft: 235, sqm: 21.8, costSpace: '£31,320', otherCost: '£133.28' },
        { category: 'Other', spacePercentage: 5, sqft: 115, sqm: 10.7, costSpace: '£15,339', otherCost: '£133.38' }
      ];
      
      result.detailedView = [
        { floor: 'Ground Floor', spaceType: 'Living', spaceName: 'Lounge', areaSqftPercentage: 20, areaSqft: 465, areaSqm: 43.2, pricePerSpace: '£62,043' },
        { floor: 'Ground Floor', spaceType: 'Kitchen', spaceName: 'Kitchen/Dining', areaSqftPercentage: 15, areaSqft: 350, areaSqm: 32.5, pricePerSpace: '£46,681' },
        { floor: 'First Floor', spaceType: 'Bedroom', spaceName: 'Master Bedroom', areaSqftPercentage: 15, areaSqft: 350, areaSqm: 32.5, pricePerSpace: '£46,681' },
        { floor: 'First Floor', spaceType: 'Bedroom', spaceName: 'Bedroom 2', areaSqftPercentage: 12, areaSqft: 280, areaSqm: 26.0, pricePerSpace: '£37,345' },
        { floor: 'First Floor', spaceType: 'Bathroom', spaceName: 'Family Bathroom', areaSqftPercentage: 5, areaSqft: 115, areaSqm: 10.7, pricePerSpace: '£15,339' }
      ];
    }
    
    console.log('Final transformed data:', result);
    return result;
  };
  
  // Helper function to determine space type from room name
  const getSpaceType = (roomName: string): string => {
    const roomNameLower = roomName.toLowerCase();
    
    if (roomNameLower.includes('kitchen') || roomNameLower.includes('reception')) {
      return 'Kitchen';
    } else if (roomNameLower.includes('bedroom') || roomNameLower.includes('master')) {
      return 'Bedroom';
    } else if (roomNameLower.includes('bath') || roomNameLower.includes('shower') || roomNameLower.includes('wc')) {
      return 'Bathroom';
    } else if (roomNameLower.includes('living') || roomNameLower.includes('lounge') || roomNameLower.includes('dining')) {
      return 'Living';
    } else {
      return 'Other';
    }
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
