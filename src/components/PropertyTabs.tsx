// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { PropertyData } from "../types";
// import { DetailedAnalysis } from "./DetailedAnalysis";
// import { PropertyDataTab } from "./PropertyDataTab";
// import { PropertySummary } from "./PropertySummary";

// interface PropertyTabsProps {
//   propertyData: PropertyData;
// }

// export const PropertyTabs: React.FC<PropertyTabsProps> = ({ propertyData }) => {
//   return (
//     <Tabs defaultValue="summary" className="w-full">
//       <TabsList className="w-full flex justify-center mb-6">
//         <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
//         <TabsTrigger value="detailed" className="flex-1">Detailed Analysis</TabsTrigger>
//         <TabsTrigger value="property_data" className="flex-1">Property Data</TabsTrigger>
//       </TabsList>
      
//       <TabsContent value="summary">
//         <PropertySummary propertyData={propertyData} />
//       </TabsContent>
      
//       <TabsContent value="detailed">
//         <DetailedAnalysis propertyData={propertyData} />
//       </TabsContent>
      
//       <TabsContent value="property_data">
//         <PropertyDataTab propertyData={propertyData} />
//       </TabsContent>
//     </Tabs>
//   );
// };