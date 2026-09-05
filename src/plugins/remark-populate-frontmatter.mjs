import matter from 'gray-matter'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Populate frontmatter for consumers that render content outside an Astro page.
 * 这个插件确保 file.data.astro.frontmatter 包含所有 frontmatter 数据
 */
export function remarkPopulateFrontmatter() {
    return function (tree, file) {
        // 确保 file.data.astro 和 frontmatter 对象存在
        if (!file.data) {
            file.data = {}
        }
        if (!file.data.astro) {
            file.data.astro = {}
        }
        
        // 如果 frontmatter 不存在或为空，尝试从 markdown 内容中解析
        if (!file.data.astro.frontmatter || Object.keys(file.data.astro.frontmatter).length === 0) {
            try {
                let rawContent = null
                
                // 方法1: 尝试从 file.value 或 file.contents 中获取原始 markdown 内容
                rawContent = file.value || file.contents || ''
                
                // 方法2: 如果方法1失败，尝试从文件系统读取
                if ((!rawContent || typeof rawContent !== 'string' || rawContent.length === 0) && file.history && file.history[0]) {
                    try {
                        const filePath = resolve(process.cwd(), file.history[0])
                        rawContent = readFileSync(filePath, 'utf-8')
                    } catch (fsError) {
                        // 文件系统读取失败，忽略
                    }
                }
                
                if (rawContent && typeof rawContent === 'string' && rawContent.length > 0) {
                    // 使用 gray-matter 解析 frontmatter
                    const parsed = matter(rawContent)
                    if (parsed.data && Object.keys(parsed.data).length > 0) {
                        // 如果 frontmatter 不存在，创建它
                        if (!file.data.astro.frontmatter) {
                            file.data.astro.frontmatter = {}
                        }
                        // 将解析的 frontmatter 数据合并到 file.data.astro.frontmatter
                        // 注意：只添加不存在的键，避免覆盖已有的数据
                        Object.keys(parsed.data).forEach(key => {
                            if (!(key in file.data.astro.frontmatter)) {
                                file.data.astro.frontmatter[key] = parsed.data[key]
                            }
                        })
                    }
                }
            } catch (error) {
                // 如果解析失败，静默失败，不影响内容渲染
            }
        }
    }
}

