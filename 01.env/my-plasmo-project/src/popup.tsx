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
      <CountButton count={count} setCount={setCount} />
    </div>
  )
}

export default IndexPopup
