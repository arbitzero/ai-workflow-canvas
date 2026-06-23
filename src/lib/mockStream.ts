// 模拟 LLM 的「流式输出」。MVP 阶段不接真实模型，用一个 async generator
// 按 token 吐字，复现真实 SSE 的两个工程难点：
//   1) 流式过程中 Markdown 经常是「半截语法」（未闭合的 ``` 代码块、未闭合的 **），
//      渲染层必须容错。
//   2) 不能每来一个 token 就整段重新解析渲染，否则越到后面越卡（见 FlowCanvas 的 rAF 合并）。
//
// 当缺少 API Key 或服务未启动时，chatStream 会回退到这里的模拟流，保证 demo 仍可运行。

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function buildResponse(prompt: string): string {
  const topic = prompt.trim() || '可视化画布'
  return `# 关于「${topic}」的回答

这是一段**模拟的流式输出**，用来演示 AI 内容的安全渲染。

## 要点

- 支持 GFM 表格、列表、代码块
- 流式过程中可能出现未闭合语法，渲染层需要容错
- 模型输出默认**不可信**，必须做 DOM 安全净化

## 示例代码

\`\`\`ts
function add(a: number, b: number) {
  return a + b
}
\`\`\`

## 性能对照表

| 节点量级 | 推荐渲染层 |
| --- | --- |
| 百级 | SVG / React Flow |
| 千级 | Canvas / Konva |
| 万级以上 | WebGL / PixiJS |

正常链接：[React Flow 文档](https://reactflow.dev)

---

下面是几段**故意注入的危险内容**，应被 rehype-sanitize 清理掉：

<script>alert('xss')</script>

<img src=x onerror="alert('xss-img')" />

危险协议链接：[点我](javascript:alert('xss-link'))
`
}

// 把整段文本切成不规则的小块，模拟 token 流。
export async function* mockStream(prompt: string): AsyncGenerator<string> {
  const full = buildResponse(prompt)
  let i = 0
  while (i < full.length) {
    const step = 2 + Math.floor(Math.random() * 4) // 每次 2~5 个字符
    yield full.slice(i, i + step)
    i += step
    await sleep(16 + Math.random() * 24) // ~每帧一块
  }
}
