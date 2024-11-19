// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import React from 'react';
// import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// import { PropertyData } from '../types';
// import ConditionScale from './ConditionScale';
// import CustomTick from './CustomTick';

// interface PropertySummaryProps {
//   propertyData: PropertyData;
// }

// export const PropertySummary: React.FC<PropertySummaryProps> = ({ propertyData }) => {
//   const overallCondition = propertyData.overall_analysis.stages.overall_condition;
//   const labelDistribution = overallCondition.label_distribution;
//   const totalAssessments = overallCondition.total_assessments;

//   const conditionData = ["Excellent", "Above Average", "Below Average", "Poor"].map((label) => ({
//     name: label,
//     value: Number(labelDistribution[label] || 0) * Number(totalAssessments),
//   }));

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       {/* Overall Condition Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Overall Condition</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-3xl font-bold mb-4">
//             {overallCondition.overall_condition_label} ({overallCondition.average_score}%)
//           </p>
//           <div className="space-y-2">
//             <ConditionScale 
//               score={overallCondition.average_score}
//               label={overallCondition.overall_condition_label}
//             />
//             <p>
//               <span className="font-semibold">Confidence:</span>{" "}
//               {overallCondition.confidence}
//             </p>
//             <p>
//               <span className="font-semibold">Areas of Concern:</span>{" "}
//               {overallCondition.areas_of_concern}
//             </p>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Condition Distribution Chart */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Condition Distribution</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={250}>
//             <BarChart data={conditionData} margin={{ bottom: 60 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis
//                 dataKey="name"
//                 interval={0}
//                 tick={CustomTick}
//                 height={60}
//               />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Bar dataKey="value" fill="#6366F1" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       {/* Detailed Explanation */}
//       <Card className="col-span-1 md:col-span-2">
//         <CardHeader>
//           <CardTitle>Detailed Explanation</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="text-gray-700 leading-relaxed space-y-4">
//             {overallCondition.explanation ? (
//               overallCondition.explanation.split('\n').map((para, idx) => (
//                 <p key={idx} className="mb-2">{para}</p>
//               ))
//             ) : (
//               <p>No explanation available.</p>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };
