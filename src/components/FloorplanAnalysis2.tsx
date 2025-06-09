import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Using correct relative path for Card components with type assertion
// @ts-ignore - Suppress declaration file missing error
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import * as floorplanService from '../services/floorplanService';

// Table 1: Floorplan Metadata Interface
interface FloorplanMetadata {
  property_id?: string;
  user_id?: string;
  floorplan_id?: string;
  original_url?: string;
  json_file_url?: string;
  csv_url?: string;
  total_area_csv_url?: string;
  image_labelme_side_by_side_url?: string;
  created_at?: string;
  [key: string]: any; // Allow for additional dynamic fields
}

// Table 2: Rooms/Segments Interface
interface RoomData {
  floor_name?: string;
  room_name?: string;
  is_segment?: boolean;
  dimensions_imperial?: string;
  dimensions_metric?: string;
  room_id?: string | number;
  no_of_door?: number;
  no_of_window?: number;
  no_of_room_points?: number;
  min_x_pixels?: number;
  min_y_pixels?: number;
  max_x_pixels?: number;
  max_y_pixels?: number;
  max_area_metric?: number;
  max_area_imperial?: number;
  max_area_pixels?: number;
  actual_area_pixels?: number;
  pixel_ratio?: number;
  scale_metric?: number;
  scale_imperial?: number;
  calculated_sq_area_metric?: number;
  calculated_area_imperial?: number | string;
  [key: string]: any; // Allow for additional dynamic fields
}

// Table 3: Totals Interface
interface TotalsData {
  area_name?: string;
  square_meters?: number;
  square_feet?: number;
  total_floors?: number;
  total_named_rooms?: number;
  total_segments?: number;
  total_points?: number;
  total_objects?: number;
  total_door_objects?: number;
  total_window_objects?: number;
  total_stair_objects?: number;
  list_of_objects?: string;
  total_actual_pixels?: number;
  metric_scale?: number;
  imperial_scale?: number;
  input_image_tokens?: number;
  input_text_tokens?: number;
  output_text_tokens?: number;
  [key: string]: any; // Allow for additional dynamic fields
}

// Combined data interface for the component
interface FloorplanAnalysisData {
  floorplanMetadata: FloorplanMetadata;
  roomsData: RoomData[];
  totalsData: TotalsData;
}

// Type for the API response
interface ApiResponse {
  [key: string]: any;
}

/**
 * Recursively logs paths through the object to help identify data locations
 * @param obj The object to traverse
 * @param path Current path through the object
 * @param maxDepth Maximum recursion depth
 * @param currentDepth Current recursion depth
 */
const recursivelyLogPaths = (obj: any, path: string = '', maxDepth: number = 20, currentDepth: number = 0): void => {
  if (currentDepth > maxDepth || obj === null || typeof obj !== 'object') {
    return;
  }

  Object.keys(obj).forEach(key => {
    const newPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      console.log(`Object Path: ${newPath}`, value);
      recursivelyLogPaths(value, newPath, maxDepth, currentDepth + 1);
    } else if (Array.isArray(value) && value.length > 0) {
      console.log(`Array Path: ${newPath}[0]`, value[0]);
      if (value[0] !== null && typeof value[0] === 'object') {
        recursivelyLogPaths(value[0], `${newPath}[0]`, maxDepth, currentDepth + 1);
      }
    } else {
      console.log(`Value Path: ${newPath}`, value);
    }
  });
};

/**
 * Recursively searches for room data in an object structure
 * @param obj The object to search
 * @param results Array to collect results
 * @param depth Current recursion depth
 * @param maxDepth Maximum recursion depth
 */
const extractRoomData = (obj: any, results: RoomData[] = [], depth: number = 0, maxDepth: number = 10): RoomData[] => {
  if (depth > maxDepth || obj === null || typeof obj !== 'object') {
    return results;
  }

  // Check if this object looks like room data
  if (obj.room_name || obj.name || obj.room_id) {
    const roomData: RoomData = {
      floor_name: obj.floor_name || '',
      room_name: obj.room_name || obj.name || 'Unknown',
      is_segment: typeof obj.is_segment === 'boolean' ? obj.is_segment : false,
      dimensions_imperial: obj.dimensions_imperial || '',
      dimensions_metric: obj.dimensions_metric || '',
      room_id: obj.room_id || '',
      no_of_door: obj.no_of_door || obj.door_count || 0,
      no_of_window: obj.no_of_window || obj.window_count || 0,
      no_of_room_points: obj.no_of_room_points || obj.point_count || 0,
      min_x_pixels: obj.min_x_pixels || obj.min_x || 0,
      min_y_pixels: obj.min_y_pixels || obj.min_y || 0,
      max_x_pixels: obj.max_x_pixels || obj.max_x || 0,
      max_y_pixels: obj.max_y_pixels || obj.max_y || 0,
      max_area_metric: obj.max_area_metric || 0,
      max_area_imperial: obj.max_area_imperial || 0,
      max_area_pixels: obj.max_area_pixels || 0,
      actual_area_pixels: obj.actual_area_pixels || obj.area_pixels || 0,
      pixel_ratio: obj.pixel_ratio || 0,
      scale_metric: obj.scale_metric || 0,
      scale_imperial: obj.scale_imperial || 0,
      calculated_sq_area_metric: obj.calculated_sq_area_metric || obj.area_sq_meters || 0,
      calculated_area_imperial: obj.calculated_area_imperial || obj.area_sq_feet || 0,
    };
    results.push(roomData);
  }

  // If it's an array, check each element
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      extractRoomData(item, results, depth + 1, maxDepth);
    });
    return results;
  }

  // If it's an object, traverse its properties
  Object.values(obj).forEach(value => {
    if (value !== null && typeof value === 'object') {
      extractRoomData(value, results, depth + 1, maxDepth);
    }
  });

  return results;
};

/**
 * Transform API response into structured data for the three tables
 * @param apiResponse Raw API response
 */
const transformApiResponseToFloorplanData = (apiResponse: ApiResponse): FloorplanAnalysisData => {
  console.log('Transforming API response:', apiResponse);
  
  // Handle undefined or null apiResponse gracefully
  if (!apiResponse) {
    console.warn('API response is undefined or null');
    // Return default empty data structure
    return {
      floorplanMetadata: {} as FloorplanMetadata,
      roomsData: [],
      totalsData: {} as TotalsData
    };
  }

  // Extract floorplan metadata (Table 1)
  const metadata: FloorplanMetadata = {
    property_id: apiResponse?.property_id || '',
    user_id: apiResponse?.user_id || '',
    floorplan_id: apiResponse?.floorplan_id || '',
    original_url: apiResponse?.original_url || '',
    json_file_url: apiResponse?.json_file_url || '',
    csv_url: apiResponse?.csv_url || '',
    total_area_csv_url: apiResponse?.total_area_csv_url || '',
    image_labelme_side_by_side_url: apiResponse?.image_labelme_side_by_side_url || '',
    created_at: apiResponse?.created_at || '',
  };

  // Extract rooms data (Table 2)
  let roomsData: RoomData[] = [];
  
  // Look for floor_plans data in the response
  if (apiResponse.floor_plans && Array.isArray(apiResponse.floor_plans) && apiResponse.floor_plans.length > 0) {
    apiResponse.floor_plans.forEach((floorPlan: any) => {
      // Extract rooms from all possible nested structures
      if (floorPlan.response) {
        // First check the response field
        roomsData = extractRoomData(floorPlan.response, roomsData);
      }
      
      if (floorPlan.all_floors_data) {
        // Then check the all_floors_data field
        roomsData = extractRoomData(floorPlan.all_floors_data, roomsData);
      }
      
      // Also check the floorPlan object itself for direct room data
      roomsData = extractRoomData(floorPlan, roomsData);
    });
  }

  // If there's no structured data in floor_plans, try to extract from the response directly
  if (roomsData.length === 0) {
    roomsData = extractRoomData(apiResponse, roomsData);
  }

  // Extract totals data (Table 3)
  const totalsData: TotalsData = {
    area_name: '',
    square_meters: 0,
    square_feet: 0,
    total_floors: 0,
    total_named_rooms: 0,
    total_segments: 0,
    total_points: 0,
    total_objects: 0,
    total_door_objects: 0,
    total_window_objects: 0,
    total_stair_objects: 0,
    list_of_objects: '',
    total_actual_pixels: 0,
    metric_scale: 0,
    imperial_scale: 0,
    input_image_tokens: 0,
    input_text_tokens: 0,
    output_text_tokens: 0,
  };

  // Try different paths to find totals data
  if (apiResponse.floor_plans && Array.isArray(apiResponse.floor_plans) && apiResponse.floor_plans.length > 0) {
    // First check for totals in the first floorplan's all_floors_data
    const firstFloorPlan = apiResponse.floor_plans[0];
    
    if (firstFloorPlan.all_floors_data?.total_areas_csv_data) {
      const totalData = firstFloorPlan.all_floors_data.total_areas_csv_data;
      
      // Map total data to our TotalsData interface
      totalsData.area_name = totalData.name || totalData.area_name || 'Total Area';
      totalsData.square_meters = totalData.square_meters || totalData.sq_meters || 0;
      totalsData.square_feet = totalData.square_feet || totalData.sq_feet || 0;
      totalsData.total_floors = totalData.total_floors || totalData.floors || 1;
      totalsData.total_named_rooms = totalData.total_named_rooms || totalData.named_rooms || roomsData.filter(r => !r.is_segment).length;
      totalsData.total_segments = totalData.total_segments || totalData.segments || roomsData.filter(r => r.is_segment).length;
      totalsData.total_points = totalData.total_points || totalData.points || 0;
      totalsData.total_objects = totalData.total_objects || totalData.objects || 0;
      totalsData.total_door_objects = totalData.total_door_objects || totalData.doors || 0;
      totalsData.total_window_objects = totalData.total_window_objects || totalData.windows || 0;
      totalsData.total_stair_objects = totalData.total_stair_objects || totalData.stairs || 0;
      totalsData.list_of_objects = totalData.list_of_objects || '';
      totalsData.total_actual_pixels = totalData.total_actual_pixels || totalData.actual_pixels || 0;
      totalsData.metric_scale = totalData.metric_scale || 0;
      totalsData.imperial_scale = totalData.imperial_scale || 0;
      totalsData.input_image_tokens = totalData.input_image_tokens || 0;
      totalsData.input_text_tokens = totalData.input_text_tokens || 0;
      totalsData.output_text_tokens = totalData.output_text_tokens || 0;
    }
  }

  return {
    floorplanMetadata: metadata,
    roomsData,
    totalsData,
  };
};

// Main component for Floorplan Analysis 2
const FloorplanAnalysis2 = () => {
  const { id } = useParams<{ id: string }>();
  const [floorplanData, setFloorplanData] = useState<FloorplanAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFloorplanData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log(`Fetching property with ID: ${id}`);
        const response = await floorplanService.getPropertyDetail(id);
        console.log('API Response:', response); // Log the entire response
        
        if (!response) {
          setError('API returned empty response');
          return;
        }
        
        // Transform raw API response to structured data for UI
        const transformedData = transformApiResponseToFloorplanData(response);
        setFloorplanData(transformedData);
        setError(null);
      } catch (err: any) {
        const statusCode = err?.response?.status;
        const errorMessage = err?.response?.data?.message || err?.message || 'Unknown error';
        
        // Provide specific error message based on status code
        if (statusCode === 404) {
          setError(`Property with ID ${id} not found. Please check if the ID is correct.`);
        } else if (statusCode === 401 || statusCode === 403) {
          setError('You do not have permission to access this property data.');
        } else {
          setError(`Failed to load property details: ${errorMessage}`);
        }
        
        console.error('Error fetching property details:', err);
        console.error('API endpoint called:', `https://floorplan.supersami.com/api/floorplan/properties/${id}/`);
      } finally {
        setLoading(false);
      }
    };

    fetchFloorplanData();
  }, [id]);

  // Helper to render a URL as a clickable link
  const renderUrl = (url: string | undefined) => {
    if (!url) return 'N/A';
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Open Link
      </a>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading floorplan data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!floorplanData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p>No floorplan data available for this property.</p>
      </div>
    );
  }

  // Render the component with data
  return (
    <div className="space-y-6">
      {/* Table 1: Floorplan Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Floorplan Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Property ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">User ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Floorplan ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Original URL</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">JSON File URL</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">CSV URL</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Area CSV URL</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Image Labelme Side By Side URL</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Created At</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{floorplanData.floorplanMetadata.property_id || 'N/A'}</td>
                  <td className="px-4 py-2">{floorplanData.floorplanMetadata.user_id || 'N/A'}</td>
                  <td className="px-4 py-2">{floorplanData.floorplanMetadata.floorplan_id || 'N/A'}</td>
                  <td className="px-4 py-2">{renderUrl(floorplanData.floorplanMetadata.original_url)}</td>
                  <td className="px-4 py-2">{renderUrl(floorplanData.floorplanMetadata.json_file_url)}</td>
                  <td className="px-4 py-2">{renderUrl(floorplanData.floorplanMetadata.csv_url)}</td>
                  <td className="px-4 py-2">{renderUrl(floorplanData.floorplanMetadata.total_area_csv_url)}</td>
                  <td className="px-4 py-2">{renderUrl(floorplanData.floorplanMetadata.image_labelme_side_by_side_url)}</td>
                  <td className="px-4 py-2">{floorplanData.floorplanMetadata.created_at || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Table 2: Rooms/Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Rooms / Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Floor Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Room Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Is Segment</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Dimensions (Imperial)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Dimensions (Metric)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Room ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">No. of Doors</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">No. of Windows</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">No. of Room Points</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Min X (pixels)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Min Y (pixels)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Max X (pixels)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Max Y (pixels)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Max Area (Metric)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Max Area (Imperial)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Max Area (pixels)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Actual Area (pixels)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Pixel Ratio</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Scale (Metric)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Scale (Imperial)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Calculated Area (Metric)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Calculated Area (Imperial)</th>
                </tr>
              </thead>
              <tbody>
                {floorplanData.roomsData.length > 0 ? (
                  floorplanData.roomsData.map((room, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{room.floor_name || 'N/A'}</td>
                      <td className="px-4 py-2">{room.room_name || 'N/A'}</td>
                      <td className="px-4 py-2">{room.is_segment ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2">{room.dimensions_imperial || 'N/A'}</td>
                      <td className="px-4 py-2">{room.dimensions_metric || 'N/A'}</td>
                      <td className="px-4 py-2">{room.room_id?.toString() || 'N/A'}</td>
                      <td className="px-4 py-2">{room.no_of_door}</td>
                      <td className="px-4 py-2">{room.no_of_window}</td>
                      <td className="px-4 py-2">{room.no_of_room_points}</td>
                      <td className="px-4 py-2">{room.min_x_pixels}</td>
                      <td className="px-4 py-2">{room.min_y_pixels}</td>
                      <td className="px-4 py-2">{room.max_x_pixels}</td>
                      <td className="px-4 py-2">{room.max_y_pixels}</td>
                      <td className="px-4 py-2">{room.max_area_metric}</td>
                      <td className="px-4 py-2">{room.max_area_imperial}</td>
                      <td className="px-4 py-2">{room.max_area_pixels}</td>
                      <td className="px-4 py-2">{room.actual_area_pixels}</td>
                      <td className="px-4 py-2">{room.pixel_ratio}</td>
                      <td className="px-4 py-2">{room.scale_metric}</td>
                      <td className="px-4 py-2">{room.scale_imperial}</td>
                      <td className="px-4 py-2">{room.calculated_sq_area_metric}</td>
                      <td className="px-4 py-2">{room.calculated_area_imperial?.toString() || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={22} className="px-4 py-2 text-center">No room data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 3: Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Area Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Square Meters</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Square Feet</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Floors</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Named Rooms</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Segments</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Points</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Objects</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Door Objects</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Window Objects</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Stair Objects</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">List of Objects</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Total Actual Pixels</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Metric Scale</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Imperial Scale</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Input Image Tokens</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Input Text Tokens</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Output Text Tokens</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{floorplanData.totalsData.area_name || 'Total Area'}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.square_meters}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.square_feet}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_floors}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_named_rooms}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_segments}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_points}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_objects}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_door_objects}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_window_objects}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_stair_objects}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.list_of_objects || 'N/A'}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.total_actual_pixels}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.metric_scale}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.imperial_scale}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.input_image_tokens}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.input_text_tokens}</td>
                  <td className="px-4 py-2">{floorplanData.totalsData.output_text_tokens}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloorplanAnalysis2;