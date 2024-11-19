// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
// import { VisuallyHidden } from "@/components/ui/visually-hidden";
// import React, { useState } from 'react';
// import { PropertyData } from '../types';

// interface DetailedAnalysisProps {
//   propertyData: PropertyData;
// }

// export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ propertyData }) => {
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);

//   return (
//     <div className="space-y-8">
//       {Object.entries(propertyData.overall_analysis.stages.detailed_analysis ?? {}).map(
//         ([key, analysis]) => (
//           <Card key={key}>
//             <CardHeader>
//               <CardTitle>
//                 {(key === "others" ? "Others" : key)
//                   .replace(/_/g, " ")
//                   .replace(/\b\w/g, (l) => l.toUpperCase())}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                 {Array.isArray(analysis) && analysis.map((item) => (
//                   <div key={item.image_id} className="flex space-x-4">
//                     <div
//                       className="w-32 h-32 flex-shrink-0 cursor-pointer"
//                       onClick={() => setSelectedImage(item.image_url)}
//                     >
//                       <img
//                         src={item.image_url}
//                         alt={`Image ${item.image_number}`}
//                         className="w-full h-full object-cover rounded"
//                       />
//                     </div>
//                     <div>
//                       <p className="text-lg font-semibold mb-2">
//                         Image {item.image_number}: {item.condition_label} ({item.condition_score}%)
//                       </p>
//                       <p className="text-gray-700">{item.reasoning}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )
//       )}

//       <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
//         <DialogContent className="max-w-4xl">
//           <DialogTitle>
//             <VisuallyHidden>Full-size Property Image</VisuallyHidden>
//           </DialogTitle>
//           <DialogDescription>
//             Detailed view of the selected property image.
//           </DialogDescription>
//           {selectedImage && (
//             <img
//               src={selectedImage}
//               alt="Full size property view"
//               className="w-full h-auto max-h-[80vh] object-contain"
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };