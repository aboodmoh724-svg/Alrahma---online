"use client";

type CircularProgressProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  filledCount: number;
  totalCount: number;
};

export default function CircularProgress({
  percentage,
  size = 100,
  strokeWidth = 7,
  filledCount,
  totalCount,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return "#059669";
    if (percentage >= 50) return "#0C5C5E";
    return "#D97706";
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E3DF"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-heading" style={{ color: getColor() }}>
          {percentage}%
        </span>
        <span className="text-[11px] font-medium text-[#6B7280]">
          {filledCount}/{totalCount}
        </span>
      </div>
    </div>
  );
}
