"use client";

import { Typography, Tag, Spin, theme } from "antd";

const { Link } = Typography;

export default function Message({ role, content, route, sources }) {
  const { token } = theme.useToken();
  const isUser = role === "user";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
        <span
          style={{
            maxWidth: "80%",
            padding: "8px 12px",
            borderRadius: token.borderRadiusLG,
            whiteSpace: "pre-wrap",
            background: isUser ? token.colorPrimary : token.colorFillSecondary,
            color: isUser ? token.colorTextLightSolid : token.colorText,
          }}
        >
          {content || <Spin size="small" />}
        </span>
      </div>

      {!isUser && route && (
        <div style={{ marginTop: 4 }}>
          <Tag color={route === "web" ? "purple" : "blue"}>
            {route === "web" ? "web search" : "transcript"}
          </Tag>
        </div>
      )}

      {sources?.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {sources.map((s) => (
            <div key={s.url}>
              <Link href={s.url} target="_blank">
                {s.title || s.url}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
