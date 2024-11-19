// import { AnalysisForm } from "@/components/AnalysisForm";
// import { AnalysisProgress } from "@/components/AnalysisProgress";
// import { PropertyTabs } from "@/components/PropertyTabs";
// import { useAnalysis } from "@/hooks/useAnalysis";
// import React from "react";
// import { useNavigate, useParams } from "react-router-dom";

// const PropertyAnalysis: React.FC = () => {
//   const { id, taskId } = useParams<{ id: string; taskId?: string }>();
//   const navigate = useNavigate();
//   const {
//     url,
//     setUrl,
//     propertyData,
//     error,
//     dataLoading,
//     analysisInProgress,
//     progressUpdate,
//     fetchingResults,
//     handleSubmit,
//   } = useAnalysis(id, taskId, navigate);

//   return (
//     <div className="container mx-auto p-4 max-w-6xl">
//       {!id && <AnalysisForm url={url} setUrl={setUrl} onSubmit={handleSubmit} loading={dataLoading} />}
      
//       <AnalysisProgress
//         error={error}
//         analysisInProgress={analysisInProgress}
//         progressUpdate={progressUpdate}
//         fetchingResults={fetchingResults}
//         dataLoading={dataLoading}
//       />

//       {!dataLoading && !fetchingResults && propertyData && (
//         <PropertyTabs propertyData={propertyData} />
//       )}
//     </div>
//   );
// };

// export default PropertyAnalysis;

