import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
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

const PropertyAnalysis = ({ data }) => {
  const conditionData = [
    {
      name: "Below Average",
      value:
        data.stages.overall_condition.condition_distribution["below average"],
    },
    {
      name: "Average",
      value:
        data.stages.overall_condition.condition_distribution["average"] || 0,
    },
    {
      name: "Above Average",
      value:
        data.stages.overall_condition.condition_distribution["above average"],
    },
    {
      name: "Poor",
      value: data.stages.overall_condition.condition_distribution["poor"],
    },
  ];

  const allImages = Object.values(data.stages.detailed_analysis)
    .flat()
    .map((item) => item.image_url)
    .filter(Boolean);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Property Analysis: {data.property_url}
      </h1>

      <Carousel className="mb-8">
        <CarouselContent>
          {allImages.map((imageUrl, index) => (
            <CarouselItem key={index}>
              <img
                src={imageUrl}
                alt={`Property image ${index + 1}`}
                className="w-full h-64 object-cover"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Overall Condition</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {data.stages.overall_condition.overall_condition_label}
                </p>
                <p>
                  Average Score:{" "}
                  {data.stages.overall_condition.average_score.toFixed(2)}
                </p>
                <p>Confidence: {data.stages.overall_condition.confidence}</p>
                <p>
                  Areas of Concern:{" "}
                  {data.stages.overall_condition.areas_of_concern}
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
                <pre className="whitespace-pre-wrap">
                  {data.stages.overall_condition.explanation}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed">
          <div className="space-y-4">
            {Object.entries(data.stages.detailed_analysis).map(
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
                      {analysis.map((item, index) => (
                        <div
                          key={item.image_id}
                          className="flex items-start space-x-4"
                        >
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={`Image ${item.image_number}`}
                              className="w-32 h-32 object-cover rounded"
                            />
                          )}
                          <div>
                            <p>
                              <strong>Image {item.image_number}:</strong>{" "}
                              {item.condition_label}
                            </p>
                            <p>{item.reasoning}</p>
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
    </div>
  );
};

export default PropertyAnalysis;
