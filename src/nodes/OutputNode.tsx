import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { OutputNode as OutputNodeType } from '../types'
import { MarkdownView } from '../components/MarkdownView'

// 输出节点：把 LLM 的流式文本作为 Markdown 安全渲染。
// 滚动区加 nowheel，避免在节点内滚动时缩放整个画布。
export function OutputNode({ data }: NodeProps<OutputNodeType>) {
  return (
    <div className="node node-output">
      <Handle type="target" position={Position.Left} />
      <div className="node-title">🖥️ 输出（安全 Markdown）</div>
      <div className="output-body nodrag nowheel">
        {data.content ? (
          <MarkdownView content={data.content} />
        ) : (
          <span className="muted">运行后显示 AI 流式输出…</span>
        )}
      </div>
    </div>
  )
}
