"use client";

import { useState } from "react";
import { Card, Input, Button, Typography } from "antd";
import { useChat } from "@/hooks/useChat";
import Message from "@/components/Message";

const { Text } = Typography;

export default function ChatPanel({ threadId }) {
  const { messages, send, loading } = useChat(threadId);
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || loading) return;
    send(text);
    setValue("");
  }

  return (
    <Card title="Ask about this video">
      <div className="chat-scroll">
        {messages.length === 0 && <Text type="secondary">Ask anything about this video.</Text>}
        {messages.map((m) => (
          <Message key={m.id} {...m} />
        ))}
      </div>

      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What is this video about?"
      />
      <Button
        type="primary"
        onClick={submit}
        loading={loading}
        disabled={!value.trim()}
        block
        style={{ marginTop: 8 }}
      >
        Send
      </Button>
    </Card>
  );
}