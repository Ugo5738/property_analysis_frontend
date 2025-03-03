// ShareButton.tsx
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';

interface ShareButtonProps {
  shareUrl: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <Button 
        onClick={handleCopy} 
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Copy Share URL
      </Button>
      {copied && (
        <p className="mt-2 text-green-600 text-sm">
          Link copied to clipboard!
        </p>
      )}
    </div>
  );
};

export default ShareButton;
