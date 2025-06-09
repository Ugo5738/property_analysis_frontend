import ConditionScale from "@/components/ConditionScale";
import ShareButton from '@/components/ShareButton';
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
import FloorplanAnalysis2 from './FloorplanAnalysis2';
import FloorplanAnalysis3 from './FloorplanAnalysis3';
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

interface SentimentAnalysis {
  key_phrases: string[];
  tone_analysis: { [key: string]: number };
  sentiment_score: number;
  overall_sentiment: string;
  improvement_suggestions: string[];
  marketing_effectiveness: string;
}

interface DescriptionAnalysis {
  rating: string;
  label: string;
}

interface PropertySpace {
  category: string;
  spacePercentage: number;  // e.g., 30 for 30%
  sqft: number;
  sqm: number;
  costSpace: number;        // or string if your backend sends e.g. "£93,363"
  otherCost: number;        // or string
}

interface DetailedViewItem {
  floor: string;            // e.g., "Ground Floor"
  spaceType: string;        // e.g., "Living"
  spaceName: string;        // e.g., "Snug"
  areaSqftPercentage: number;
  areaSqft: number;
  areaSqm: number;
  pricePerSpace: number;    // or string
}

interface FloorplanAnalysis2 {
  propertySpaces: PropertySpace[];
  detailedView: DetailedViewItem[];
}

interface SentimentAnalysis {
  key_phrases: string[];
  tone_analysis: { [key: string]: number };
  sentiment_score: number;
  overall_sentiment: string;
  improvement_suggestions: string[];
  marketing_effectiveness: string;
}

interface DescriptionAnalysis {
  rating: string;
  label: string;
}

export interface PropertyData {
  id: number;
  url: string;
  property_url: string;
  share_token: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  size: string;
  house_type: string;
  agent: string;
  description: string;
  reviewed_description: string;
  image_urls: string[];
  floorplan_urls: string[];
  sentiment_analysis?: SentimentAnalysis;
  description_analysis?: DescriptionAnalysis;
  overall_condition: {
    areas_of_concern: number;
    average_score: number;
    confidence: string;
    explanation: string;
    label_distribution: { [key: string]: number };
    overall_condition_label: string;
    total_assessments: number;
  };
  detailed_analysis: {
    [key: string]: Array<{
      condition_label: string;
      condition_score: number;
      image_id: number;
      image_number: number;
      image_url: string;
      reasoning: string;
      similarities: { [key: string]: number };
    }>;
  };
  images: Array<{
    id: number;
    image: string;
    original_url: string;
    main_category: string;
    sub_category: string;
    room_type: string;
    reasoning: string;
  }>;
  failed_downloads: any[];
  overall_analysis: {
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
          condition_label: string;
          condition_score: number;
          image_id: number;
          image_number: number;
          image_url: string;
          reasoning: string;
          similarities: { [key: string]: number };
        }>;
      };
      overall_condition: {
        overall_condition_label: string;
        average_score: number;
        label_distribution: {
          [key: string]: number;
        };
        total_assessments: number;
        areas_of_concern: number;
        confidence: string;
        explanation: string;
      };
      floorplan_analysis?: Array<{
        url: string;
        analysis: {
          color: string;
          dimension_type: string;
          drawing_type: string;
          background_image_in_blueprint: boolean;
          number_buildings: number;
          number_floors: number;
          bay_windows: boolean;
          curved_walls_windows: boolean;
          garden: boolean;
          total_square_area: string;
          main_building_square_area: string;
          compass_direction: string;
          key_observations: string;
        };
      }>;
      // New Floorplan Analysis 2
      floorplan_analysis_2?: FloorplanAnalysis2;
    };
  };
}


interface ProgressUpdate {
  stage: string;
  message: string;
  progress: number;
}


const PropertyAnalysis: React.FC<{}> = () => {
  const { id, taskId, shareToken } = useParams<{ id: string; taskId?: string; shareToken?: string }>();
  const [url, setUrl] = useState<string>("");
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string>("");
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [fetchingResults, setFetchingResults] = useState(false);
  const { isConnected, connectToWebSocket } = useAuth();

  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(!!taskId);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();  
  const { loginWithToken } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const whatsappToken = queryParams.get('token');

  // Check if we are in shared read-only mode:
  const isSharedView = !!shareToken; // If shareToken is present in URL, it's a shared link.

  useEffect(() => {
    // If we are in shared mode, we do NOT attempt to log in or authenticate the user.
    if (isSharedView && id && shareToken && taskId) {
      fetchSharedPropertyData(id, shareToken);
      return;
    }

    if (whatsappToken) {
      try {
        loginWithToken(whatsappToken).then(() => {
          // Proceed to fetch property data
          if (id) {
            fetchPropertyData(id);
          }
        })
        // Authentication successful
        setAuthenticated(true);
      } catch (error) {
        console.error('Token authentication failed:', error);
        setError('Authentication failed. Please try again.');
      };
    } else {
      // No token present
      // Check if user is authenticated via session
      const checkAuthentication = async () => {
        try {
          const response = await axiosInstance.get('/api/auth/check-authenticated/');
          if (response.status === 200) {
            setAuthenticated(true);
            if (id) {
              fetchPropertyData(id);
            }
          } else {
            // Not authenticated
            navigate('/enter-phone');
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          navigate('/enter-phone');
        }
      };
      checkAuthentication();
    }
  }, [whatsappToken, id, navigate, isSharedView, shareToken, taskId, loginWithToken]);
  
  useEffect(() => {
    if (!isConnected && !isSharedView) {
      connectToWebSocket();
    }

    if (!isSharedView && taskId && !analysisComplete) {
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
            setAnalysisComplete(true);
            fetchAnalysisResults();
          }
        }
      };
  
      onMessage(handleMessage);
      
      return () => {
        removeMessageListener(handleMessage);
      };
    }
  }, [id, isConnected, connectToWebSocket, taskId, isSharedView]);

  // Optionally, update analysisInProgress when taskId changes
  useEffect(() => {
    setAnalysisInProgress(!!taskId);
  }, [taskId]);

  const handleCompare = () => {
    navigate("/compare");
  };

  const fetchPropertyData = async (propertyId: string) => {
    setDataLoading(true);
  
    try {
      const response = await axiosInstance.get(`/api/orchestration/properties/${propertyId}/`);
      console.log("Fetched property data:", response.data);
      setPropertyData(response.data);
    } catch (error) {
      console.error("Error fetching property data:", error);
      setError("Failed to fetch property data. Please try again.");
    } finally {
      setDataLoading(false);
    }
  };

  const fetchSharedPropertyData = async (propertyId: string, shareToken: string) => {
    setDataLoading(true);
    try {
      const response = await axiosInstance.get(`/api/orchestration/properties/${propertyId}/shared/${shareToken}/`);
      console.log("Fetched shared property data:", response.data);
      setPropertyData(response.data);
      // Note: No WebSocket or progress updates in shared mode,
      // this is a static view of the completed analysis.
      setAnalysisInProgress(false);
      setAuthenticated(false); // They are not logged in as the owner.
    } catch (error) {
      console.error("Error fetching shared property data:", error);
      setError("Failed to fetch shared property data. Please try again.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDataLoading(true);
    setPropertyData(null);
    setProgressUpdate(null);

    try {
      const response = await axiosInstance.post(
        `/api/orchestration/properties/analyze/`,
        {
          url
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
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

    // setFetchingResults(true);
    try {
      const response = await axiosInstance.get(`/api/orchestration/properties/${taskId}/results/`);
      if (response.status === 202) {
        // Analysis not yet complete
        setAnalysisStatus(response.data.status);
        setAnalysisProgress(response.data.progress);

        // Show fetching state now (only while we continue polling)
        setFetchingResults(true);
        
        // Retry after a delay
        setTimeout(fetchAnalysisResults, 5000);
      } else if (response.data) {
        // Final results
        setPropertyData(response.data);
        setAnalysisInProgress(false);
        
        // Analysis is done, so no more fetching
        setAnalysisComplete(true);
        setFetchingResults(false);
      } else {
        console.error("No data received from the server");
        setError("No analysis results received. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching analysis results:", error);
      setError("Failed to fetch analysis results. Please try again.");
    }
  };

  const renderAnalysis = () => {
    if (!propertyData?.overall_analysis?.stages) return null;

    // Extract data from propertyData
    const overallCondition = propertyData.overall_analysis.stages.overall_condition ?? {};
    const labelDistribution = overallCondition.label_distribution ?? {};
    const totalAssessments = overallCondition.total_assessments ?? 0;

    // Log the data for debugging
    // console.log('Overall Condition:', overallCondition);
    // console.log('Label Distribution:', labelDistribution);
    // console.log('Total Assessments:', totalAssessments);

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

    const analyzedImages = Object.values(propertyData.overall_analysis.stages.detailed_analysis ?? {})
      .flat()
      .map((item: any) => item.image_url)
      .filter(Boolean);
    
    // console.log('Analyzed Images:', analyzedImages);

    const totalPropertyImages = propertyData.overall_analysis.stages.initial_categorization.length;
    const totalAnalyzedImages = analyzedImages.length;
    const totalSkippedImages = totalPropertyImages - totalAnalyzedImages;

    const groupedImages = [];
    for (let i = 0; i < analyzedImages.length; i += 3) {
      groupedImages.push(analyzedImages.slice(i, i + 3));
    }

    console.log("this is the share data: ", propertyData?.share_token)
    const shareUrl = propertyData?.share_token 
    ? `${window.location.origin}/property-analysis/shared/${propertyData.id}/${propertyData.share_token}`
    : window.location.href;

    // console.log('Total Property Images:', totalPropertyImages);
    // console.log('Total Analyzed Images:', totalAnalyzedImages);
    // console.log('Total Skipped Images:', totalSkippedImages);
    // console.log('Grouped Images:', groupedImages);

    return (
      <>
        <h1 className="text-2xl font-bold mb-6">
          Property Analysis
        </h1>

        {/* Property URL */}
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600">Analyzing property:</p>
              <a
                href={propertyData.property_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline break-words"
              >
                {propertyData.property_url}
              </a>
            </div> 
            <div>
              <ShareButton shareUrl={shareUrl} />
            </div>        
        </div>

        {/* Main Image Carousel (Analyzed Images) */}
        <div className="mb-8">
          <Carousel className="relative w-full">
            <CarouselContent>
              {groupedImages.map((imageGroup, index) => (
                <CarouselItem key={index}>
                  <div className="flex gap-2 md:gap-4">
                  {imageGroup.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-full md:w-1/3"
                    >
                    {/* <div className="relative pt-[75%] md:pt-[66.67%]"> */}
                    <div className="relative h-48 sm:h-64 w-full">
                      <img
                        src={imageUrl}
                        alt={`Property image ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover rounded"
                      />
                    </div>
                  </div>
                  ))}
                </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white" >
              {/* Left Arrow Icon */}
            </CarouselPrevious>
            <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white" >
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

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-max min-w-full inline-flex mb-6">
              <TabsTrigger 
                value="summary" 
                className="flex-1"
              >
                Summary
              </TabsTrigger>
              <TabsTrigger 
                value="detailed" 
                className="flex-1"
              >
                Detailed Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="property_data" 
                className="flex-1"
              >
                Property Data
              </TabsTrigger>
              <TabsTrigger 
                value="floorplan" 
                className="flex-1"
              >
                Floorplan
              </TabsTrigger>
              <TabsTrigger 
                value="floorplan2" 
                className="flex-1"
              >
                Floorplan 2
              </TabsTrigger>
              <TabsTrigger 
                value="floorplan3" 
                className="flex-1"
              >
                Floorplan Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="compare"
                className="flex-1"
                onClick={handleCompare}
              >
                Compare
              </TabsTrigger>
            </TabsList>
          </div>
          
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
                {/* <p>{propertyData.description}</p> */}
                <p className="whitespace-pre-wrap">
                  {propertyData.reviewed_description}
                </p>
              </div>    
              {propertyData.sentiment_analysis && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Sentiment Analysis</h2>

                  {/* Overall sentiment & score */}
                  <p className="font-semibold">Overall Sentiment: {propertyData.sentiment_analysis.overall_sentiment}</p>
                  <p className="mb-2">Score: {propertyData.sentiment_analysis.sentiment_score}</p>

                  {/* Tone analysis */}
                  {propertyData.sentiment_analysis.tone_analysis && (
                    <div className="mb-2">
                      <p className="font-semibold">Tone Analysis:</p>
                      {Object.entries(propertyData.sentiment_analysis.tone_analysis).map(([toneKey, toneValue]) => (
                        <p key={toneKey}>
                          {toneKey}: {toneValue}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Key phrases */}
                  {Array.isArray(propertyData.sentiment_analysis.key_phrases) && (
                    <div className="mb-2">
                      <p className="font-semibold">Key Phrases:</p>
                      <ul className="list-disc ml-4">
                        {propertyData.sentiment_analysis.key_phrases.map((phrase, index) => (
                          <li key={index}>{phrase}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvement suggestions */}
                  {Array.isArray(propertyData.sentiment_analysis.improvement_suggestions) && (
                    <div className="mb-2">
                      <p className="font-semibold">Improvement Suggestions:</p>
                      <ul className="list-disc ml-4">
                        {propertyData.sentiment_analysis.improvement_suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Marketing effectiveness */}
                  {propertyData.sentiment_analysis.marketing_effectiveness && (
                    <div className="mb-2">
                      <p className="font-semibold">Marketing Effectiveness:</p>
                      <p>{propertyData.sentiment_analysis.marketing_effectiveness}</p>
                    </div>
                  )}
                </div>
              )}          
              <div>
                <h2 className="text-xl font-semibold mb-2">Images</h2>
                {Array.isArray(propertyData.image_urls) && propertyData.image_urls.length > 0 ? (
                  <p>{propertyData.image_urls.length} images</p>
                ) : (
                  <p>No images available.</p>
                )}
              </div>
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {propertyData.image_urls.map((imageUrl, index) => (
                    <img key={index} src={imageUrl} alt={`Image ${index + 1}`} className="w-full h-auto rounded" />
                  ))}
                </div>
              </div>
              {/* Floorplans */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Floorplans</h2>
                {Array.isArray(propertyData.floorplan_urls) && propertyData.floorplan_urls.length > 0 ? (
                  <p>{propertyData.floorplan_urls.length} floorplans</p>
                ) : (
                  <p>No floorplans available.</p>
                )}
              </div>
              {Array.isArray(propertyData.floorplan_urls) && propertyData.floorplan_urls.length > 0 && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {propertyData.floorplan_urls.map((floorplanUrl, index) => (
                      <img key={index} src={floorplanUrl} alt={`Floorplan ${index + 1}`} className="w-full h-auto rounded" />
                    ))}
                  </div>
                </div>
              )}
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
                    {propertyData.overall_analysis.stages.overall_condition?.overall_condition_label ?? 'N/A'} ({propertyData.overall_analysis.stages.overall_condition?.average_score}%)
                  </p>
                  <div className="space-y-2">
                    <ConditionScale 
                      score={propertyData.overall_analysis.stages.overall_condition?.average_score ?? 0}
                      label={propertyData.overall_analysis.stages.overall_condition?.overall_condition_label ?? 'N/A'}
                    />
                    <p>
                      <span className="font-semibold">Confidence:</span>{" "}
                      {propertyData.overall_analysis.stages.overall_condition?.confidence ?? 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold">Areas of Concern:</span>{" "}
                      {propertyData.overall_analysis.stages.overall_condition?.areas_of_concern ?? 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Description Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyData.description_analysis?.label}
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
                    {propertyData.overall_analysis.stages.overall_condition?.explanation ? (
                      <>
                        {propertyData.overall_analysis.stages.overall_condition.explanation.split('\n').map((para, idx) => (
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
              {Object.entries(propertyData.overall_analysis.stages.detailed_analysis ?? {}).map(
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
                        {Array.isArray(analysis) && analysis.map((item) => (
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

          {/* Floorplans */}
          <TabsContent value="">
            <div>
                <h2 className="text-xl font-semibold mb-2">Floorplans</h2>
                {Array.isArray(propertyData.floorplan_urls) &&
                propertyData.floorplan_urls.length > 0 ? (
                  <p>{propertyData.floorplan_urls.length} floorplans</p>
                ) : (
                  <p>No floorplans available.</p>
                )}
            </div>
            <div>
              {Array.isArray(propertyData.floorplan_urls) &&
                propertyData.floorplan_urls.length > 0 && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {propertyData.floorplan_urls.map((floorplanUrl, index) => (
                        <img
                          key={index}
                          src={floorplanUrl}
                          alt={`Floorplan ${index + 1}`}
                          className="w-full h-auto rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </TabsContent>
          
          {/* Floorplan Analysis Tab */}
          <TabsContent value="floorplan">
            {propertyData?.overall_analysis?.stages?.floorplan_analysis && propertyData.overall_analysis.stages.floorplan_analysis.length > 0 ? (
              <>
                {/* Carousel for Floorplan Images */}
                <div className="mb-8">
                  <Carousel className="relative w-full">
                    <CarouselContent>
                      {propertyData.overall_analysis.stages.floorplan_analysis.map(
                        (floorplan, index) => (
                          <CarouselItem key={index}>
                            <div className="relative h-48 sm:h-64 w-full">
                              <img
                                src={floorplan.url}
                                alt={`Floorplan ${index + 1}`}
                                className="absolute inset-0 w-full h-full object-contain rounded"
                              />
                            </div>
                          </CarouselItem>
                          )
                        )}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white" />
                    <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white" />
                  </Carousel>
                </div>

                {/* Floorplan analysis data (one card per floorplan) */}
                {propertyData.overall_analysis.stages.floorplan_analysis.map(
                  (floorplan, index) => (
                    <Card key={index} className="mb-6">
                      <CardHeader>
                        <CardTitle>
                          Floorplan {index + 1} Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p>
                              <span className="font-semibold">Color:</span>{" "}
                              {floorplan.analysis.color ?? "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Dimension Type:
                              </span>{" "}
                              {floorplan.analysis.dimension_type ?? "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">Drawing Type:</span>{" "}
                              {floorplan.analysis.drawing_type ?? "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Background in Blueprint:
                              </span>{" "}
                              {floorplan.analysis.background_image_in_blueprint
                                ? "Yes"
                                : "No"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Number of Buildings:
                              </span>{" "}
                              {floorplan.analysis.number_buildings ?? "N/A"}
                            </p>
                          </div>
                          <div>
                            <p>
                              <span className="font-semibold">
                                Number of Floors:
                              </span>{" "}
                              {floorplan.analysis.number_floors ?? "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">Bay Windows:</span>{" "}
                              {floorplan.analysis.bay_windows ? "Yes" : "No"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Curved Walls/Windows:
                              </span>{" "}
                              {floorplan.analysis.curved_walls_windows
                                ? "Yes"
                                : "No"}
                            </p>
                            <p>
                              <span className="font-semibold">Garden:</span>{" "}
                              {floorplan.analysis.garden ? "Yes" : "No"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Total Square Area:
                              </span>{" "}
                              {floorplan.analysis.total_square_area ?? "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p>
                            <span className="font-semibold">
                              Main Building Sq. Area:
                            </span>{" "}
                            {floorplan.analysis.main_building_square_area ??
                              "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Compass Direction:
                            </span>{" "}
                            {floorplan.analysis.compass_direction ?? "N/A"}
                          </p>
                          <p className="mt-2">
                            <span className="font-semibold">
                              Key Observations:
                            </span>{" "}
                            {floorplan.analysis.key_observations ?? "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </>
              ) : (
                <p>No floorplan analysis data available.</p>
              )}
          </TabsContent>

          <TabsContent value="floorplan2">
            <FloorplanAnalysis2 />
          </TabsContent>


          <TabsContent value="compare" />

          <TabsContent value="floorplan3">
            <FloorplanAnalysis3 />
          </TabsContent>
        </Tabs>
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Analysis Form */}
      {!isSharedView && !id && (
        authenticated ? (
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
        ) : (
          <div>Please sign in to analyze a property.</div>
        )
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      {!isSharedView && analysisInProgress && (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <p className="text-gray-700 text-center px-4 max-w-md">
            We have a team of AI agents analyzing your property, this should be finished in a few minutes, 
            you will receive a message on WhatsApp when the analysis is ready.
          </p>
          {progressUpdate && (
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
          )}
        </div>
      )}

      {/* Fetching Results Indicator */}
      {!isSharedView && fetchingResults && !analysisComplete && (
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