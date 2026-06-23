import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { InputNode as InputNodeType } from '../types'

// 输入节点：可编辑的提示词。用 v12 的 updateNodeData 写回节点 data，
// 避免把 setState 闭包塞进 node.data 造成 stale closure。
// textarea 加 nodrag，否则在文本框里选字会拖动整个节点。
export function InputNode({ id, data }: NodeProps<InputNodeType>) {
  const { updateNodeData } = useReactFlow()
  return (
    <div className="node node-input">
      <div className="node-title">📝 输入</div>
      <textarea
        className="nodrag"
        value={data.prompt}
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        placeholder="输入提示词，例如：解释一下大画布性能优化"
        rows={3}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
