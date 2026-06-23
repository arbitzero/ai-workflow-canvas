import type { Node } from '@xyflow/react'

export type NodeStatus = 'idle' | 'running' | 'done'

// 用 @xyflow/react v12 的「类型化节点」：每个节点的 data 形状各自不同，
// 在自定义节点里就能拿到精确类型，避免到处 as any。
export type InputNode = Node<{ prompt: string }, 'input'>
export type LlmNode = Node<{ model: string; status: NodeStatus }, 'llm'>
export type OutputNode = Node<{ content: string }, 'output'>

export type AppNode = InputNode | LlmNode | OutputNode
