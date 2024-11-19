// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// import { useState } from "react";

// interface ImageGalleryProps {
//   images: string[];
// }

// export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);

//   return (
//     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//       {images.map((imageUrl, index) => (
//         <div
//           key={index}
//           className="aspect-square cursor-pointer overflow-hidden rounded-lg"
//           onClick={() => setSelectedImage(imageUrl)}
//         >
//           <img
//             src={imageUrl}
//             alt={`Image ${index + 1}`}
//             className="w-full h-full object-cover hover:scale-105 transition-transform"
//           />
//         </div>
//       ))}

//       <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
//         <DialogContent className="max-w-4xl">
//           <DialogTitle>Full Size Image</DialogTitle>
//           {selectedImage && (
//             <img
//               src={selectedImage}
//               alt="Full size view"
//               className="w-full h-auto max-h-[80vh] object-contain"
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };
