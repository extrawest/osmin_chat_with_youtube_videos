"use client";

import { ConfigProvider, App as AntApp } from "antd";

export default function Providers({ children }) {
  return (
    <ConfigProvider>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
