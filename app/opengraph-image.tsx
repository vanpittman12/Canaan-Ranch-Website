import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${brand.name} — ${brand.fwcBadge} Long-Term Recipient Site`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#16241c",
          color: "#efe6d4",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#c4a15a",
          }}
        >
          {brand.fwcBadge}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 72,
            lineHeight: 1.1,
            fontWeight: 500,
          }}
        >
          {brand.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            maxWidth: 820,
            fontSize: 28,
            lineHeight: 1.4,
            color: "rgba(239, 230, 212, 0.82)",
          }}
        >
          FWC Approved Tier 1 Long-Term recipient site
        </div>
      </div>
    ),
    size,
  );
}
