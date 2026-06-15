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

type ModerationDecision = 'approve' | 'reject' | 'unavailable'

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

const allowedMethods = 'GET, POST, OPTIONS'
const commentPathPattern = /^\/api\/comments\/([^/]+)$/
const maxAuthorLength = 32
const maxContentLength = 800
let schemaReady: Promise<void> | null = null

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

  const schemaResponse = await ensureSchemaResponse(env)
  if (schemaResponse) {
    return schemaResponse
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

  const schemaResponse = await ensureSchemaResponse(env)
  if (schemaResponse) {
    return schemaResponse
  }

  const moderation = await moderateComment(env, parsed.authorName, parsed.content)
  if (moderation === 'unavailable') {
    return json({ code: 'AI_UNAVAILABLE', error: '自动审核暂时不可用，请稍后再试' }, 503)
  }

  if (moderation === 'reject') {
    return json({ accepted: false, message: '评论未通过自动审核' })
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

async function ensureSchemaResponse(env: Env) {
  try {
    await ensureCommentsSchema(env)
    return null
  } catch {
    return json({ code: 'D1_UNAVAILABLE', error: '评论数据库暂时不可用，请稍后再试' }, 503)
  }
}

async function ensureCommentsSchema(env: Env) {
  if (!schemaReady) {
    schemaReady = createCommentsSchema(env).catch((error) => {
      schemaReady = null
      throw error
    })
  }

  return schemaReady
}

async function createCommentsSchema(env: Env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      article_slug TEXT NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
  ).run()

  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS comments_article_created_idx
     ON comments (article_slug, created_at DESC)`,
  ).run()

  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS comments_created_idx
     ON comments (created_at DESC)`,
  ).run()
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

async function moderateComment(env: Env, authorName: string, content: string): Promise<ModerationDecision> {
  try {
    const prompt = [
      '审核下面这条中文评论是否可以公开展示。',
      '规则：人身攻击、仇恨、色情、暴力威胁、违法交易、隐私泄露、广告垃圾信息或明显破坏讨论秩序，输出 REJECT。',
      '正常讨论、轻微负面意见、普通吐槽、城市设定讨论或无害玩笑，输出 APPROVE。',
      '只输出一个大写单词：APPROVE 或 REJECT。不要解释，不要 Markdown，不要 JSON。',
      `昵称：${authorName}`,
      `评论：${content}`,
    ].join('\n')

    const result = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
      messages: [
        {
          role: 'system',
          content: 'You are a strict moderation classifier. Reply with exactly one token: APPROVE or REJECT.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0,
    })

    return parseModerationDecision(result)
  } catch (error) {
    console.warn('Workers AI moderation failed', error)
    return 'unavailable'
  }
}

function parseModerationDecision(result: unknown): ModerationDecision {
  if (isSensitiveResponse(result)) {
    return 'reject'
  }

  const text = extractAiText(result).trim()
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0]
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>
      const decision = String(parsed.decision ?? parsed.result ?? parsed.label ?? '').toLowerCase()
      if (decision.includes('approve')) {
        return 'approve'
      }

      if (decision.includes('reject')) {
        return 'reject'
      }
    } catch {
      return 'unavailable'
    }
  }

  const normalized = text.toUpperCase()
  if (/\bAPPROVE\b/.test(normalized)) {
    return 'approve'
  }

  if (/\bREJECT\b/.test(normalized)) {
    return 'reject'
  }

  return 'unavailable'
}

function isSensitiveResponse(result: unknown) {
  if (!result || typeof result !== 'object') {
    return false
  }

  const response = result as Record<string, unknown>
  return response.input_sensitive === true || response.output_sensitive === true
}

function extractAiText(result: unknown) {
  if (typeof result === 'string') {
    try {
      return extractAiText(JSON.parse(result))
    } catch {
      return result
    }
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
