import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import OpenAI from 'openai'

// 轻量 Node 服务：把 LLM 的流式输出转发为 SSE 给前端。
const app = express()
app.use(express.json())

const apiKey = process.env.LLM_API_KEY
const baseURL = process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1'
const model = process.env.LLM_MODEL ?? 'llama-3.3-70b-versatile'

// 没配置密钥时不创建 client；请求会返回 503，前端据此回退到本地模拟流。
const client = apiKey ? new OpenAI({ apiKey, baseURL }) : null

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, configured: Boolean(client), baseURL, model })
})

app.post('/api/chat', async (req: Request, res: Response) => {
  const prompt = String(req.body?.prompt ?? '').trim()
  if (!prompt) {
    res.status(400).json({ error: 'prompt 不能为空' })
    return
  }
  if (!client) {
    res.status(503).json({ error: '未配置 LLM_API_KEY' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // 客户端断开时中止上游请求，避免继续消耗额度。
  // 注意：要监听 res 的 close，而不是 req —— POST 的 body 被读完后 req 会提前触发 close，
  // 用 req 会在首个 token 还没产出时就误中止整个请求。
  const controller = new AbortController()
  res.on('close', () => controller.abort())

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        max_tokens: 2048,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      },
      { signal: controller.signal },
    )

    // 逐 token 转发为 SSE data 帧。
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    if (controller.signal.aborted) {
      res.end()
      return
    }
    const message = err instanceof Error ? err.message : 'LLM 请求失败'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
})

const port = Number(process.env.PORT ?? 8787)
app.listen(port, () => {
  console.log(`API 服务已启动: http://localhost:${port} (provider: ${baseURL}, model: ${model})`)
})
