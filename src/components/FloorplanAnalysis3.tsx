import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import * as floorplanService from '../services/floorplanService';

interface RoomsSegment {
  floor_name: string;
  room_name: string;
  is_segment: boolean;
  dimensions_imperial: string;
  dimensions_metric: string;
  room_id: number;
  no_of_door: number;
  no_of_window: number;
  no_of_room_points: number;
  max_x_pixels: number;
  min_x_pixels: number;
  max_y_pixels: number;
  min_y_pixels: number;
}

interface TotalArea {
  floor_name: string;
  square_meters: number;
  square_feet: number;
  total_floors: number;
  total_joined_rooms: number;
  total_segments: number;
  total_points: number;
  total_doors: number;
  total_door_objects: number;
  total_windows: number;
  total_window_objects: number;
  list_of_objects: number;
  total_pixel: number;
}

interface MetricData {
  max_area_metric: number;
  max_area_imperial: number;
  max_area_pixels: number;
  actual_area_pixels: number;
  pixel_ratio: number;
  scale_metric: number;
  scale_imperial: number;
  calculated_sq_area_metric: number;
  calculated_area_imperial: number;
}

interface UrlData {
  property_id: string;
  next_id: string;
  floorplan_id: string;
  original_url: string;
  json_file_url: string;
  csv_url: string;
  total_error_image_labeling: string;
  created_at: string;
}

interface FloorplanData {
  urls: UrlData[];
  metrics: MetricData[];
  roomsSegments: RoomsSegment[];
  totalAreas: TotalArea[];
}

const FloorplanAnalysis3: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [floorplanData, setFloorplanData] = useState<FloorplanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFloorplanData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await floorplanService.getPropertyDetail(id);
        
        // Transform the data to match the component's expected format
        const transformed: FloorplanData = {
          urls: data.floor_plans.map((plan: any) => ({
            property_id: data.property_id,
            next_id: '',
            floorplan_id: plan.floorplan_id,
            original_url: plan.original_url || '',
            json_file_url: '',
            csv_url: '',
            total_error_image_labeling: '',
            created_at: plan.created_at || '',
          })),
          metrics: data.floor_plans.flatMap((plan: any) => 
            plan.all_floors_data?.total_areas_csv_data?.map((area: any) => ({
              max_area_metric: area.max_area_metric || 0,
              max_area_imperial: area.max_area_imperial || 0,
              max_area_pixels: area.max_area_pixels || 0,
              actual_area_pixels: area.actual_area_pixels || 0,
              pixel_ratio: area.pixel_ratio || 0,
              scale_metric: area.scale_metric || 0,
              scale_imperial: area.scale_imperial || 0,
              calculated_sq_area_metric: area.calculated_sq_area_metric || 0,
              calculated_area_imperial: area.calculated_area_imperial || 0,
            })) || []
          ),
          roomsSegments: data.floor_plans.flatMap((plan: any) => 
            plan.plan_floors?.map((floor: any) => ({
              floor_name: floor.floor_name || '',
              room_name: floor.room_name || '',
              is_segment: floor.is_segment || false,
              dimensions_imperial: floor.dimensions_imperial || '',
              dimensions_metric: floor.dimensions_metric || '',
              room_id: floor.room_id || 0,
              no_of_door: floor.no_of_door || 0,
              no_of_window: floor.no_of_window || 0,
              no_of_room_points: floor.no_of_room_points || 0,
              max_x_pixels: floor.max_x_pixels || 0,
              min_x_pixels: floor.min_x_pixels || 0,
              max_y_pixels: floor.max_y_pixels || 0,
              min_y_pixels: floor.min_y_pixels || 0,
            })) || []
          ),
          totalAreas: data.floor_plans.flatMap((plan: any) => 
            plan.all_floors_data?.all_floors_csv_data?.map((area: any) => ({
              floor_name: area.floor_name || '',
              square_meters: area.square_meters || 0,
              square_feet: area.square_feet || 0,
              total_floors: area.total_floors || 0,
              total_joined_rooms: area.total_joined_rooms || 0,
              total_segments: area.total_segments || 0,
              total_points: area.total_points || 0,
              total_doors: area.total_doors || 0,
              total_door_objects: area.total_door_objects || 0,
              total_windows: area.total_windows || 0,
              total_window_objects: area.total_window_objects || 0,
              list_of_objects: area.list_of_objects || 0,
              total_pixel: area.total_pixel || 0,
            })) || []
          ),
        };
        
        setFloorplanData(transformed);
      } catch (err) {
        console.error('Error fetching floorplan data:', err);
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

  if (!floorplanData) {
    return <div className="p-4">No floorplan data available.</div>;
  }

  return (
    <div className="space-y-8">
      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>TABLE 1 - URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap min-w-[120px]">property_id</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">next_id</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">floorplan_id</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">original_url</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">json_file_url</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">csv_url</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[200px]">total_error_image_labeling</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">created_at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floorplanData.urls.map((url, index) => (
                  <TableRow key={index}>
                    <TableCell className="overflow-hidden text-ellipsis">{url.property_id}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{url.next_id}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{url.floorplan_id}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">
                      <a 
                        href={url.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        {url.original_url}
                      </a>
                    </TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{url.json_file_url}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{url.csv_url}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{url.total_error_image_labeling}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{url.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rooms / Segments Table */}
      <Card>
        <CardHeader>
          <CardTitle>TABLE 2 - Rooms / Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap min-w-[120px]">floor_name</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">room_name</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[100px]">is_segment</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">dimensions_imperial</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">dimensions_metric</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[80px]">room_id</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[100px]">no_of_door</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">no_of_window</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">no_of_room_points</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">max_x_pixels</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">min_x_pixels</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">max_y_pixels</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">min_y_pixels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floorplanData.roomsSegments.map((room, index) => (
                  <TableRow key={index}>
                    <TableCell className="overflow-hidden text-ellipsis">{room.floor_name}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.room_name}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.is_segment ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.dimensions_imperial}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.dimensions_metric}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.room_id}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.no_of_door}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.no_of_window}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.no_of_room_points}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.max_x_pixels}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.min_x_pixels}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.max_y_pixels}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{room.min_y_pixels}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Total Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>TABLE 3 - Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap min-w-[120px]">floor_name</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">square_meters</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">square_feet</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">total_floors</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">total_joined_rooms</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[130px]">total_segments</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">total_points</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">total_doors</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">total_door_objects</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[130px]">total_windows</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[180px]">total_window_objects</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">list_of_objects</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[120px]">total_pixel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floorplanData.totalAreas.map((area, index) => (
                  <TableRow key={index}>
                    <TableCell className="overflow-hidden text-ellipsis">{area.floor_name}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.square_meters}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.square_feet}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_floors}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_joined_rooms}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_segments}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_points}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_doors}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_door_objects}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_windows}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_window_objects}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.list_of_objects}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{area.total_pixel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>TABLE 4 - Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap min-w-[150px]">max_area_metric</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[170px]">max_area_imperial</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">max_area_pixels</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[170px]">actual_area_pixels</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[110px]">pixel_ratio</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[130px]">scale_metric</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[150px]">scale_imperial</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[200px]">calculated_sq_area_metric</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[200px]">calculated_area_imperial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floorplanData.metrics.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.max_area_metric}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.max_area_imperial}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.max_area_pixels}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.actual_area_pixels}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.pixel_ratio}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.scale_metric}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.scale_imperial}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.calculated_sq_area_metric}</TableCell>
                    <TableCell className="overflow-hidden text-ellipsis">{metric.calculated_area_imperial}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Display floorplan images if available */}
      {floorplanData.urls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Floorplan Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {floorplanData.urls.map((url, index) => (
                url.original_url && (
                  <div key={index} className="border rounded-md overflow-hidden">
                    <img 
                      src={url.original_url} 
                      alt={`Floorplan ${index + 1}`}
                      className="w-full h-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                      }}
                    />
                    <div className="p-2 bg-gray-100 text-sm">Floorplan {index + 1}</div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FloorplanAnalysis3;
