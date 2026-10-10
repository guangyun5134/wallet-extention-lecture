import { CountButton } from "~features/count-button"

import "~style.css"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

function IndexPopup() {
  const [count, setCount] = useStorage<number>("count", 0)

  // 监听key 的变化
  const storage = new Storage()
  storage.watch({
    count: (change) => {
      console.log("count changed from", change)
    }
  })

  return (
    <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-16 plasmo-w-40">
      <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center">
        <div>是否同意授权？</div>
        <button className="plasmo-bg-green-500 plasmo-text-white plasmo-p-2 plasmo-rounded-md" onClick={() => {
          storage.set("lastRequestId", Math.random().toString(36).substring(2, 15))
          setTimeout(() => {
            window.close()
          }, 100);
        }}>同意</button>
        <button className="plasmo-bg-red-500 plasmo-text-white plasmo-p-2 plasmo-rounded-md" onClick={() => {
          storage.set("lastRequestId", Math.random().toString(36).substring(2, 15))
          setTimeout(() => {
            window.close()
          }, 100);
        }}>不同意</button>
      </div>
    </div>
  )
}

export default IndexPopup
