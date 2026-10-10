import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  // exclude_matches: ['https://www.baidu.com'],
  world: "MAIN"
}

export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize

    return `${pixelsValue}px`
  })

  const styleElement = document.createElement("style")

  styleElement.textContent = updatedCssText

  return styleElement
}

declare global {
  interface Window {
    zood?: {
      name: string
      age: number
      sayHello: () => void
    }
  }
}

window.zood = {
  name: 'qaq',
  age: 18,
  sayHello: () => {
    console.log('hello');
  }
}

const PlasmoOverlay = () => {
  async function sendMessageToBackground() {
    const response = await sendToBackground({
      // @ts-ignore
      name: "getData",
      body: {
        id: 123
      }
    })

    console.log("response::", response);
    
  }
  return (
    <div className="plasmo-z-50 plasmo-bg-[#f40] plasmo-text-[#fff] plasmo-flex plasmo-fixed plasmo-top-[232px] plasmo-right-8">
      <button onClick={() => sendMessageToBackground()}>Send Message</button>
    </div>
  )
}


export default PlasmoOverlay
