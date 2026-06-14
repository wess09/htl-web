import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Bus,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudSun,
  Compass,
  Cross,
  Eye,
  FileCheck2,
  FileText,
  Globe2,
  GraduationCap,
  Handshake,
  HeartPulse,
  Home,
  IdCard,
  Landmark,
  Leaf,
  Map,
  MapPin,
  Menu,
  MessageSquareText,
  MonitorCog,
  Phone,
  RadioTower,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'
import './App.css'
import { articles, getArticle } from './data/articles'

const images = {
  reef: '/2a260c3677c79849ec71ee4c6c18cd63.png',
  hall: '/300db4e0a44b813c9e06ad9b187dbbda.png',
  lane: '/360384958ad50d217a3ab7a24ae6ada0.png',
  coast: '/364bdc4de54f4f11a15d6e2fbfa43516.png',
  plaza: '/59535e62e67496a79254e25042270680.png',
  blossom: '/5c61ec685043b7e3d36671b20302169f.png',
  garden: '/8254118e0ecf439df4b20b59e37c26dd.png',
  arcade: '/84153e97076881a5be244827f1b1cea3.png',
  comet: '/893dd57d91446685671752997b5fd9c2.png',
  canopy: '/a0020c9d2e35358d2569287cb192132f.png',
  skyline: '/da85860e3b617e4620dad5d6d846f97c.png',
  market: '/dc06f443ea868894d70cbc260048d998.png',
  campus: '/e2c9ba4edd28d42ebf648f461a758ff1.png',
}

const navItems = [
  { label: '城市概览', path: '/' },
  { label: '探索海特洛', path: '/explore' },
  { label: '异象事务', path: '/anomaly' },
  { label: '居民服务', path: '/services' },
  { label: '城市动态', path: '/news' },
  { label: '关于', path: '/about' },
]

const stats = [
  { label: '城市定位', value: '开放都市', note: '日常与异象并行', icon: Users },
  { label: '主要区域', value: '多片区', note: '以公开资料为准', icon: Building2 },
  { label: '异象事务', value: '常态化', note: '委托、观测与处置', icon: RadioTower },
  { label: '出行方式', value: '多类型', note: '街区、轨道与道路', icon: TrainFront },
  { label: '探索内容', value: '持续更新', note: '资料随官方信息补充', icon: Leaf },
]

const values = [
  { title: '异常共生', text: '城市日常与异象事件长期交织，构成海特洛独有的生活底色。', icon: Activity },
  { title: '都市传闻', text: '从未闻浦旧港到新赫兰德高楼，怪谈总在霓虹背后流动。', icon: Handshake },
  { title: '五区格局', text: '金融、旅游、生活、旧港与交通枢纽共同支撑城市运转。', icon: Globe2 },
  { title: '调查网络', text: '调查员、企业与地下势力在异常事件中保持微妙平衡。', icon: ShieldCheck },
  { title: '海湾未来', text: '海底遗迹与异常科技推动城市繁荣，也埋下新的危机。', icon: Leaf },
]

const districts = [
  ['新赫兰德区', '金融与商业核心区'],
  ['米格尔区', '滨海旅游区'],
  ['绘空町', '传统生活区'],
  ['未闻浦', '旧港与灰色地带'],
  ['桥间地', '交通枢纽区'],
]

const milestones = [
  ['约200年前', '海湾聚落时代', '海特洛最初只是东大陆沿岸的小型渔村，未闻浦的雏形在这一时期形成。'],
  ['约150年前', '贸易港时代', '正式港口建成，未闻浦成为重要贸易港，绘空町作为早期居民区逐渐出现。'],
  ['约80年前', '工业化时代', '铁路进入海特洛，桥间地因连接港口与内陆工业区而诞生。'],
  ['约40年前', '异常降临时代', '海域首次出现空间扭曲、异象生物与神秘遗迹等无法解释的异常现象。'],
  ['约20年前', '新都市建设时代', '新赫兰德计划启动，金融、科技与国际贸易功能向新城区集中。'],
  ['现在', '现代海特洛', '五大城区共同构成国际化都市，繁华表象之下仍隐藏着遗迹、秘密与扩散中的异象事件。'],
]

const highlights = [
  { title: '都市夜景', text: '高楼、街灯与招牌构成海特洛的第一视觉印象。', img: images.skyline, icon: Landmark },
  { title: '道路与车辆', text: '城市探索围绕街区移动与开放场景展开。', img: images.coast, icon: Bus },
  { title: '商业街巷', text: '店铺、霓虹与生活细节承载城市气质。', img: images.arcade, icon: Camera },
]

const exploreSpots = [
  { title: '米格尔区', tag: '滨海旅游区', img: images.reef, icon: Waves, text: '海岸、观景区域、游艇码头与大型主题公园集中于此。' },
  { title: '绘空町', tag: '传统生活区', img: images.blossom, icon: MapPin, text: '商业街、住宅区、学校与本地文化中心构成浓厚生活氛围。' },
  { title: '未闻浦', tag: '旧港与灰色地带', img: images.market, icon: Compass, text: '废弃码头、仓库群与黑市交易区交织，隐藏探索内容较多。' },
  { title: '新赫兰德区', tag: '金融与商业核心区', img: images.skyline, icon: Landmark, text: '企业总部、高层写字楼与全市最高地价共同塑造不夜城。' },
]

const anomalyCards = [
  { title: '米格尔区海底异常', level: '高频传闻', img: images.reef, icon: Waves, text: '海底遗迹与异常活动相关传闻较多，是调查机构长期关注的区域。' },
  { title: '未闻浦旧港事件', level: '隐藏线索', img: images.hall, icon: RadioTower, text: '废弃码头、仓库群与黑市交易区附近常有无法确认的目击记录。' },
  { title: '新赫兰德都市怪谈', level: '企业传闻', img: images.comet, icon: Sparkles, text: '部分企业被传秘密参与异常研究，高层楼宇间流传着都市怪谈。' },
]

const serviceEntries = [
  { title: '身份证件', text: '办理、换领、补办', icon: IdCard },
  { title: '医疗健康', text: '就医、医保服务', icon: HeartPulse },
  { title: '住房保障', text: '租房、购房、保障房', icon: Home },
  { title: '教育服务', text: '入学、考试、资助', icon: GraduationCap },
  { title: '交通出行', text: '公交、地铁、通行', icon: Bus },
  { title: '税务服务', text: '申报与缴纳', icon: Scale },
  { title: '生活缴费', text: '水电燃气、话费', icon: Zap },
  { title: '应急求助', text: '报警、急救、救援', icon: BellRing },
]

type IconCardProps = {
  title: string
  text: string
  icon: LucideIcon
}

function IconCard({ title, text, icon: Icon }: IconCardProps) {
  return (
    <article className="icon-card">
      <Icon />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  )
}

function SectionTitle({ kicker, title, action }: { kicker?: string; title: string; action?: string }) {
  return (
    <div className="section-title">
      <div>
        {kicker && <span>{kicker}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        <Link to="/news">
          {action}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

function Hero({
  title,
  subtitle,
  image,
  children,
}: {
  title: string
  subtitle: string
  image: string
  children?: ReactNode
}) {
  return (
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 18, 32, .92), rgba(8, 18, 32, .45), rgba(8, 18, 32, .1)), url(${image})` }}>
      <div className="hero-content">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </section>
  )
}

function Header() {
  return (
    <header className="site-header" id="top">
      <NavLink to="/" className="brand" aria-label="海特洛市首页">
        <img src="/logo.png" alt="" />
        <div>
          <strong>海特洛市</strong>
          <span>HETHEREAU CITY</span>
        </div>
      </NavLink>
      <nav className="desktop-nav" aria-label="主导航">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="header-tools">
        <button aria-label="搜索">
          <Search size={22} />
        </button>
        <button className="language">
          简体中文
          <ChevronDown size={16} />
        </button>
        <button className="mobile-menu" aria-label="菜单">
          <Menu size={24} />
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src="/logo.png" alt="" />
        <div>
          <strong>海特洛市人民政府</strong>
          <span>HETHEREAU CITY GOVERNMENT</span>
        </div>
      </div>
      <div className="footer-links">
        {['隐私政策', '使用条款', '网站地图', '联系我们', '无障碍访问', '官方社交媒体'].map((item) => (
          <a key={item} href="#top">
            {item}
          </a>
        ))}
      </div>
      <p>© 2026 海特洛市人民政府 版权所有　ICP备案号：HTL-20260001</p>
    </footer>
  )
}

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/anomaly" element={<Anomaly />} />
          <Route path="/services" element={<Services />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<ArticleDetail />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function Overview() {
  return (
    <>
      <Hero title="城市概览" subtitle="超自然与现代文明共生的活力都市" image={images.skyline}>
        <p className="hero-copy">基于《异环》公开资料整理的海特洛城市门户，用于浏览城市信息、异象事务、居民指南与动态文章。</p>
      </Hero>
      <section className="panel lift">
        <SectionTitle title="城市关键数据" />
        <div className="stats-grid">
          {stats.map(({ icon: Icon, ...item }) => (
            <article className="stat-card" key={item.label}>
              <Icon />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="content-grid overview-grid">
        <article className="panel">
          <SectionTitle title="城市简介" />
          <div className="map-card">
            <Map className="map-bg" />
            {districts.map(([name, desc]) => (
              <div key={name}>
                <b>{name}</b>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <SectionTitle title="发展历程" />
          <ol className="timeline">
            {milestones.map(([year, title, text]) => (
              <li key={year}>
                <time>{year}</time>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>
        <article className="panel values-panel">
          <SectionTitle title="城市价值与规划支柱" />
          <div className="value-grid">
            {values.map((item) => (
              <IconCard key={item.title} {...item} />
            ))}
          </div>
        </article>
      </section>
      <section className="panel">
        <SectionTitle title="城市亮点" action="了解更多" />
        <div className="feature-row">
          {highlights.map(({ icon: Icon, ...item }) => (
            <article className="image-feature" key={item.title}>
              <img src={item.img} alt="" />
              <div>
                <Icon />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link to="/explore">
                  了解更多
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function Explore() {
  return (
    <>
      <Hero title="探索海特洛" subtitle="从海底光廊到樱花坡道，发现城市的多重面貌" image={images.reef} />
      <section className="panel lift">
        <SectionTitle kicker="Visit" title="推荐目的地" action="查看地图" />
        <div className="spot-grid">
          {exploreSpots.map(({ icon: Icon, ...spot }) => (
            <article className="spot-card" key={spot.title}>
              <img src={spot.img} alt="" />
              <div>
                <span>{spot.tag}</span>
                <h3>{spot.title}</h3>
                <p>{spot.text}</p>
                <Icon />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="content-grid two">
        <article className="panel">
          <SectionTitle title="三日城市路线" />
          {['新赫兰德区与中央车站', '绘空町与米格尔区海岸', '未闻浦与桥间地交通线'].map((item, index) => (
            <div className="route-item" key={item}>
              <b>Day {index + 1}</b>
              <span>{item}</span>
            </div>
          ))}
        </article>
        <article className="panel photo-panel" style={{ backgroundImage: `url(${images.coast})` }}>
          <h2>米格尔区海岸线</h2>
          <p>海滨商业街、游艇码头与观景区域串联，是外地游客接触海特洛的第一站。</p>
        </article>
      </section>
    </>
  )
}

function Anomaly() {
  return (
    <>
      <Hero title="异象事务" subtitle="城市异常现象监测、公开说明与协同治理平台" image={images.comet}>
        <div className="hero-actions">
          <a href="#alerts">查看播报</a>
          <a href="#report">提交线索</a>
        </div>
      </Hero>
      <section className="panel lift" id="alerts">
        <SectionTitle title="异象监测播报" action="历史记录" />
        <div className="anomaly-grid">
          {anomalyCards.map(({ icon: Icon, ...card }) => (
            <article className="anomaly-card" key={card.title}>
              <img src={card.img} alt="" />
              <div>
                <span>{card.level}</span>
                <Icon />
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="content-grid two" id="report">
        <article className="panel">
          <SectionTitle title="处置流程" />
          <div className="process">
            {[
              [Eye, '发现线索'],
              [Phone, '热线上报'],
              [RadioTower, '分级研判'],
              [ShieldCheck, '现场处置'],
              [FileCheck2, '公开反馈'],
            ].map(([Icon, title]) => {
              const TypedIcon = Icon as LucideIcon
              return (
                <div key={title as string}>
                  <TypedIcon />
                  <span>{title as string}</span>
                </div>
              )
            })}
          </div>
        </article>
        <article className="panel warning-panel">
          <AlertTriangle />
          <h2>公众提示</h2>
          <p>遇到未知发光、异常低温、重复回声或空间错位，请保持距离并记录时间地点，勿自行接触。</p>
          <button>一键上报</button>
        </article>
      </section>
    </>
  )
}

function Services() {
  return (
    <>
      <Hero title="居民服务" subtitle="数字化公共服务平台，服务每一位居民、通勤者与访客" image={images.campus}>
        <div className="weather-widget">
          <CloudSun />
          <strong>18°C</strong>
          <span>晴朗　海特洛时间 21:37</span>
        </div>
      </Hero>
      <section className="content-grid service-layout lift">
        <article className="panel service-main">
          <SectionTitle title="服务快捷入口" />
          <div className="service-grid">
            {serviceEntries.map((item) => (
              <IconCard key={item.title} {...item} />
            ))}
          </div>
        </article>
        <aside className="panel my-work">
          <SectionTitle title="我的办事" />
          <div className="work-stats">
            <div>
              <span>预约记录</span>
              <strong>2</strong>
              <p>即将到来的预约</p>
            </div>
            <div>
              <span>办件进度</span>
              <strong>3</strong>
              <p>进行中的办件</p>
            </div>
          </div>
          <button>登录 / 注册</button>
        </aside>
      </section>
      <section className="content-grid three">
        <article className="panel">
          <SectionTitle title="常用服务" action="查看更多" />
          {['居住登记申报', '社保查询', '公积金查询', '不动产查询'].map((item) => (
            <div className="list-row" key={item}>
              <FileText />
              <span>{item}</span>
              <button>去办理</button>
            </div>
          ))}
        </article>
        <article className="panel service-center">
          <SectionTitle title="服务网点" />
          <img src={images.campus} alt="" />
          <h3>桥间地综合服务点</h3>
          <p>靠近轨道交通换乘中心，适合处理跨区出行与基础服务。</p>
          <button>查看详情</button>
        </article>
        <article className="panel help-card">
          <Phone />
          <strong>12345</strong>
          <span>7×24小时政务服务热线</span>
          <button>在线咨询</button>
          <button>意见建议</button>
        </article>
      </section>
    </>
  )
}

function News() {
  return (
    <>
      <Hero title="城市动态" subtitle="整理海特洛五大城区、异象传闻与探索记录" image={images.plaza} />
      <section className="content-grid news-layout lift">
        <article className="panel lead-news">
          <div className="tabs">
            {['全部', '城市档案', '区域探索', '异象记录', '同人设定'].map((tab, index) => (
              <button className={index === 0 ? 'active' : ''} key={tab}>
                {tab}
              </button>
            ))}
          </div>
          {articles[0] && (
            <Link className="headline" to={`/news/${articles[0].slug}`}>
              <img src={articles[0].cover} alt="" />
              <div>
                <span>{articles[0].category}</span>
                <h2>{articles[0].title}</h2>
                <p>{articles[0].excerpt}</p>
                <b>
                  阅读全文
                  <ArrowRight size={16} />
                </b>
              </div>
            </Link>
          )}
          {articles.slice(1).map((article) => (
            <Link className="news-row" to={`/news/${article.slug}`} key={article.slug}>
              <span>{article.category}</span>
              <b>{article.title}</b>
              <time>{article.date}</time>
              <small>
                <Eye size={14} />
                查看
              </small>
            </Link>
          ))}
        </article>
        <aside className="side-stack">
          <article className="panel">
            <SectionTitle title="最近文章" action="查看全部" />
            {articles.slice(0, 4).map((article) => (
              <Link className="event-row" to={`/news/${article.slug}`} key={article.slug}>
                <time>{article.date.slice(5)}</time>
                <span>{article.title}</span>
              </Link>
            ))}
          </article>
          <article className="panel">
            <SectionTitle title="档案目录" />
            {articles.map((article, index) => (
              <Link className="trend-row" to={`/news/${article.slug}`} key={article.slug}>
                <b>{index + 1}</b>
                <span>{article.title}</span>
                <small>{article.category}</small>
              </Link>
            ))}
          </article>
        </aside>
      </section>
      <section className="panel">
        <SectionTitle title="城市影像" action="查看更多" />
        <div className="gallery">
          {[images.skyline, images.coast, images.comet, images.hall].map((img) => (
            <img src={img} alt="" key={img} />
          ))}
        </div>
      </section>
    </>
  )
}

function ArticleDetail() {
  const { slug } = useParams()
  const article = getArticle(slug)

  if (!article) {
    return (
      <>
        <Hero title="文章未找到" subtitle="请检查 JSON 文件名是否与访问路径一致" image={images.plaza} />
        <section className="panel lift empty-state">
          <CircleHelp />
          <h2>没有找到这篇文章</h2>
          <p>新增文章时，请把 JSON 放到 src/data/articles/，文件名会自动成为 /news/文件名 路由。</p>
          <Link to="/news">返回城市动态</Link>
        </section>
      </>
    )
  }

  return (
    <>
      <Hero title={article.title} subtitle={article.excerpt} image={article.cover} />
      <article className="panel lift article-detail">
        <div className="article-meta">
          <span>{article.category}</span>
          <time>{article.date}</time>
          {article.author && <span>{article.author}</span>}
        </div>
        {article.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {article.tags && (
          <div className="tag-row">
            {article.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </article>
    </>
  )
}

function About() {
  return (
    <>
      <Hero title="关于海特洛" subtitle="我们的使命、治理、城市精神与数字平台" image={images.skyline} />
      <section className="content-grid two lift">
        <article className="panel about-intro">
          <SectionTitle title="城市介绍" />
          <p>
            海特洛市是一座自然与现代文明共生的活力都市，位于海特洛大陆的核心区域。城市以科技创新、开放包容与安全韧性为基石，致力于为居民与来访者提供高质量的生活、工作与探索体验。
          </p>
          <img src={images.plaza} alt="" />
        </article>
        <article className="panel">
          <SectionTitle title="使命、愿景、核心价值观" />
          <div className="mission-grid">
            <IconCard title="使命" text="守护城市安全与秩序，服务居民福祉。" icon={BadgeCheck} />
            <IconCard title="愿景" text="建设开放、创新、可持续的未来都市。" icon={Eye} />
            <IconCard title="价值观" text="安全、诚信、公平、创新、共生。" icon={Landmark} />
          </div>
        </article>
      </section>
      <section className="content-grid three">
        <article className="panel">
          <SectionTitle title="治理与组织架构" />
          <div className="org-chart">
            <strong>海特洛市政府</strong>
            <div>
              {['异象管理局', '公共安全局', '城市发展局', '民生服务局', '财政审计局'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </article>
        <article className="panel departments">
          <SectionTitle title="主要机构与部门" />
          {[
            [MonitorCog, '异象管理局'],
            [ShieldCheck, '公共安全局'],
            [Building2, '城市发展局'],
            [Cross, '民生服务局'],
            [BookOpen, '教育文化局'],
            [BriefcaseBusiness, '财政与审计局'],
          ].map(([Icon, title]) => {
            const TypedIcon = Icon as LucideIcon
            return (
              <div key={title as string}>
                <TypedIcon />
                <span>{title as string}</span>
              </div>
            )
          })}
        </article>
        <article className="panel">
          <SectionTitle title="联系我们" />
          {[
            [MapPin, '新赫兰德区 / 桥间地 / 绘空町'],
            [Phone, '+86 400-886-0000'],
            [MessageSquareText, 'contact@haiteluo.com'],
            [Clock3, '周一至周五 08:30-17:30'],
          ].map(([Icon, text]) => {
            const TypedIcon = Icon as LucideIcon
            return (
              <div className="contact-row" key={text as string}>
                <TypedIcon />
                <span>{text as string}</span>
              </div>
            )
          })}
        </article>
      </section>
      <section className="panel faq">
        <SectionTitle title="常见问题" action="查看全部 FAQ" />
        {['如何办理居民身份证？', '网站提供哪些在线服务？', '如何获取最新城市公告？', '遇到异象事件如何报告？'].map((item) => (
          <details key={item}>
            <summary>
              {item}
              <ChevronDown size={18} />
            </summary>
            <p>请通过本网站对应栏目提交申请或拨打 12345 政务服务热线获取帮助。</p>
          </details>
        ))}
      </section>
    </>
  )
}

export default Layout
