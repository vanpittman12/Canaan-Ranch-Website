import { ImageResponse } from "next/og";
import {
  TORTOISE_EYE,
  TORTOISE_FORELEG_PATH,
  TORTOISE_HEAD_PATH,
  TORTOISE_HINDLEG_PATH,
  TORTOISE_SCALE_PATHS,
  TORTOISE_SCUTE_PATHS,
  TORTOISE_SHELL_PATH,
  TORTOISE_TAIL_PATH,
} from "@/lib/tortoise-mark";

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
          <path d={TORTOISE_SHELL_PATH} fill="#EFE6D4" fillOpacity="0.14" stroke="#EFE6D4" strokeWidth="2.15" />
          <path d={TORTOISE_HEAD_PATH} fill="#EFE6D4" fillOpacity="0.14" stroke="#EFE6D4" strokeWidth="2.15" />
          <path d={TORTOISE_FORELEG_PATH} stroke="#EFE6D4" strokeWidth="3.3" strokeLinecap="round" />
          <path d={TORTOISE_HINDLEG_PATH} stroke="#EFE6D4" strokeWidth="3.3" strokeLinecap="round" />
          <path d={TORTOISE_TAIL_PATH} stroke="#EFE6D4" strokeWidth="1.8" strokeLinecap="round" />
          {TORTOISE_SCUTE_PATHS.map((d) => (
            <path key={d} d={d} stroke="#C4A15A" strokeWidth="1.45" strokeLinecap="round" />
          ))}
          {TORTOISE_SCALE_PATHS.map((d) => (
            <path key={d} d={d} stroke="#C4A15A" strokeWidth="1.15" strokeLinecap="round" />
          ))}
          <circle cx={TORTOISE_EYE.cx} cy={TORTOISE_EYE.cy} r={TORTOISE_EYE.r} fill="#EFE6D4" />
        </svg>
      </div>
    ),
    size,
  );
}
