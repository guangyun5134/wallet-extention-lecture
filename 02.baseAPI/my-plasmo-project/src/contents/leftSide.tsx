import type { PlasmoCSConfig } from "plasmo"
import cssText from "data-text:~style.css"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
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

  export const getInlineAnchor = (): HTMLDivElement => {
    return document.querySelector("#s_top_wrap")
  }

const LeftSide = () => {
  return (
    <div className="plasmo-h-[1000px] plasmo-w-[200px] plasmo-bg-[#f40] plasmo-text-[#fff] plasmo-fixed plasmo-z-50 plasmo-left-0 plasmo-top-0">
        <div className="plasmo-h-[100px] plasmo-w-[100px] plasmo-bg-[#000] plasmo-text-[#fff] plasmo-flex plasmo-justify-center plasmo-items-center">
            <div className="plasmo-text-[#fff] plasmo-text-2xl plasmo-font-bold">LeftSide</div>
        </div>
    </div>
  )
}

export default LeftSide