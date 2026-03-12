# 本地化验证示例

本文档包含本地化验证的代码示例，帮助识别和修复本地化问题。

## 1. 代码注释检查示例

### 英文注释（需要修复）

```typescript
// ❌ 错误 - 英文注释
// Get user data from API
// Initialize the application
// Handle connection errors
```

### 中文注释（正确）

```typescript
// ✅ 正确 - 中文注释
// 从 API 获取用户数据
// 初始化应用程序
// 处理连接错误
```

---

## 2. 测试用例描述检查示例

### 英文描述（需要修复）

```typescript
// ❌ 错误 - 英文描述
describe("User Component", () => {
  it("should render user name correctly", () => {
    // ...
  });

  it("should handle loading state", () => {
    // ...
  });
});
```

### 中文描述（正确）

```typescript
// ✅ 正确 - 中文描述
describe("用户组件", () => {
  it("应该正确渲染用户名称", () => {
    // ...
  });

  it("应该处理加载状态", () => {
    // ...
  });
});
```

---

## 3. 硬编码字符串检查示例

### 硬编码英文字符串（需要修复）

```typescript
// ❌ 错误 - 硬编码英文字符串
const serviceName = "unknown";
const status = "loading";
const errorMessage = "failed to connect";

// 在组件中使用
return <div>{status}</div>;
```

### 使用中文常量（正确）

```typescript
// ✅ 正确 - 使用中文常量
const UNKNOWN_SERVICE = "未知服务";
const LOADING_STATUS = "加载中";
const CONNECTION_ERROR = "连接失败";

// 在组件中使用
return <div>{LOADING_STATUS}</div>;
```

---

## 4. 技术标识符例外

以下情况可以保留英文，不需要翻译：

```typescript
// ✅ 允许保留英文的技术标识符
const API_PROVIDER = "coze";           // 服务商名称
const PROTOCOL = "mcp";                 // 协议名称
const TRANSPORT = "stdio";              // 传输方式

// API 路径参数
const endpoint = "/api/v1/asr/process";

// 配置键名
const config = {
  provider: "doubao",
  model: "speech-01",
  asrEngine: "kaldi"
};

// 函数和变量名（遵循编程惯例）
function parseMCPResponse() {
  const mcpMessage = response.data;
}
```

---

## 5. 常见翻译对照表

| 英文 | 中文 |
|------|------|
| unknown | 未知 |
| loading | 加载中 |
| error | 错误 |
| success | 成功 |
| failed | 失败 |
| pending | 待处理 |
| completed | 已完成 |
| configuration | 配置 |
| parameter | 参数 |
| component | 组件 |
| service | 服务 |
| server | 服务器 |
| client | 客户端 |
| connect | 连接 |
| disconnect | 断开连接 |
| retry | 重试 |
| cancel | 取消 |
| confirm | 确认 |
| delete | 删除 |
| save | 保存 |
| submit | 提交 |

---

## 快速检查清单

- [ ] 代码注释是否使用中文
- [ ] 测试用例描述是否使用中文
- [ ] 用户可见字符串是否本地化
- [ ] 错误信息是否本地化
- [ ] 技术标识符是否保持英文
