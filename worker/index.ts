type D1Result<T = unknown> = {
  results?: T[]
  success: boolean
  meta: unknown
}

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(column?: string): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}

type D1Database = {
  prepare(query: string): D1PreparedStatement
}

type AiBinding = {
  run(model: string, input: unknown): Promise<unknown>
}

type Env = {
  DB: D1Database
  AI: AiBinding
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
}

type StoredComment = {
  id: string
  article_slug: string
  author_name: string
  content: string
  created_at: string
}

type PublicComment = {
  id: string
  articleSlug: string
  authorName: string
  content: string
  createdAt: string
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

const allowedMethods = 'GET, POST, OPTIONS'
const commentPathPattern = /^\/api\/comments\/([^/]+)$/
const maxAuthorLength = 32
const maxContentLength = 800

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return withCors(new Response(null, { status: 204 }))
    }

    const commentMatch = url.pathname.match(commentPathPattern)
    if (commentMatch) {
      return handleComments(request, env, commentMatch[1])
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: '接口不存在' }, 404)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleComments(request: Request, env: Env, rawSlug: string) {
  if (request.method === 'GET') {
    return listComments(env, rawSlug)
  }

  if (request.method === 'POST') {
    return createComment(request, env, rawSlug)
  }

  return json({ error: '不支持的请求方法' }, 405, {
    Allow: allowedMethods,
  })
}

async function listComments(env: Env, rawSlug: string) {
  const articleSlug = normalizeSlug(rawSlug)
  if (!articleSlug) {
    return json({ error: '文章路径无效' }, 400)
  }

  const { results = [] } = await env.DB.prepare(
    `SELECT id, article_slug, author_name, content, created_at
     FROM comments
     WHERE article_slug = ?1
     ORDER BY created_at DESC
     LIMIT 100`,
  )
    .bind(articleSlug)
    .all<StoredComment>()

  return json({
    comments: results.map(toPublicComment),
  })
}

async function createComment(request: Request, env: Env, rawSlug: string) {
  const articleSlug = normalizeSlug(rawSlug)
  if (!articleSlug) {
    return json({ error: '文章路径无效' }, 400)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json({ error: '请求体必须是 JSON' }, 400)
  }

  const parsed = parseCommentPayload(payload)
  if ('error' in parsed) {
    return json({ error: parsed.error }, 400)
  }

  const allowed = await isCommentAllowed(env, parsed.authorName, parsed.content)
  if (!allowed) {
    return json({ error: '评论未通过自动审核' }, 202)
  }

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const ipHash = await hashClientIp(request)
  const userAgent = request.headers.get('user-agent')?.slice(0, 240) ?? null

  await env.DB.prepare(
    `INSERT INTO comments (
       id, article_slug, author_name, content, ip_hash, user_agent, created_at, updated_at
     )
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`,
  )
    .bind(id, articleSlug, parsed.authorName, parsed.content, ipHash, userAgent, createdAt)
    .run()

  return json(
    {
      comment: {
        id,
        articleSlug,
        authorName: parsed.authorName,
        content: parsed.content,
        createdAt,
      },
      message: '评论已发布',
    },
    201,
  )
}

function parseCommentPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return { error: '请填写评论内容' }
  }

  const body = payload as Record<string, unknown>
  const authorName = cleanText(body.authorName)
  const content = cleanText(body.content)

  if (!authorName) {
    return { error: '请填写昵称' }
  }

  if (!content) {
    return { error: '请填写评论内容' }
  }

  if (authorName.length > maxAuthorLength) {
    return { error: `昵称不能超过 ${maxAuthorLength} 个字符` }
  }

  if (content.length > maxContentLength) {
    return { error: `评论不能超过 ${maxContentLength} 个字符` }
  }

  return { authorName, content }
}

async function isCommentAllowed(env: Env, authorName: string, content: string) {
  try {
    const prompt = [
      '你是海特洛市网站评论区的中文内容审核员。',
      '请判断用户评论是否可以公开展示。',
      '如果包含人身攻击、仇恨、色情、暴力威胁、违法交易、隐私泄露、广告垃圾信息或明显破坏讨论秩序的内容，标记为 reject。',
      '如果只是轻微负面意见、正常吐槽、城市设定讨论或无害玩笑，标记为 approve。',
      '只返回 JSON，不要返回 Markdown。格式：{"decision":"approve|reject","reason":"简短中文理由"}',
      `昵称：${authorName}`,
      `评论：${content}`,
    ].join('\n')

    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: '你只输出符合要求的 JSON。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 180,
      temperature: 0,
    })

    return parseModerationDecision(extractAiText(result)) === 'approve'
  } catch {
    return false
  }
}

function parseModerationDecision(text: string) {
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonText) {
    return 'reject'
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>
    return parsed.decision === 'approve' ? 'approve' : 'reject'
  } catch {
    return 'reject'
  }
}

function extractAiText(result: unknown) {
  if (typeof result === 'string') {
    return result
  }

  if (!result || typeof result !== 'object') {
    return ''
  }

  const response = result as Record<string, unknown>
  for (const key of ['response', 'result', 'text', 'content']) {
    const value = response[key]
    if (typeof value === 'string') {
      return value
    }
  }

  const choices = response.choices
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined
    const message = first?.message as Record<string, unknown> | undefined
    if (typeof message?.content === 'string') {
      return message.content
    }
  }

  return JSON.stringify(result)
}

function toPublicComment(comment: StoredComment): PublicComment {
  return {
    id: comment.id,
    articleSlug: comment.article_slug,
    authorName: comment.author_name,
    content: comment.content,
    createdAt: comment.created_at,
  }
}

function normalizeSlug(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase()
  return /^[a-z0-9][a-z0-9-]{0,96}$/.test(slug) ? slug : ''
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

async function hashClientIp(request: Request) {
  const ip = request.headers.get('cf-connecting-ip')
  if (!ip) {
    return null
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...jsonHeaders,
        ...headers,
      },
    }),
  )
}

function withCors(response: Response) {
  const next = new Response(response.body, response)
  next.headers.set('access-control-allow-origin', '*')
  next.headers.set('access-control-allow-methods', allowedMethods)
  next.headers.set('access-control-allow-headers', 'content-type')
  next.headers.set('access-control-max-age', '86400')
  return next
}
