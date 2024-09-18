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
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosInstance from "..//utils/axiosConfig";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "../components/contexts/AuthContext";
import { onMessage, removeMessageListener } from "../services/websocketServices";


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
  data: PropertyData | null;
}


interface ProgressUpdate {
  stage: string;
  message: string;
  progress: number;
}


const PropertyAnalysis: React.FC<PropertyAnalysisProps> = ({ data: initialData }) => {
  const { id, taskId: routeTaskId } = useParams<{ id: string; taskId?: string }>();
  const [url, setUrl] = useState<string>("");
  const [data, setData] = useState<PropertyData | null>(initialData);
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
      setData(response.data.overall_analysis);
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
    setData(null);
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
        setData(response.data.overall_analysis);
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
    if (!data || !data.stages) return null;
  
    const conditionData = [
      {
        name: "Below Average",
        value: data.stages.overall_condition?.condition_distribution?.["below average"] ?? 0,
      },
      {
        name: "Average",
        value: data.stages.overall_condition?.condition_distribution?.["average"] ?? 0,
      },
      {
        name: "Above Average",
        value: data.stages.overall_condition?.condition_distribution?.["above average"] ?? 0,
      },
      {
        name: "Poor",
        value: data.stages.overall_condition?.condition_distribution?.["poor"] ?? 0,
      },
    ];
  
    const allImages = Object.values(data.stages.detailed_analysis ?? {})
      .flat()
      .map((item: any) => item.image_url)
      .filter(Boolean);
    
    return (
      <>
        <h1 className="text-xl font-bold mb-4">
          Property Analysis: {data.property_url}
        </h1>
  
        <Carousel className="mb-6 max-w-md mx-auto">
          <CarouselContent>
            {allImages.map((imageUrl, index) => (
              <CarouselItem key={index}>
                <img
                  src={imageUrl}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
  
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full flex justify-center mb-4">
            <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1">Detailed Analysis</TabsTrigger>
          </TabsList>
  
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Condition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {data.stages.overall_condition?.overall_condition_label ?? 'N/A'}
                  </p>
                  <p>
                    Average Score:{" "}
                    {data.stages.overall_condition?.average_score?.toFixed(2) ?? 'N/A'}
                  </p>
                  <p>Confidence: {data.stages.overall_condition?.confidence ?? 'N/A'}</p>
                  <p>
                    Areas of Concern:{" "}
                    {data.stages.overall_condition?.areas_of_concern ?? 'N/A'}
                  </p>
                </CardContent>
              </Card>
  
              <Card>
                <CardHeader>
                  <CardTitle>Condition Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={conditionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
  
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Detailed Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">
                    {data.stages.overall_condition?.explanation ?? 'No explanation available'}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
  
          <TabsContent value="detailed">
            <div className="space-y-8">
              {Object.entries(data.stages.detailed_analysis ?? {}).map(
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(analysis as any[]).map((item) => (
                          <div key={item.image_id} className="flex items-start space-y-2">
                            <Dialog>
                              <DialogTrigger>
                                <img
                                  src={item.image_url}
                                  alt={`Image ${item.image_number}`}
                                  className="w-24 h-24 object-cover rounded cursor-pointer"
                                  onClick={() => setSelectedImage(item.image_url)}
                                />
                              </DialogTrigger>
                              <DialogContent className="w-full max-w-3xl">
                                <img
                                  src={selectedImage || ''}
                                  alt="Full size image"
                                  className="w-full h-auto max-h-[80vh] object-contain"
                                />
                              </DialogContent>
                            </Dialog>
                            <div className="flex-grow">
                              <p className="text-sm font-semibold mb-1">
                                Image {item.image_number}: {item.condition_label}
                              </p>
                              <p className="text-sm">{item.reasoning}</p>
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
    <div className="container mx-auto p-4 max-w-4xl">
      {!id && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              type="text"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="Enter property URL"
              className="flex-grow"
            />
            <Button type="submit" disabled={dataLoading} className="w-full sm:w-auto">
              {dataLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <Alert className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisInProgress && progressUpdate && (
        <div className="mb-4">
          <p>{progressUpdate.stage}: {progressUpdate.message}</p>
          <progress value={progressUpdate.progress} max="100" className="w-full" />
        </div>
      )}

      {fetchingResults && (
        <div className="mb-4">
          <p>Fetching analysis results... Status: {analysisStatus}</p>
          <progress value={analysisProgress} max="100" className="w-full" />
        </div>
      )}

      {dataLoading && (
        <div className="mb-4">
          <p>Loading property data...</p>
        </div>
      )}

      {!dataLoading && !fetchingResults && data && renderAnalysis()}
    </div>
  );
};

export default PropertyAnalysis;