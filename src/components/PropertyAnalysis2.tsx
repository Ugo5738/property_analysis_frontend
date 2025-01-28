// import {
//     Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious
// } from "@/components/ui";
// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useAuth } from "../components/contexts/AuthContext";
// import { onMessage, removeMessageListener } from "../services/websocketServices";
// import axiosInstance from "../utils/axiosConfig";

// // Type definitions moved to separate interfaces
// interface AnalysisStages {
//   initial_categorization: Array<{
//     category: string;
//     details: {
//       room_type?: string;
//       exterior_type?: string;
//       others?: string;
//     };
//   }>;
//   grouped_images: {
//     [key: string]: {
//       [key: string]: number[];
//     };
//   };
//   merged_images: {
//     [key: string]: string[];
//   };
//   detailed_analysis: {
//     [key: string]: Array<DetailedAnalysisItem>;
//   };
//   overall_condition: OverallCondition;
//   floorplan_analysis?: FloorplanAnalysis[];
// }

// interface DetailedAnalysisItem {
//   condition_label: string;
//   condition_score: number;
//   image_id: number;
//   image_number: number;
//   image_url: string;
//   reasoning: string;
//   similarities: { [key: string]: number };
// }

// interface OverallCondition {
//   overall_condition_label: string;
//   average_score: number;
//   label_distribution: { [key: string]: number };
//   total_assessments: number;
//   areas_of_concern: number;
//   confidence: string;
//   explanation: string;
// }

// interface FloorplanAnalysis {
//   url: string;
//   analysis: {
//     color: string;
//     dimension_type: string;
//     drawing_type: string;
//     background_image_in_blueprint: boolean;
//     number_buildings: number;
//     number_floors: number;
//     bay_windows: boolean;
//     curved_walls_windows: boolean;
//     garden: boolean;
//     total_square_area: string;
//     main_building_square_area: string;
//     compass_direction: string;
//     key_observations: string;
//   };
// }

// // Extracted components for better organization
// const ProgressIndicator: React.FC<{
//   progressUpdate: ProgressUpdate | null;
// }> = ({ progressUpdate }) => {
//   if (!progressUpdate) return null;
  
//   return (
//     <div className="w-full max-w-md px-4">
//       <p className="mb-4 text-gray-700 text-center">
//         {progressUpdate.stage.charAt(0).toUpperCase() + progressUpdate.stage.slice(1)}: {progressUpdate.message}
//       </p>
//       <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
//         <div
//           className="h-full bg-gradient-to-r from-blue-500 to-green-500 bg-[length:200%_100%] animate-gradient"
//           style={{
//             width: `${progressUpdate.progress}%`,
//             transition: 'width 0.5s ease-in-out',
//           }}
//         />
//       </div>
//     </div>
//   );
// };

// const ImageCarousel: React.FC<{
//   images: string[];
// }> = ({ images }) => {
//   const groupedImages = [];
//   for (let i = 0; i < images.length; i += 3) {
//     groupedImages.push(images.slice(i, i + 3));
//   }

//   return (
//     <Carousel className="relative w-full">
//       <CarouselContent>
//         {groupedImages.map((imageGroup, index) => (
//           <CarouselItem key={index}>
//             <div className="flex gap-2 md:gap-4">
//               {imageGroup.map((imageUrl, idx) => (
//                 <div key={idx} className="relative w-full md:w-1/3">
//                   <div className="relative h-48 sm:h-64 w-full">
//                     <img
//                       src={imageUrl}
//                       alt={`Property image ${index * 3 + idx + 1}`}
//                       className="absolute inset-0 w-full h-full object-cover rounded"
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CarouselItem>
//         ))}
//       </CarouselContent>
//       <CarouselPrevious />
//       <CarouselNext />
//     </Carousel>
//   );
// };

// // Custom hooks for data fetching and WebSocket handling
// const usePropertyData = (id: string, shareToken?: string) => {
//   const [data, setData] = useState<PropertyData | null>(null);
//   const [error, setError] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const endpoint = shareToken 
//         ? `/api/orchestration/properties/${id}/shared/${shareToken}/`
//         : `/api/orchestration/properties/${id}/`;
//       const response = await axiosInstance.get(endpoint);
//       setData(response.data);
//     } catch (error) {
//       setError("Failed to fetch property data. Please try again.");
//       console.error("Error fetching property data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (id) {
//       fetchData();
//     }
//   }, [id, shareToken]);

//   return { data, error, loading, refetch: fetchData };
// };

// const useWebSocketConnection = (taskId: string | undefined, isSharedView: boolean) => {
//   const { isConnected, connectToWebSocket } = useAuth();
//   const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);

//   useEffect(() => {
//     if (!isConnected && !isSharedView) {
//       connectToWebSocket();
//     }

//     if (!isSharedView && taskId) {
//       const handleMessage = (message: any) => {
//         if (message.type === 'analysis_progress') {
//           setProgressUpdate(message.message);
//         }
//       };

//       onMessage(handleMessage);
//       return () => removeMessageListener(handleMessage);
//     }
//   }, [taskId, isConnected, isSharedView]);

//   return { progressUpdate };
// };

// // Main component with improved organization
// const PropertyAnalysis: React.FC = () => {
//   const { id, taskId, shareToken } = useParams<{ id: string; taskId?: string; shareToken?: string }>();
//   const isSharedView = !!shareToken;
  
//   const { data: propertyData, error, loading, refetch } = usePropertyData(id ?? "", shareToken);
//   const { progressUpdate } = useWebSocketConnection(taskId, isSharedView);
  
//   // Rest of the component implementation...
//   // (Note: The rest of the implementation remains similar but uses the new helper components and hooks)

//   return (
//     <div className="container mx-auto p-4 max-w-6xl">
//       {/* Existing JSX with improved organization */}
//     </div>
//   );
// };

// export default PropertyAnalysis;