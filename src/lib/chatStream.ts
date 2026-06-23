import { mockStream } from './mockStream'

// 前端消费 /api/chat 的 SSE 流，逐段产出文本增量
export async function* streamLLM(prompt: string): AsyncGenerator<string> {
  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch {
    yield* fallback(prompt)
    return
  }

  if (!res.ok || !res.body) {
    yield* fallback(prompt)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE 以空行分隔事件；末尾可能是半截事件，留到下次拼接。
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const evt of events) {
      for (const line of evt.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string }
          if (parsed.error) {
            yield `\n\n> ⚠️ 生成出错：${parsed.error}`
            return
          }
          if (parsed.text) yield parsed.text
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  }
}

async function* fallback(prompt: string): AsyncGenerator<string> {
  yield '> ⚠️ 未连接真实 LLM（缺少 ANTHROPIC_API_KEY 或服务未启动），以下为本地模拟输出。\n\n'
  yield* mockStream(prompt)
}
