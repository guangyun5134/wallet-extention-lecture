# Plasmo 核心 API

### 项目结构
```plan-text
my-extension/
├── assets/          # 静态资源（图标、图片等）
├── src/
│   ├── popup.tsx    # 弹窗页面
│   ├── options.tsx  # 设置页面
│   ├── content.tsx  # 内容脚本
│   └── background.ts # 后台脚本
├── package.json
└── tsconfig.json
```

1. Storage API - 数据存储

Plasmo 提供了强大的存储 API，支持类型安全和自动同步。

基本使用
```js
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// 设置值
await storage.set("key", "value")

// 获取值
const value = await storage.get("key")

// 删除值
await storage.remove("key")
```

使用 Hook（在 React 组件中）
```js
import { useStorage } from "@plasmohq/storage/hook"

function MyComponent() {
  const [count, setCount] = useStorage<number>("count", 0)
  
  return (
    <div className="p-4">
      <p className="text-lg mb-2">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Increment
      </button>
    </div>
  )
}
```

存储区域选择
```js
import { Storage } from "@plasmohq/storage"

// Local Storage (默认)
const localStorage = new Storage({ area: "local" })

// Sync Storage (跨设备同步)
const syncStorage = new Storage({ area: "sync" })

// Session Storage (会话级别)
const sessionStorage = new Storage({ area: "session" })
```


监听存储变化
```js
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

storage.watch({
  "myKey": (change) => {
    console.log("Old value:", change.oldValue)
    console.log("New value:", change.newValue)
  }
})
```

## 2. Messaging API - 消息通信

发送消息
```js
import { sendToBackground } from "@plasmohq/messaging"

// 从 Popup/Content Script 发送到 Background
const response = await sendToBackground({
  name: "getData",
  body: {
    id: 123
  }
})
```

接收消息（Background）
```js
// background/messages/getData.ts
import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { id } = req.body
  
  // 处理逻辑
  const data = await fetchData(id)
  
  res.send({
    success: true,
    data
  })
}

export default handler
```

Content Script 与 Background 通信
```tsx
// content.tsx
import { sendToBackground } from "@plasmohq/messaging"

const response = await sendToBackground({
  name: "processData",
  body: { url: window.location.href }
})
```


### 补充：openPopup - 打开弹窗
虽然 Plasmo 没有内置 openPopup 函数，但你可以通过以下方式实现：
**方式一：使用 chrome.action API**
```ts
chrome.action.onClicked.addListener((tab) => {
  chrome.action.openPopup()
})
```

**方式二：打开 Popup 为独立窗口**
```ts
typescriptasync function openPopupWindow() {
  await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 400,
    height: 600
  })
}
```

## 3. Content Script 详解

> Content Script 是注入到网页中的脚本，可以读取和修改页面 DOM，是浏览器插件最强大的功能之一。
基础 Content Script
创建 content.tsx 或 content.ts 文件：
```tsx
// content.tsx
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.example.com/*"],
  all_frames: false
}

console.log("Content script loaded on:", window.location.href)

// 修改页面内容
document.body.style.border = "5px solid red"
```

配置选项
```typescript
export const config: PlasmoCSConfig = {
  // 匹配的网页 URL
  matches: [
    "https://www.google.com/*",
    "https://www.github.com/*"
  ],
  
  // 排除的 URL
  exclude_matches: ["https://www.google.com/admin/*"],
  
  // 注入时机
  run_at: "document_end", // document_start | document_end | document_idle
  
  // 是否在所有 iframe 中运行
  all_frames: false,
  
  // CSS 注入
  css: ["content-style.css"]
}
```

#### React Content Script UI
Plasmo 支持在页面中渲染 React 组件：
```tsx
// content.tsx
import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"]
}

const PlasmoOverlay = () => {
  const [count, setCount] = useState(0)

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-white rounded-lg shadow-xl p-4">
      <h2 className="text-lg font-bold mb-2">插件浮窗</h2>
      <p className="mb-2">计数: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        增加
      </button>
    </div>
  )
}

export default PlasmoOverlay
```

#### 多个 Content Script
通过文件命名约定创建多个 content script：
```
src/
├── content.tsx                    # 默认 content script
├── contents/
│   ├── inline.tsx                 # 内联模式
│   ├── sidebar.tsx                # 侧边栏
│   └── overlay.tsx                # 浮层
```

每个文件可以有独立的配置：

```tsx
// contents/sidebar.tsx
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"]
}

// 获取 Shadow Host（挂载点）
export const getShadowHostId = () => "plasmo-sidebar"

const Sidebar = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 text-white p-4 shadow-2xl">
      <h1 className="text-xl font-bold mb-4">GitHub 增强侧边栏</h1>
      <p>这是一个固定在右侧的侧边栏</p>
    </div>
  )
}

export default Sidebar
```

#### Inline Content Script
直接渲染在页面指定位置（非 Shadow DOM）：
```tsx
// contents/inline.tsx
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.google.com/*"]
}

// 指定插入位置
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  return document.querySelector("#search")
}

const InlineComponent = () => {
  return (
    <div className="my-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
      <p className="font-bold">插件提示</p>
      <p>这个组件被插入到了搜索框下方</p>
    </div>
  )
}

export default InlineComponent
```

动态插入位置

```tsx
import type { PlasmoGetInlineAnchor, PlasmoGetInlineAnchorList } from "plasmo"

// 单个锚点
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000)) // 等待页面加载
  return document.querySelector(".target-element")
}

// 多个锚点（在多个位置渲染）
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  return document.querySelectorAll(".post-item")
}
```

#### Content Script 样式隔离
Plasmo 默认使用 Shadow DOM 隔离样式：
```tsx
// 自定义 Shadow Root
export const getShadowHostId = () => "my-extension-container"

// 获取 Style 元素
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    .custom-class {
      color: red;
      font-weight: bold;
    }
  `
  return style
}
```

#### 禁用 Shadow DOM（使用页面样式）

```tsx
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"]
}

// 返回 undefined 禁用 Shadow DOM
export const getShadowHostId: PlasmoGetShadowHostId = () => undefined

const Component = () => {
  // 现在可以使用页面的 CSS
  return <div className="page-existing-class">使用页面样式</div>
}

export default Component
```

与页面 JavaScript 交互
Content Script 运行在隔离环境中，需要通过特殊方式与页面交互：

```typescript
// content.ts
// 注入脚本到页面上下文
const script = document.createElement("script")
script.textContent = `
  window.myPageFunction = function() {
    console.log("Called from page context")
  }
`
document.documentElement.appendChild(script)

// 监听页面事件
window.addEventListener("message", (event) => {
  if (event.source !== window) return
  
  if (event.data.type === "FROM_PAGE") {
    console.log("Received from page:", event.data.payload)
  }
})

// 发送消息到页面
window.postMessage({ 
  type: "FROM_EXTENSION", 
  payload: "Hello Page" 
}, "*")
```

#### Content Script 与 Background 通信

```typescript
// content.tsx
import { sendToBackground } from "@plasmohq/messaging"
import { useMessage } from "@plasmohq/messaging/hook"

const ContentComponent = () => {
  // 发送消息到 background
  const handleClick = async () => {
    const response = await sendToBackground({
      name: "fetchData",
      body: {
        url: window.location.href
      }
    })
    console.log("Response:", response)
  }

  // 接收来自 background 的消息
  useMessage(async (req, res) => {
    if (req.name === "updateContent") {
      console.log("Received update:", req.body)
      res.send({ success: true })
    }
  })

  return (
    <button onClick={handleClick}>
      获取数据
    </button>
  )
}

export default ContentComponent
```

#### Content Script 生命周期
```tsx
import { useEffect } from "react"

const ContentApp = () => {
  useEffect(() => {
    console.log("Content script mounted")
    
    // 清理函数
    return () => {
      console.log("Content script unmounted")
    }
  }, [])

  return <div>My Extension</div>
}

export default ContentApp
```

实战示例：页面高亮工具
```tsx
// contents/highlighter.tsx
import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const Highlighter = () => {
  const [isActive, setIsActive] = useStorage("highlighter_active", false)
  const [color, setColor] = useState("#ffff00")

  useEffect(() => {
    if (!isActive) return

    const handleMouseUp = () => {
      const selection = window.getSelection()
      const text = selection?.toString()

      if (text && text.length > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement("span")
        span.style.backgroundColor = color
        span.textContent = text
        
        range.deleteContents()
        range.insertNode(span)
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [isActive, color])

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white rounded-lg shadow-2xl p-4">
      <h3 className="font-bold mb-2">文本高亮工具</h3>
      
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mr-2"
          />
          启用高亮
        </label>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm">颜色:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-12 h-8 cursor-pointer"
        />
      </div>
    </div>
  )
}

export default Highlighter
```

#### Content Script 最佳实践

1. 性能优化

  - 使用 `run_at: "document_idle"` 避免阻塞页面加载
  - 精确匹配 URL，避免在所有页面运行
  - 使用防抖/节流处理高频事件


2. 样式隔离

  - 使用 Shadow DOM 避免样式冲突
  - 设置高 z-index 确保 UI 在顶层
  - 使用 Tailwind 的 prefix 功能


3. 内存管理

  - 组件卸载时清理事件监听器
  - 避免全局变量污染
  - 及时释放大对象引用


4. 兼容性

  - 处理 DOM 可能不存在的情况
  - 使用 MutationObserver 监听动态内容
  - 考虑 SPA 路由变化



```typescript
// 监听 SPA 路由变化
const observer = new MutationObserver(() => {
  console.log("Page changed")
  // 重新初始化逻辑
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})
```
