import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const distDir = path.resolve('.vitepress/dist')
const publicDir = path.resolve('public')
const sitemapPath = path.join(distDir, 'sitemap.xml')

const host = (process.env.INDEXNOW_HOST || 'silandri.top').trim()
const endpoint = (process.env.INDEXNOW_ENDPOINT || 'https://www.bing.com/indexnow').trim()

async function readSitemapUrls(filePath) {
  const xml = await readFile(filePath, 'utf8')
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).filter(Boolean)
}

async function writeKeyFile(indexNowKey) {
  await mkdir(distDir, { recursive: true })
  const keyFilePath = path.join(distDir, `${indexNowKey}.txt`)
  await writeFile(keyFilePath, `${indexNowKey}\n`, 'utf8')
  return keyFilePath
}

async function resolveKey() {
  const envKey = process.env.INDEXNOW_KEY?.trim()
  if (envKey) return envKey

  const entries = await readdir(publicDir, { withFileTypes: true })
  const keyFile = entries.find(
    (entry) => entry.isFile() && /^[a-f0-9]{32}\.txt$/i.test(entry.name)
  )

  if (!keyFile) return undefined

  return keyFile.name.replace(/\.txt$/i, '')
}

async function submitIndexNow(urlList, indexNowKey) {
  const keyLocation = `https://${host}/${indexNowKey}.txt`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      host,
      key: indexNowKey,
      keyLocation,
      urlList
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`IndexNow 提交失败：${response.status} ${response.statusText}\n${body}`)
  }

  console.log(`IndexNow 已向 ${endpoint} 提交 ${urlList.length} 个 URL。密钥为 ${indexNowKey}，密钥文件位置：${keyLocation}，提交列表：\n${urlList.join('\n')}`)
}

async function main() {
  const urlList = await readSitemapUrls(sitemapPath)
  const key = await resolveKey()

  if (!urlList.length) {
    console.warn(`在 ${sitemapPath} 中未找到 URL，已跳过 IndexNow 提交。`)
    return
  }

  if (!key) {
    console.warn('未在 INDEXNOW_KEY 或 public/*.txt 中找到 IndexNow key，已跳过提交。')
    return
  }

  await writeKeyFile(key)
  await submitIndexNow(urlList, key)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : `IndexNow 脚本执行失败：${String(error)}`)
  process.exitCode = 1
})
