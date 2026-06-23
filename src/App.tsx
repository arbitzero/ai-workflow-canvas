import { ReactFlowProvider } from '@xyflow/react'
import { FlowCanvas } from './FlowCanvas'

// ReactFlowProvider 让 FlowCanvas 内部的 useReactFlow / updateNodeData 可用。
export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}
