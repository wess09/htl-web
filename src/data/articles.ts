export type Article = {
  slug: string
  title: string
  category: string
  date: string
  author?: string
  cover: string
  excerpt: string
  tags?: string[]
  source?: {
    label: string
    url: string
  }
  content: string[]
}

const modules = import.meta.glob('./articles/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Omit<Article, 'slug'>>

export const articles: Article[] = Object.entries(modules)
  .map(([path, article]) => ({
    ...article,
    slug: path.split('/').pop()?.replace(/\.json$/, '') ?? '',
  }))
  .sort((a, b) => b.date.localeCompare(a.date))

export function getArticle(slug: string | undefined) {
  return articles.find((article) => article.slug === slug)
}
