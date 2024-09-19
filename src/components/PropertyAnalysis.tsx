import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "../components/contexts/AuthContext";
import { onMessage, removeMessageListener } from "../services/websocketServices";
import { Progress } from "@/components/ui/progress";
import CustomTick from './CustomTick';

interface PropertyData {
  property_url: string;
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
      }>;
    };
    overall_condition: {
      overall_condition_label: string;
      average_score: number;
      distribution: {
        [key: string]: number;
      };
      condition_distribution: {
        [key: string]: number;
      };
      areas_of_concern: number; // Changed from string to number
      confidence: string;
      explanation: string;
    };
  };
  Image_Analysis: Record<string, unknown>;
}


interface PropertyAnalysisProps {
  // data: PropertyData | null;
}


interface ProgressUpdate {
  stage: string;
  message: string;
  progress: number;
}


const PropertyAnalysis: React.FC<PropertyAnalysisProps> = ({ }) => {
  const { id, taskId: routeTaskId } = useParams<{ id: string; taskId?: string }>();
  const [url, setUrl] = useState<string>("");
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string>("");
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(routeTaskId || null);
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
      setTaskId(response.data.task_id);

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
      console.log("Analysis results received:", response.data);
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
  
    const conditionData = [
      {
        name: "Excellent",
        value: propertyData.stages.overall_condition?.condition_distribution?.["excellent"] ?? 0,
      },
      {
        name: "Above Average",
        value: propertyData.stages.overall_condition?.condition_distribution?.["above average"] ?? 0,
      },
      {
        name: "Average",
        value: propertyData.stages.overall_condition?.condition_distribution?.["average"] ?? 0,
      },
      {
        name: "Below Average",
        value: propertyData.stages.overall_condition?.condition_distribution?.["below average"] ?? 0,
      },
      {
        name: "Poor",
        value: propertyData.stages.overall_condition?.condition_distribution?.["poor"] ?? 0,
      },
    ];
  
    const allImages = Object.values(propertyData.stages.detailed_analysis ?? {})
      .flat()
      .map((item: any) => item.image_url)
      .filter(Boolean);
    
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
                {allImages.map((imageUrl, index) => (
                  <CarouselItem key={index}>
                    <img
                      src={imageUrl}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-64 object-cover rounded"
                    />
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
  
          {/* Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full flex justify-center mb-6">
              <TabsTrigger value="summary" className="flex-1">
                Summary
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex-1">
                Detailed Analysis
              </TabsTrigger>
            </TabsList>
  
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
                      {propertyData.stages.overall_condition?.overall_condition_label ?? 'N/A'}
                    </p>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">Average Score:</span>{" "}
                        {propertyData.stages.overall_condition?.average_score?.toFixed(2) ?? 'N/A'}
                      </p>
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
                        <YAxis allowDecimals={false} />
                        <Tooltip />
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
                          {key
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
                                    <img
                                      src={selectedImage}
                                      alt="Full size"
                                      className="w-full h-auto max-h-[80vh] object-contain"
                                    />
                                  </DialogContent>
                                )}
                              </Dialog>
                              <div>
                                <p className="text-lg font-semibold mb-2">
                                  Image {item.image_number}: {item.condition_label}
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
          <div className="mb-6">
            <p className="mb-2 text-gray-700">
              {progressUpdate.stage}: {progressUpdate.message}
            </p>
            <Progress value={progressUpdate.progress} className="w-full h-2 bg-gray-200" />
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