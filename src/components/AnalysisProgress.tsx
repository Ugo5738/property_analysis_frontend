import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import React from 'react';
import { ProgressUpdate } from '../types';

interface AnalysisProgressProps {
  error: string;
  analysisInProgress: boolean;
  progressUpdate: ProgressUpdate | null;
  fetchingResults: boolean;
  dataLoading: boolean;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  error,
  analysisInProgress,
  progressUpdate,
  fetchingResults,
  dataLoading
}) => {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisInProgress && progressUpdate && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md px-4">
            <p className="mb-4 text-gray-700 text-center">
              {progressUpdate.stage.charAt(0).toUpperCase() + progressUpdate.stage.slice(1)}: {progressUpdate.message}
            </p>
            <Progress value={progressUpdate.progress} className="w-full" />
          </div>
        </div>
      )}

      {fetchingResults && (
        <div className="mb-6">
          <p className="mb-2 text-gray-700">Fetching analysis results...</p>
          <Progress value={undefined} className="w-full" />
        </div>
      )}

      {dataLoading && (
        <div className="mb-6">
          <p className="text-gray-700">Loading property data...</p>
          <Progress value={undefined} className="w-full" />
        </div>
      )}
    </>
  );
};