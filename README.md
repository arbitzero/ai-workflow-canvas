# AI 工作流画布 (ai-workflow-canvas)

一个可视化的 AI 工作流编辑器:在画布上拖拽编排「输入 → LLM → 输出」节点,运行后由轻量 Node 服务转发 LLM 的**流式输出**,前端安全地渲染为 Markdown。

## 功能

- **节点画布**:节点拖拽、手柄连线、缩放平移(基于 React Flow)
- **流式输出**:Node 服务以 SSE 转发 LLM 的逐 token 输出,前端增量渲染
- **安全渲染**:`react-markdown` + `rehype-sanitize`,过滤 `<script>`、事件属性与 `javascript:` 链接等 XSS 向量

## 技术栈

前端:React 18 · TypeScript · Vite · [@xyflow/react](https://reactflow.dev) · react-markdown · rehype-sanitize
服务端:Node · Express · `openai`(OpenAI 兼容客户端)· SSE

## 快速开始

```bash
pnpm install
cp .env.example .env     # 填入 LLM_API_KEY
pnpm dev                 # 同时启动前端(:5173)和 API 服务(:8787)
```

- 单独启动:`pnpm dev:web`(仅前端) / `pnpm dev:api`(仅服务)。
- `pnpm build` 做类型检查 + 生产构建。

## 设计要点

1. **流式 Markdown 渲染性能**:react-markdown 每次都会整段重新解析,因此用 `requestAnimationFrame` 把多次 token 合并成每帧一次刷新,并用 `memo` 包住渲染组件,避免越到后期越卡。
2. **模型输出默认不可信**:`rehype-sanitize` 基于白名单清理 HAST,过滤脚本、事件属性与危险协议链接,绝不直接 `dangerouslySetInnerHTML`。
3. **provider 无关**:服务端只依赖 OpenAI 兼容的 Chat Completions 接口,密钥留在服务端,前端只跟 `/api/chat` 打交道。
4. **状态分层**:高频/大量的画布数据交给 React Flow 引擎,React 只负责 UI 外壳。

## 项目结构

```
server/index.ts       Express + SSE,转发 OpenAI 兼容 LLM 的流式输出
src/
  nodes/              自定义节点(输入 / LLM / 输出)
  components/         MarkdownView 安全渲染
  lib/chatStream.ts   消费 /api/chat 的 SSE
  lib/mockStream.ts   本地模拟流
  FlowCanvas.tsx      画布、连线与运行逻辑
  types.ts            类型化节点定义
```

## Roadmap

- [ ] 海量节点性能:视口裁剪、分层渲染、LOD、对象池,压测节点帧率
- [x] 轻量 Node 服务:`/api/chat` 转发真实 LLM 的 SSE 流
- [ ] 更多节点类型:Prompt 模板、条件分支、工具调用,支持 DAG 拓扑执行
- [ ] 3D 节点视图探索
