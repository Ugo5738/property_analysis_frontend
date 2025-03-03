import { useParams } from "react-router-dom";
import PropertyAnalysis from "./PropertyAnalysis";

const PropertyAnalysisWrapper = () => {
  // Get URL parameters (both id and taskId, if available)
  const { id, taskId } = useParams();
  // Create a unique key using id and taskId (or a default if taskId is missing)
  const key = `${id}-${taskId || "no-task"}`;
  
  return <PropertyAnalysis key={key} />;
};

export default PropertyAnalysisWrapper;
