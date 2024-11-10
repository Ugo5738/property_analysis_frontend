import ConditionScale from "@/components/ConditionScale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosInstance from "..//utils/axiosConfig";
import { useAuth } from "../components/contexts/AuthContext";
import { onMessage, removeMessageListener } from "../services/websocketServices";
import CustomTick from './CustomTick';


interface PropertyData {
  property_url: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  size: string;
  house_type: string;
  agent: string;
  description: string;
  image_urls: string[];
  floorplan_urls: string[];
  stages: {
    initial_categorization: Array<{
      category: string;
      details: {
        room_type?: string;
        exterior_type?: string;
        others?: string;
      };
    }>;
    grouped_images: {
      [key: string]: {
        [key: string]: number[];
      };
    };
    merged_images: {
      [key: string]: string[];
    };
    detailed_analysis: {
      [key: string]: Array<{
        image_number: number;
        condition_label: string;
        reasoning: string;
        image_url: string;
        image_id: number;
        condition_score: number;
      }>;
    };
    overall_condition: {
      overall_condition_label: string;
      average_score: number;
      label_distribution: {
        [key: string]: number;
      };
      total_assessments: number;
      areas_of_concern: number; // Changed from string to number
      confidence: string;
      explanation: string;
    };
  };
  Image_Analysis: Record<string, unknown>;
}


interface ProgressUpdate {
  stage: string;
  message: string;
  progress: number;
}


const PropertyAnalysis: React.FC<{}> = () => {
  // const { id, taskId: routeTaskId } = useParams<{ id: string; taskId?: string }>();
  const { id, taskId } = useParams<{ id: string; taskId?: string }>();
  const [url, setUrl] = useState<string>("");
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string>("");
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [fetchingResults, setFetchingResults] = useState(false);
  // const [taskId, setTaskId] = useState<string | null>(routeTaskId || null);
  const { isConnected, connectToWebSocket } = useAuth();

  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(!!taskId);

  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isConnected) {
      connectToWebSocket();
    }

    if (id) {
      fetchPropertyData(id);
    }

    if (taskId) {
      setAnalysisInProgress(true);
      const handleMessage = (message: any) => {
        console.log("Received WebSocket message:", message);
        if (message.type === 'analysis_progress') {
          setProgressUpdate(message.message);
          if (message.message.stage === 'error') {
            setError(message.message.message);
            setAnalysisInProgress(false);
          } else if (message.message.stage === 'complete') {
            console.log("Analysis complete, fetching results...");
            setAnalysisInProgress(false);
            fetchAnalysisResults();
          }
        }
      };
  
      onMessage(handleMessage);
      
      return () => {
        removeMessageListener(handleMessage);
      };
    }
  }, [id, isConnected, connectToWebSocket, taskId]);

  // Optionally, update analysisInProgress when taskId changes
  useEffect(() => {
    setAnalysisInProgress(!!taskId);
  }, [taskId]);

  const fetchPropertyData = async (propertyId: string) => {
    setDataLoading(true);
    try {
      const response = await axiosInstance.get(`/api/analysis/properties/${propertyId}/`);
      console.log("Fetched property data:", response.data);
      setPropertyData(response.data.overall_analysis);
    } catch (error) {
      console.error("Error fetching property data:", error);
      setError("Failed to fetch property data. Please try again.");
    } finally {
      setDataLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }
    setError("");
    setDataLoading(true);
    setPropertyData(null);
    setProgressUpdate(null);

    try {
      const response = await axiosInstance.post(`/api/analysis/properties/analyze/`, { url }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("Analysis initiated, task ID:", response.data.task_id);
      // setTaskId(response.data.task_id);

      // Navigate to the analysis page with the taskId
      navigate(`/property-analysis/${response.data.property_id}/${response.data.task_id}`);
    } catch (error) {
      console.error("Error initiating analysis:", error);
      setError("An error occurred while analyzing the property. Please try again.");
      setDataLoading(false);
    }
  };

  const fetchAnalysisResults = async () => {
    if (!taskId) return;

    setFetchingResults(true);
    try {
      const response = await axiosInstance.get(`/api/analysis/properties/${taskId}/results/`);
      // console.log("Analysis results received:", response.data);
      if (response.status === 202) {
        // Analysis not yet complete
        setAnalysisStatus(response.data.status);
        setAnalysisProgress(response.data.progress);
        // Retry after a delay
        setTimeout(fetchAnalysisResults, 5000);
      } else if (response.data) {
        setPropertyData(response.data.overall_analysis);
        setAnalysisInProgress(false);
      } else {
        console.error("No data received from the server");
        setError("No analysis results received. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching analysis results:", error);
      setError("Failed to fetch analysis results. Please try again.");
    } finally {
      setFetchingResults(false);
    }
  };

  const renderAnalysis = () => {
    if (!propertyData || !propertyData.stages) return null;

    // Extract data from propertyData
    const overallCondition = propertyData.stages.overall_condition ?? {};
    const labelDistribution = overallCondition.label_distribution ?? {};
    const totalAssessments = overallCondition.total_assessments ?? 0;

    // Log the data for debugging
    console.log('Overall Condition:', overallCondition);
    console.log('Label Distribution:', labelDistribution);
    console.log('Total Assessments:', totalAssessments);

    // Check if totalAssessments is zero
    if (totalAssessments === 0) {
      console.warn('Total assessments is zero. The condition distribution chart will be empty.');
    }

    const allLabels = ["Excellent", "Above Average", "Below Average", "Poor"];

    // Construct conditionData
    const conditionData = allLabels.map((label) => ({
      name: label,
      value: Number(labelDistribution[label] || 0) * Number(totalAssessments),
    }));

    // Log conditionData
    console.log('Condition Data:', conditionData);

    const analyzedImages = Object.values(propertyData.stages.detailed_analysis ?? {})
      .flat()
      .map((item: any) => item.image_url)
      .filter(Boolean);
    
    const totalPropertyImages = propertyData.stages.initial_categorization.length;
    const totalAnalyzedImages = analyzedImages.length;
    const totalSkippedImages = totalPropertyImages - totalAnalyzedImages;

    const groupedImages = [];
    for (let i = 0; i < analyzedImages.length; i += 3) {
      groupedImages.push(analyzedImages.slice(i, i + 3));
    }

    return (
      <>
        <h1 className="text-2xl font-bold mb-6">
          Property Analysis
        </h1>

        {/* Property URL */}
        <div className="mb-6">
          <p className="text-gray-600">Analyzing property:</p>
          <a
            href={propertyData.property_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            {propertyData.property_url}
          </a>
        </div>

        {/* Image Carousel */}
        <div className="mb-8">
          <Carousel className="relative">
            <CarouselContent>
              {/* {analyzedImages.map((imageUrl, index) => ( */}
              {groupedImages.map((imageGroup, index) => (
                <CarouselItem key={index}>
                  <div className="flex space-x-4">
                  {/* <div className="w-full h-64 flex justify-center items-center bg-gray-100"> */}
                  {imageGroup.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className="w-1/3 h-64 flex justify-center items-center bg-gray-100"
                    >
                    <img
                      src={imageUrl}
                      alt={`Property image ${index + 1}`}
                      className="max-h-full object-contain rounded"
                      // className="w-full h-64 object-cover rounded"
                    />
                  </div>
                  ))}
                </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow">
              {/* Left Arrow Icon */}
            </CarouselPrevious>
            <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow">
              {/* Right Arrow Icon */}
            </CarouselNext>
            {/* Indicators (Optional) */}
            {/* <CarouselIndicators /> */}
          </Carousel>
        </div>

        {totalSkippedImages > 0 && (
          <Alert variant="info" className="mb-6">
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>
              {totalSkippedImages} out of {totalPropertyImages} images were not included in the analysis.
              These images may have been categorized as "others" or could not be analyzed due to insufficient data.
            </AlertDescription>
          </Alert>
        )}

        {/* {skippedImages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Skipped Images</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {skippedImages.map((img, index) => (
                <div key={index} className="flex flex-col items-center">
                  <img
                    src=<Provide the image URL here>
                    alt={`Skipped Image ${img.image_id}`}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                  <p className="text-gray-600 text-sm">Category: {img.category}</p>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full flex justify-center mb-6">
            <TabsTrigger value="summary" className="flex-1">
              Summary
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1">
              Detailed Analysis
            </TabsTrigger>
            <TabsTrigger value="property_data" className="flex-1">
              Property Data
            </TabsTrigger>
          </TabsList>
          
          {/* Property Data Tab */}
          <TabsContent value="property_data">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Address</h2>
                <p>{propertyData.address}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Price</h2>
                <p>{propertyData.price}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Bedrooms</h2>
                <p>{propertyData.bedrooms}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Bathrooms</h2>
                <p>{propertyData.bathrooms}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Size</h2>
                <p>{propertyData.size}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">House Type</h2>
                <p>{propertyData.house_type}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Agent</h2>
                <p>{propertyData.agent}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p>{propertyData.description}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {propertyData.image_urls.map((imageUrl, index) => (
                    <img key={index} src={imageUrl} alt={`Image ${index + 1}`} className="w-full h-auto rounded" />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Floorplans</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {propertyData.floorplan_urls.map((floorplanUrl, index) => (
                    <img key={index} src={floorplanUrl} alt={`Floorplan ${index + 1}`} className="w-full h-auto rounded" />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Condition Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Condition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-4">
                    {/* {propertyData.stages.overall_condition?.overall_condition_label ?? 'N/A'} */}
                    {propertyData.stages.overall_condition?.overall_condition_label ?? 'N/A'} ({propertyData.stages.overall_condition?.average_score}%)
                  </p>
                  <div className="space-y-2">
                    <ConditionScale 
                      score={propertyData.stages.overall_condition?.average_score ?? 0}
                      label={propertyData.stages.overall_condition?.overall_condition_label ?? 'N/A'}
                    />
                    <p>
                      <span className="font-semibold">Confidence:</span>{" "}
                      {propertyData.stages.overall_condition?.confidence ?? 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold">Areas of Concern:</span>{" "}
                      {propertyData.stages.overall_condition?.areas_of_concern ?? 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Condition Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Condition Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={conditionData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        interval={0} // Ensures all labels are shown
                        tick={CustomTick} // Improves readability
                        height={60} // Provides more space for angled labels
                      />
                      <YAxis allowDecimals={false} domain={[0, Math.max(totalAssessments, 10)]} />
                      <Tooltip content={({ payload, }) => {
                        if (!payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border p-2 rounded shadow">
                            <p className="font-semibold">{data.name}</p>
                            <p>{data.value} assessments</p>
                            {data.name === "Others" && (
                              <p className="text-sm text-gray-600">Includes miscellaneous spaces not categorized.</p>
                            )}
                          </div>
                        );
                      }} />
                      <Bar dataKey="value" fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed Explanation */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Detailed Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 leading-relaxed space-y-4">
                    {propertyData.stages.overall_condition?.explanation ? (
                      <>
                        {propertyData.stages.overall_condition.explanation.split('\n').map((para, idx) => (
                          <p key={idx} className="mb-2 flex items-start">
                            <span>{para}</span>
                          </p>
                        ))}
                      </>
                    ) : (
                      <p>No explanation available.</p>
                    )}
                  </div>
                </CardContent>

              </Card>
            </div>
          </TabsContent>

          {/* Detailed Analysis Tab */}
          <TabsContent value="detailed">
            <div className="space-y-8">
              {Object.entries(propertyData.stages.detailed_analysis ?? {}).map(
                ([key, analysis]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle>
                        {(key === "others" ? "Others" : key)
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(analysis as any[]).map((item) => (
                          <div key={item.image_id} className="flex space-x-4">
                            <Dialog
                              onOpenChange={(open) =>
                                !open && setSelectedImage(null)
                              }
                            >
                              <DialogTrigger asChild>
                                <div
                                  className="w-32 h-32 flex-shrink-0 cursor-pointer"
                                  onClick={() =>
                                    setSelectedImage(item.image_url)
                                  }
                                >
                                  <img
                                    src={item.image_url}
                                    alt={`Image ${item.image_number}`}
                                    className="w-full h-full object-cover rounded"
                                  />
                                </div>
                              </DialogTrigger>
                              {selectedImage && (
                                <DialogContent className="w-full max-w-3xl">
                                {/* Dialog Title (Hidden Visually) */}
                                <DialogTitle>
                                  <VisuallyHidden>Full-size Property Image</VisuallyHidden>
                                </DialogTitle>
                                
                                {/* Dialog Description */}
                                <DialogDescription>
                                  This is a full-size view of the property image number {item.image_number}.
                                </DialogDescription>
                                
                                {/* Image */}
                                <img
                                  src={selectedImage}
                                  alt={`Full-size image of property ${item.image_number}`}
                                  className="w-full h-auto max-h-[80vh] object-contain"
                                />
                                </DialogContent>                            
                              )}
                            </Dialog>
                            <div>
                              <p className="text-lg font-semibold mb-2">
                                Image {item.image_number}: {item.condition_label} ({item.condition_score}%)
                              </p>
                              <p className="text-gray-700">{item.reasoning}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Analysis Form */}
      {!id && (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Input
              type="text"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="Enter property URL"
              className="flex-grow"
            />
            <Button
              type="submit"
              disabled={dataLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {dataLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </form>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      {analysisInProgress && progressUpdate && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md px-4">
            <p className="mb-4 text-gray-700 text-center">
              {progressUpdate.stage.charAt(0).toUpperCase() + progressUpdate.stage.slice(1)}: {progressUpdate.message}
            </p>
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 bg-[length:200%_100%] animate-gradient"
                style={{
                  width: `${progressUpdate.progress}%`,
                  transition: 'width 0.5s ease-in-out',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Fetching Results Indicator */}
      {fetchingResults && (
        <div className="mb-6">
          <p className="mb-2 text-gray-700">
            Fetching analysis results... Status: {analysisStatus}
          </p>
          <Progress value={analysisProgress} className="w-full h-2 bg-gray-200" />
        </div>
      )}

      {/* Loading Indicator */}
      {dataLoading && (
        <div className="mb-6">
          <p className="text-gray-700">Loading property data...</p>
        </div>
      )}

      {/* Render Analysis */}
      {!dataLoading && !fetchingResults && propertyData && renderAnalysis()}
    </div>
  );
};
  

export default PropertyAnalysis;