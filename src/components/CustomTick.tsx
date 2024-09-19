interface CustomTickProps {
  x: number;
  y: number;
  payload: {
    value: string;
    // Add any other properties if needed
  };
  // Optional: Include other props if required
  // stroke?: string;
  // strokeWidth?: number;
}

const CustomTick = ({ x, y, payload }: CustomTickProps): JSX.Element => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16} // Adjusts the vertical position
        textAnchor="end"
        fill="#666"
        transform="rotate(-45)"
        fontSize={12}
      >
        {payload.value}
      </text>
    </g>
  );
};

export default CustomTick;
