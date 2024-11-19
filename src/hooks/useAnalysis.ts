// import { useState } from "react";
// import { useAuth } from "../components/contexts/AuthContext";
// import { ProgressUpdate, PropertyData } from "../types";

// export const useAnalysis = (id: string | undefined, taskId: string | undefined, navigate: any) => {
//   const [url, setUrl] = useState<string>("");
//   const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
//   const [error, setError] = useState<string>("");
//   const [dataLoading, setDataLoading] = useState<boolean>(false);
//   const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
//   const [fetchingResults, setFetchingResults] = useState(false);
//   const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(!!taskId);
//   const { isConnected, connectToWebSocket } = useAuth();

//   // ... Rest of the useAnalysis hook implementation (fetchPropertyData, handleSubmit, etc.)
//   // Include all the existing analysis logic from the original component

//   return {
//     url,
//     setUrl,
//     propertyData,
//     error,
//     dataLoading,
//     analysisInProgress,
//     progressUpdate,
//     fetchingResults,
//     handleSubmit,
//   };
// };