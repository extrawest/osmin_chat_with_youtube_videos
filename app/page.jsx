"use client";

import { Layout, Typography } from "antd";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ width: "100%", maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
        <Title level={3}>Chat with YouTube Videos</Title>
        <Text type="secondary">Paste a YouTube link and ask questions about the video.</Text>
      </Content>
    </Layout>
  );
}
