// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { PropertyData } from "../types";
// import { ImageGallery } from "./ImageGallery";

// interface PropertyDataTabProps {
//   propertyData: PropertyData;
// }

// export const PropertyDataTab: React.FC<PropertyDataTabProps> = ({ propertyData }) => {
//   const propertyFields = [
//     { label: "Address", value: propertyData.address },
//     { label: "Price", value: propertyData.price },
//     { label: "Bedrooms", value: propertyData.bedrooms },
//     { label: "Bathrooms", value: propertyData.bathrooms },
//     { label: "Size", value: propertyData.size },
//     { label: "House Type", value: propertyData.house_type },
//     { label: "Agent", value: propertyData.agent },
//   ];

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       {/* Basic Property Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Property Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {propertyFields.map((field) => (
//               <div key={field.label} className="flex justify-between items-center">
//                 <span className="font-medium text-gray-600">{field.label}</span>
//                 <span>{field.value}</span>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Property Description */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Description</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-gray-700 whitespace-pre-line">{propertyData.description}</p>
//         </CardContent>
//       </Card>

//       {/* Property Images */}
//       <Card className="col-span-1 md:col-span-2">
//         <CardHeader>
//           <CardTitle>Property Images</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ImageGallery images={propertyData.image_urls} />
//         </CardContent>
//       </Card>

//       {/* Floorplans */}
//       {propertyData.floorplan_urls?.length > 0 && (
//         <Card className="col-span-1 md:col-span-2">
//           <CardHeader>
//             <CardTitle>Floorplans</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ImageGallery images={propertyData.floorplan_urls} />
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };