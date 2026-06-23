import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { AppNode } from './types'
import { InputNode } from './nodes/InputNode'
import { LlmNode } from './nodes/LlmNode'
import { OutputNode } from './nodes/OutputNode'
import { mockStream } from './lib/mockStream'

// nodeTypes 必须是稳定引用，否则 React Flow 每次渲染都会重建节点并告警。
const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LlmNode,
  output: OutputNode,
}

const initialNodes: AppNode[] = [
  { id: 'in', type: 'input', position: { x: 0, y: 120 }, data: { prompt: '解释一下大画布性能优化' } },
  { id: 'llm', type: 'llm', position: { x: 320, y: 130 }, data: { model: 'mock-llm', status: 'idle' } },
  { id: 'out', type: 'output', position: { x: 620, y: 40 }, data: { content: '' } },
]

const initialEdges: Edge[] = [
  { id: 'e-in-llm', source: 'in', target: 'llm', animated: true },
  { id: 'e-llm-out', source: 'llm', target: 'out', animated: true },
]

export function FlowCanvas() {
  const [nodes, , onNodesChange] = useNodesState<AppNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)
  const [running, setRunning] = useState(false)
  const { getNodes, updateNodeData } = useReactFlow()

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)),
    [setEdges],
  )

  const run = useCallback(async () => {
    if (running) return
    // 读取实时节点（而不是闭包里的旧 nodes），按类型定位 input / llm / output。
    const current = getNodes()
    const input = current.find((n) => n.type === 'input')
    const llm = current.find((n) => n.type === 'llm')
    const output = current.find((n) => n.type === 'output')
    if (!input || !llm || !output) return

    const prompt = (input.data as { prompt: string }).prompt
    setRunning(true)
    updateNodeData(llm.id, { status: 'running' })
    updateNodeData(output.id, { content: '' })

    // 关键：不每来一个 token 就 setState。用 requestAnimationFrame 把多次 token
    // 合并成每帧一次刷新，避免流式后期 react-markdown 反复整段解析造成卡顿。
    let buffer = ''
    let raf = 0
    const flush = () => {
      updateNodeData(output.id, { content: buffer })
      raf = 0
    }

    for await (const chunk of mockStream(prompt)) {
      buffer += chunk
      if (!raf) raf = requestAnimationFrame(flush)
    }

    if (raf) cancelAnimationFrame(raf)
    updateNodeData(output.id, { content: buffer }) // 收尾，确保最后一帧完整
    updateNodeData(llm.id, { status: 'done' })
    setRunning(false)
  }, [running, getNodes, updateNodeData])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
    >
      <Background />
      <Controls />
      <Panel position="top-left" className="toolbar">
        <div className="toolbar-title">AI 工作流画布</div>
        <button className="run-btn" onClick={run} disabled={running}>
          {running ? '生成中…' : '▶ 运行'}
        </button>
        <p className="toolbar-hint">拖拽节点 · 拖动手柄连线 · 滚轮缩放 · 运行查看安全 Markdown 渲染</p>
      </Panel>
    </ReactFlow>
  )
}
