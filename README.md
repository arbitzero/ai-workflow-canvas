# AI 工作流画布 (ai-workflow-canvas)

一个可视化的 AI 工作流编辑器:在画布上拖拽编排「输入 → LLM → 输出」节点,运行后把 LLM 的**流式输出**安全地渲染为 Markdown。

## 功能

- **节点画布**:节点拖拽、手柄连线、缩放平移(基于 React Flow)
- **流式输出**:模拟 LLM 按 token 流式返回,实时增量渲染
- **安全渲染**:`react-markdown` + `rehype-sanitize`,过滤 `<script>`、事件属性与 `javascript:` 链接等 XSS 向量

## 技术栈

React 18 · TypeScript · Vite · [@xyflow/react](https://reactflow.dev) · react-markdown · rehype-sanitize

## 快速开始

```bash
pnpm install
pnpm dev        # 开发,默认 http://localhost:5173
pnpm build      # 类型检查 + 生产构建
```

## 设计要点

1. **流式 Markdown 渲染性能**:react-markdown 每次都会整段重新解析,因此用 `requestAnimationFrame` 把多次 token 合并成每帧一次刷新,并用 `memo` 包住渲染组件,避免越到后期越卡。
2. **模型输出默认不可信**:`rehype-sanitize` 基于白名单清理 HAST,过滤脚本、事件属性与危险协议链接,绝不直接 `dangerouslySetInnerHTML`。
3. **状态分层**:高频/大量的画布数据交给 React Flow 引擎,React 只负责 UI 外壳。

## 项目结构

```
src/
  nodes/            自定义节点(输入 / LLM / 输出)
  components/       MarkdownView 安全渲染
  lib/mockStream.ts 模拟 LLM 流式输出
  FlowCanvas.tsx    画布、连线与运行逻辑
  types.ts          类型化节点定义
```

## Roadmap

- [ ] 海量节点性能:视口裁剪、分层渲染、LOD、对象池,压测节点帧率
- [ ] 轻量 Node 服务:`/api/chat` 转发真实 LLM 的 SSE 流,替换 `mockStream`
- [ ] 更多节点类型:Prompt 模板、条件分支、工具调用,支持 DAG 拓扑执行
- [ ] 3D 节点视图探索
