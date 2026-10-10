import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { id } = req.body

  const requestId = `getAddressData_${Date.now()}_${id}`

  await storage.set("lastRequestId", requestId)

  chrome.action.openPopup()
  // TODO:做一个授权，然后返回 数据
  const data = {
    address: "0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A"
  }

  storage.watch({
    lastRequestId: (change) => {
      console.log("lastRequestId changed from", change)
      res.send({
        success: true,
        data
      })
      storage.unwatchAll()

      return
    }
  })

  
}

export default handler
