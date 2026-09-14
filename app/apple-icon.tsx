import { ImageResponse } from "next/og";
import { BRAND_MARK_DATA_URI } from "@/lib/brand-mark-asset";

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
          alignItems: "center",
          justifyContent: "center",
          background: "#EFE6D4",
          borderRadius: 40,
        }}
      >
        <img src={BRAND_MARK_DATA_URI} width={93} height={150} alt="" />
      </div>
    ),
    size,
  );
}
