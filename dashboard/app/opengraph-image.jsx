import { ImageResponse } from "next/og";

export const alt =
  "Targeted energy discount: PolicyEngine estimates of the Resolution Foundation proposal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The image renderer cannot read CSS variables, so the tokens are written as hex:
// #285E61 is primary-700 and #E6FFFA primary-50 in the PolicyEngine palette.
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
          background: "#285E61",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 4, color: "#E6FFFA" }}>POLICYENGINE UK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700 }}>Targeted energy discount</div>
          <div style={{ fontSize: 36, color: "#E6FFFA", maxWidth: 980 }}>
            Who the Resolution Foundation&apos;s £24,000 highest-income test and benefit
            passporting would reach
          </div>
        </div>
      </div>
    ),
    size,
  );
}
