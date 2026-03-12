#!/usr/bin/env node

import { BestMCP } from "bestmcp";
import { StoryService } from "@/services";
import { getPackageVersion } from "@/utils";

// 创建 MCP 服务器实例
const mcp = new BestMCP({
  name: "Bedbook - 儿童故事 MCP 服务",
  version: getPackageVersion(),
});

// 注册故事服务
mcp.register(StoryService);

// 解析传输配置
const transport = process.env.MCP_TRANSPORT || "stdio";
const port = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;
const host = process.env.MCP_HOST || "0.0.0.0";

// 启动服务器
if (transport === "http") {
  mcp.run({
    transport: "http",
    port,
    host,
  }).catch((error: Error) => {
    console.error("Failed to start Bedbook MCP server:", error);
    process.exit(1);
  });
} else {
  mcp.run().catch((error: Error) => {
    console.error("Failed to start Bedbook MCP server:", error);
    process.exit(1);
  });
}