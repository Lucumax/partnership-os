import { ImageResponse } from "next/og";

export const alt = "Partnership OS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#F7F3EC",
          color: "#2B2620",
          padding: "90px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: "#6B3033",
                marginRight: "20px",
              }}
            />
            <div
              style={{
                fontSize: "30px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#6B3033",
                fontWeight: 600,
              }}
            >
              Partnership OS
            </div>
          </div>
          <div
            style={{
              fontSize: "96px",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: "920px",
              margin: "0 0 56px 0",
              display: "flex",
            }}
          >
            Partnership OS
          </div>
          <div
            style={{
              display: "flex",
              borderTop: "2px solid #D8CFC1",
              paddingTop: "40px",
              width: "920px",
              fontSize: "40px",
              color: "#4A443B",
              lineHeight: 1.35,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
            }}
          >
            Defensible partnership decisions when the comparables are thin.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: "90px",
            top: "90px",
            fontSize: "22px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8A8176",
            border: "1px solid #D8CFC1",
            borderRadius: "9999px",
            padding: "12px 24px",
          }}
        >
          Synthetic demo data
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
