"use client";

import React from "react";

interface CompetencyRadarProps {
  competencies: {
    Technical: number;
    Delivery: number;
    Relevance: number;
    Clarity: number;
    Confidence: number;
    "Eye Contact": number;
  };
  size?: number;
}

export default function CompetencyRadar({ competencies, size = 320 }: CompetencyRadarProps) {
  const categories = Object.keys(competencies) as Array<keyof typeof competencies>;
  const totalAxes = categories.length;
  const radius = size / 2 - 40;
  const center = size / 2;

  // Compute points on polygon for a given percentage ratio (0 to 1)
  const getCoordinates = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = radius * ratio;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon grid levels: 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Candidate score polygon points
  const candidatePoints = categories
    .map((cat, i) => {
      const score = Math.max(10, Math.min(100, competencies[cat] || 50));
      const { x, y } = getCoordinates(i, score / 100);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.45)" />
            <stop offset="70%" stopColor="rgba(6, 182, 212, 0.3)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
          </radialGradient>
        </defs>

        {/* Concentric Web Grids */}
        {gridLevels.map((lvl, lvlIdx) => {
          const points = categories
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polygon
              key={`grid-${lvlIdx}`}
              points={points}
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray={lvlIdx < 3 ? "3 3" : "none"}
            />
          );
        })}

        {/* Axis Lines from Center */}
        {categories.map((cat, i) => {
          const outer = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#475569"
              strokeWidth="1"
            />
          );
        })}

        {/* Candidate Evaluation Polygon */}
        <polygon
          points={candidatePoints}
          fill="url(#radarGradient)"
          stroke="#10b981"
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out"
        />

        {/* Data Point Markers & Labels */}
        {categories.map((cat, i) => {
          const score = Math.max(10, Math.min(100, competencies[cat] || 50));
          const pt = getCoordinates(i, score / 100);
          const labelPt = getCoordinates(i, 1.22);

          return (
            <g key={`marker-${i}`}>
              {/* Point circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#06b6d4"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Axis Label */}
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#F8FAFC"
                fontSize="11"
                fontWeight="600"
                className="select-none"
              >
                {cat}
                <tspan x={labelPt.x} dy="12" fill="#34d399" fontWeight="700" fontSize="10">
                  {score}%
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
