import { ImageResponse } from "next/og";
import { TORTOISE_BODY_PATH, TORTOISE_EYE, TORTOISE_SCUTE_PATHS } from "@/lib/tortoise-mark";

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
          <rect x="5" y="5" width="54" height="54" rx="11" stroke="#C4A15A" strokeWidth="0.9" />
          <path d={TORTOISE_BODY_PATH} fill="#EFE6D4" />
          {TORTOISE_SCUTE_PATHS.map((d) => (
            <path
              key={d}
              d={d}
              stroke="#C4A15A"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
          ))}
          <circle cx={TORTOISE_EYE.cx} cy={TORTOISE_EYE.cy} r={TORTOISE_EYE.r} fill="#24352A" />
        </svg>
      </div>
    ),
    size,
  );
}
