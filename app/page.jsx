"use client";

import { Layout, Typography, Input, Button, Space } from "antd";
import ChatPanel from "@/components/ChatPanel";
import { useVideo } from "@/hooks/useVideo";
import { getSessionId } from "@/lib/session";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const { video, loading, load, reset } = useVideo();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ width: "100%", maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
        <Title level={3}>Chat with YouTube Videos</Title>

        {!video ? (
          <>
            <Text type="secondary">Paste a YouTube link and ask questions about the video.</Text>
            <Input.Search
              placeholder="https://www.youtube.com/watch?v=..."
              size="large"
              loading={loading}
              onSearch={(url) => load(url, getSessionId())}
              style={{ marginTop: 16 }}
            />
          </>
        ) : (
          <>
            <Space
              style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
              wrap
            >
              <Text>
                Chatting with: <strong>{video.title}</strong> ({video.videoId})
              </Text>
              <Button onClick={reset}>New video</Button>
            </Space>
            <ChatPanel key={video.threadId} threadId={video.threadId} />
          </>
        )}
      </Content>
    </Layout>
  );
}
