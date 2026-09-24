import { ImageResponse } from "next/og";

export const alt =
  "Targeted energy discount: PolicyEngine estimates of the Resolution Foundation proposal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The image renderer cannot read CSS variables, so tokens are written as hex:
// #2C7A7B is --primary (teal-600), #E6FFFA is teal-50.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#2C7A7B",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 4, color: "#E6FFFA" }}>POLICYENGINE UK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700 }}>Targeted energy discount</div>
          <div style={{ fontSize: 36, color: "#E6FFFA", maxWidth: 980 }}>
            Who the Resolution Foundation&apos;s £24,000 highest-income test and benefit
            passporting would reach in 2026-27
          </div>
        </div>
      </div>
    ),
    size,
  );
}
