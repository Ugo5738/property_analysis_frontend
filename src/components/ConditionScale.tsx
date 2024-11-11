interface ConditionScaleProps {
    score: number;
    label: string;
  }

const ConditionScale: React.FC<ConditionScaleProps> = ({ score, label }) => {
  // Ensure the score is between 0 and 100
  const validatedScore = Math.min(Math.max(score, 0), 100);
  
  // Calculate position percentage (0-100) based on score (1-5)
  const getPositionPercentage = (score: number) => {
    return score;
  };

  const getIndicatorColor = (score: number) => {
    if (score >= 75.01) return 'bg-green-600';
    if (score >= 50.01) return 'bg-green-200';
    if (score >= 25.01) return 'bg-yellow-700';
    return 'bg-red-600';
  };

  return (
    <div className="w-full">
      {/* Score Marker */}
      <div className="relative h-1 mb-2">
        <div className="absolute w-full h-full flex">
          {/* Color segments */}
          <div className="flex-1 bg-red-400" />       {/* 0% - 25%: Poor */}
          <div className="flex-1 bg-yellow-400" />    {/* 25.01% - 500%: Below Average */}
          <div className="flex-1 bg-green-200" />      {/* 50.01% - 75%: Above Average */}
          <div className="flex-1 bg-green-400" />     {/* 75.01% - 100%: Excellent */}
        </div>
        {/* Score indicator */}
        <div 
          className={`absolute w-0.5 h-4 -top-1.5 ${getIndicatorColor(validatedScore)}`}
          style={{ 
            left: `${getPositionPercentage(validatedScore)}%`,
            transform: 'translateX(-50%)'
          }}
          title={`Score: ${validatedScore.toFixed(2)}%`}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-sm text-gray-600">
        <div className="flex-1 text-center">Poor</div>
        <div className="flex-1 text-center">Below Average</div>
        <div className="flex-1 text-center">Above Average</div>
        <div className="flex-1 text-center">Excellent</div>
      </div>
      
      {/* Score display */}
      <div className="text-center mt-2 font-semibold">
        {label} ({validatedScore.toFixed(2)}%)
      </div>
    </div>
  );
};

export default ConditionScale;