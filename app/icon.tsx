import { ImageResponse } from "next/og";
import { BRAND_MARK_DATA_URI } from "@/lib/brand-mark-asset";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 14,
        }}
      >
        <img src={BRAND_MARK_DATA_URI} width={35} height={56} alt="" />
      </div>
    ),
    size,
  );
}
