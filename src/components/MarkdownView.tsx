import { memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

interface Props {
  content: string
}

// AI 生成内容的安全渲染：
//   remark-gfm      —— 支持表格 / 删除线 / 任务列表等 GitHub 风格语法
//   rehype-sanitize —— 基于白名单清理 HAST，过滤 <script>、onerror 等事件属性、
//                      javascript: 协议链接，杜绝 XSS（绝不直接 dangerouslySetInnerHTML）
//
// 自定义 a 标签：外链强制 noopener + 新标签打开（协议已被 sanitize 限制为安全集合）。
//
// 用 memo 包一层：react-markdown 每次渲染都会整段重新解析，配合上层的 rAF 合并刷新，
// 把「流式 token」造成的重解析次数压到每帧一次。
function MarkdownViewImpl({ content }: Props) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
      }}
    >
      {content}
    </Markdown>
  )
}

export const MarkdownView = memo(MarkdownViewImpl)
