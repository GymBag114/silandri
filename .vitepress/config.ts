import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config

const siteUrl = 'https://silandri.top'

export default defineConfig({
  title: "SILANDRI",
  description: "席兰德里",
  lang: "zh-CN",
  head: [['link', { rel: 'icon', type: 'image/webp', href: `/image/SILANDRI/logo-mark.webp` }]],
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: `${siteUrl}/`
  },
  transformHead: ({ pageData }) => {
    const routePath = pageData.relativePath === 'index.md'
      ? '/'
      : `/${pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')}`

    const canonicalUrl = new URL(routePath, `${siteUrl}/`).toString()
    const pageTitle = pageData.title
      ? `${pageData.title} | SILANDRI`
      : 'SILANDRI'
    const pageDescription = pageData.description || '席兰德里'

    return [
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: pageDescription }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:type', content: pageData.relativePath === 'index.md' ? 'website' : 'article' }],
      ['meta', { property: 'og:site_name', content: 'SILANDRI' }]
    ]
  },
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: "SILANDRI",
    outline: { level: "deep", label: "目录" },
    search: { provider: "local" },
    nav: [
      { text: '首页', link: '/' },
      { text: '介绍', link: '/guide/intro' },
      { text: "成员", link: "/members" }
    ],
    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }
    },
    darkModeSwitchLabel:"外观",
    lightModeSwitchTitle:"切换至浅色模式",
    darkModeSwitchTitle:"切换至深色模式",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "回到顶部",
    externalLinkIcon: true,
    sidebar: [
        {
          text: "开始之前……",
          collapsed: false,
          items: [
            { text: "介绍", link: "/guide/intro" },
          ]
        },
        {
          text: "施工测试",
          collapsed: false,
          items: [
            { text: "Markdown 解析测试", link: "/testing/markdown-test" }
          ]
        }
      ],
    logo: {
      src: '/image/SILANDRI/logo-mark.webp',
      alt: 'SILANDRI 标志'
    },
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: `Copyright © 2023-present SILANDRI`
    },
    editLink: {
      pattern: `https://github.com/GymBag114/silandri/edit/main/:path`,
      text: "在 GitHub 上编辑此页"
    }

  }
})
