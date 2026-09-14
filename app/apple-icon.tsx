import { ImageResponse } from "next/og";
import {
  GROUND_LINE_PATH,
  PINE_CROWN_NODE,
  PINE_NEEDLE_PATHS,
  PINE_TRUNK_PATH,
  WIREGRASS_PATHS,
} from "@/lib/pine-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#24352A",
          borderRadius: 40,
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64" fill="none">
          <rect x="5" y="5" width="54" height="54" rx="11" stroke="#C4A15A" strokeWidth="1" />
          <path d={PINE_TRUNK_PATH} stroke="#EFE6D4" strokeWidth="2.8" strokeLinecap="round" />
          {PINE_NEEDLE_PATHS.map((d) => (
            <path key={d} d={d} stroke="#EFE6D4" strokeWidth="1.8" strokeLinecap="round" />
          ))}
          <circle
            cx={PINE_CROWN_NODE.cx}
            cy={PINE_CROWN_NODE.cy}
            r={PINE_CROWN_NODE.r}
            fill="#C4A15A"
          />
          <path
            d={GROUND_LINE_PATH}
            stroke="#EFE6D4"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.45"
          />
          {WIREGRASS_PATHS.map((d) => (
            <path key={d} d={d} stroke="#C4A15A" strokeWidth="1.6" strokeLinecap="round" />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
