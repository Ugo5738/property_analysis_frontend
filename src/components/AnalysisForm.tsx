import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from 'react';

interface AnalysisFormProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({
  url,
  setUrl,
  onSubmit,
  loading
}) => {
  return (
    <form onSubmit={onSubmit} className="mb-8">
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
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
    </form>
  );
};