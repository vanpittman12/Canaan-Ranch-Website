import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_MARK_FILE } from "@/lib/brand-mark-asset";

const mark = readFileSync(path.join(process.cwd(), BRAND_MARK_FILE));
const src = `data:image/svg+xml;base64,${mark.toString("base64")}`;

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
        <img src={src} width={35} height={56} alt="" />
      </div>
    ),
    size,
  );
}
