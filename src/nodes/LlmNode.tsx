import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LlmNode as LlmNodeType, NodeStatus } from '../types'

const STATUS_LABEL: Record<NodeStatus, string> = {
  idle: '待运行',
  running: '生成中…',
  done: '完成',
}

// LLM 节点：左进右出，中间显示模型名与运行状态。
export function LlmNode({ data }: NodeProps<LlmNodeType>) {
  return (
    <div className="node node-llm">
      <Handle type="target" position={Position.Left} />
      <div className="node-title">🤖 LLM</div>
      <div className="node-row">模型：{data.model}</div>
      <div className={`status status-${data.status}`}>{STATUS_LABEL[data.status]}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
