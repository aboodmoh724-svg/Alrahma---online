import { ImageResponse } from "next/og";
import { getAppBaseUrl } from "@/lib/app-url";

export const runtime = "edge";
export const alt = "المراسلات اليومية مع المعلم - منصة الرحمة";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  const appBaseUrl = getAppBaseUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f0e6",
          color: "#173d42",
          padding: "54px",
          fontFamily: "Arial",
          direction: "rtl",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-80px",
            top: "-90px",
            width: "330px",
            height: "330px",
            borderRadius: "999px",
            background: "#1f6358",
            opacity: 0.16,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-120px",
            bottom: "-130px",
            width: "380px",
            height: "380px",
            borderRadius: "999px",
            background: "#d6a85b",
            opacity: 0.2,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "28px",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(23,61,66,0.16)",
            }}
          >
            <img
              src={`${appBaseUrl}/logo.png`}
              width="82"
              height="82"
              alt="منصة الرحمة"
              style={{ objectFit: "contain" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#173d42" }}>منصة الرحمة</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#9b7039" }}>قناة المراسلات اليومية</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "900px" }}>
          <div style={{ fontSize: 76, lineHeight: 1.18, fontWeight: 900, letterSpacing: 0 }}>
            المراسلات اليومية مع المعلم
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.45, fontWeight: 700, color: "rgba(23,61,66,0.78)" }}>
            رابط خاص للتواصل التعليمي بين ولي الأمر والمعلم والإشراف
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(155,112,57,0.22)",
            paddingTop: "26px",
            fontSize: 24,
            fontWeight: 800,
            color: "#1f6358",
          }}
        >
          <span>رسائل الطالب، المتابعة، الصوتيات، والتنبيهات التعليمية</span>
          <span style={{ direction: "ltr", color: "#9b7039" }}>alrahmakuran.site/parent/daily-messages</span>
        </div>
      </div>
    ),
    size
  );
}
