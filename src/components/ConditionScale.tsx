interface ConditionScaleProps {
    score: number;
  }

const ConditionScale: React.FC<ConditionScaleProps> = ({ score }) => {
  // Calculate position percentage (0-100) based on score (1-5)
  const getPositionPercentage = (score: number) => {
    return ((score - 1) / 4) * 100;
  };

  return (
    <div className="w-full">
      {/* Score Marker */}
      <div className="relative h-1 mb-2">
        <div className="absolute w-full h-full flex">
          {/* Color segments */}
          <div className="flex-1 bg-red-400" /> {/* Poor */}
          <div className="flex-1 bg-yellow-400" /> {/* Below Average */}
          <div className="flex-1 bg-yellow-300" /> {/* Average */}
          <div className="flex-1 bg-blue-400" /> {/* Above Average */}
          <div className="flex-1 bg-green-400" /> {/* Excellent */}
        </div>
        {/* Score indicator */}
        <div 
          className="absolute w-0.5 h-4 bg-black -top-1.5"
          style={{ 
            left: `${getPositionPercentage(score)}%`,
            transform: 'translateX(-50%)'
          }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-sm text-gray-600">
        <div className="flex-1 text-center">Poor</div>
        <div className="flex-1 text-center">Below Average</div>
        <div className="flex-1 text-center">Average</div>
        <div className="flex-1 text-center">Above Average</div>
        <div className="flex-1 text-center">Excellent</div>
      </div>
      
      {/* Score display */}
      <div className="text-center mt-2 font-semibold">
        Score: {score.toFixed(2)}
      </div>
    </div>
  );
};

export default ConditionScale;