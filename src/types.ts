export interface PropertyData {
    id: number;
    url: string;
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
      }
    }
  }
  
  export interface ProgressUpdate {
    stage: string;
    message: string;
    progress: number;
  }