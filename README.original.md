# 钱包开发教学

本文将学习谷歌插件的钱包开发。实现最基本的钱包插件开发。
准备工作
我们需要开发一款运行在浏览器插件的钱包，我们的开发环境是插件环境，所以我们必须使用一个完善的类似于create-react-app ，来为我们生成代码仓库。
这里我们使用的是Plasmo，借用 Plasmo 文档的话，这是 “一个一体化平台，可让浏览器扩展程序开发人员轻松创建、测试和发布出色的扩展程序。借助 Plasmo，您可以告别繁琐的样板代码，享受更快、更无缝的开发体验。”
 开发文档地址：docs.plasmo.com/
 github 仓库地址：github.com/PlasmoHQ/pl…

 目前已经有 8.7k star属于一个比较成熟的框架。 所以选用这个作为我们的插件模板。
生成代码模板
使用
pnpm create plasmoORyarn create plasmoORnpm create plasmo
生成如下代码：
[图片]
这里着重说一下popup.tsx此文件导出默认的 React 组件，该组件将呈现到您的弹出页面中。这就是您在扩展弹出窗口上工作所需的全部内容！
安装其他组件
Web3 交互需要使用到的 ethers.js
其他的工具方法：
- react-loadable  组件懒加载
- react-loadable 组件懒加载
- queue 队列，用于插件通信
- eth-rpc-errors rpc 报错
- @extend-chrome/storage 插件存储
- @metamask/browser-passworder 插件密码管理
- ahooks 公共 hooks
- classnames
至此我们的插件模板就安装完成！！
下面进入到代码层面的开发阶段
路由配置
这里添加我们页面的路由，比如创建钱包页面、资产页面、设置页面等、以及密码页
我们需要加入ErrorBoundary，这个方法用于监听页面错误。
export class ErrorBoundary extends React.Component {
    state = { hasError: false }
    static getDerivedStateFromError(error: any) {
        return { hasError: true }
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error(error, errorInfo)
    }  
                  
    render() {
        if (this.state.hasError) {
            return (
                <Result
                    status="error"
                    title="系统异常"
                    subTitle="系统异常，请稍后重试"
                    extra={[
                        <Button type="primary" onClick={() => {message.success("上报成功")}}>
                            上报错误
                        </Button>,
                        <Button key="buy" onClick={() => {
                            window.location.reload()
                        }}>刷新重试</Button>
                        ]}>
                        </Result>
                     )}
                    // @ts-ignore    
            return this.props.children  }
    }
接下来需要配置一下我们的状态管理。插件钱包需要很多的状态管理，比如账号状态、钱包状态、当前链等等。
 这里我们使用unstated-next作为我们的状态管理。
在根目录下创建 stroe文件夹，预先创建 2 个文件 ChainStore.ts WalletStore.ts
代码目录结构如下：
[图片]
index.js
import { ChainStore } from "./ChainStore";
import { WalletStore } from "./WalletStore";
export const walletProviders = [WalletStore.Provider, ChainStore.Provider];
ChainStore.ts
/**链的数据存储 */
import { createContainer } from 'unstated-next';
const useChainStore = () => {};
export const ChainStore = createContainer(useChainStore);
Nested组件，这个组件的功能是可以接受多个 Providers，代码如下：
import React, { memo, type PropsWithChildren } from "react"

interface Props {
  components: Array<React.ComponentType | (({ children }) => JSX.Element)>
}

export const Nested = memo(function NestedComponents(props: PropsWithChildren<Props>) {
    const { components, children } = props
    return (
        <>
            {components.reduceRight((Prev, Curr) => {
                return <Curr>{Prev}</Curr>
                }, children)
            }
        </>
    )
})
状态管理的基本代码书写完毕，接下来进行路由的配置： 我们使用的是react-loadablereact 组件懒加载，用于性能优化，再加载页面的过程中可以放入骨架屏等，减少用户等待时间等。所以这个在加载页面组件时，用懒加载进行处理，例如插件钱包一开始的进入的页面。
import Loadable from "react-loadable"
import React from "react";
import { PageLoading } from "~components/PageLoading";
/* 页面初始化 */
const InitPage = Loadable({
    loader: () => import("~pages/InitPage"),
    loading: PageLoading
})
import { Skeleton } from "antd-mobile";
import React from "react"
import { memo } from "react"
export const PageLoading = memo(() => {  
    return (    
        <>      
            <Skeleton.Title animated />      
            <Skeleton.Paragraph lineCount={5} animated />
        </>  
)})
接下来需要写一个组件，用于路由跳转的逻辑，比如一开始用户没有创建钱包，我们需要引导去创建钱包页面。所以这里需要添加一个组件
export const RenderRoutes = memo(() => {  
    const nav = useNavigate()  
    useRequest(() => wallet.getAllWallets(), {
        onSuccess: (data) => {
              if (data?.length > 0) {
                      nav("/home")
                }
        }
      }
    )  
    const Route = useRoutes(routes)  
    return <div className="w-full h-full max-w-[360px] mx-auto">{Route}</div>
})
关于wallet.getAllWallets() 这些跟钱包交互相关的，这里就先埋个坑，等后续更新钱包交互，再来书写这块
组装我们的组件。
export const Root = memo(() => {
  return (
    <Nested components={walletProviders}>
        <HashRouter>
            <ErrorBoundary>
                <RenderRoutes />
            </ErrorBoundary>
        </HashRouter>
    </Nested>  
)})
最后在 popup.tsx 替换为：
import React from "react";
import { Root } from "~routes";
export default function Popup() {
  return <Root />
}
运行pnpm dev，将 build 下的 chrome-mv3-dev文件夹，放入chrome://extensions/
[图片]

通信的 API
chrome.runtime.onConnect.addListenerAPI
文档介绍：runebook.dev/zh/docs/web…
介绍
当使用扩展进程或内容脚本建立连接时触发。也就是说我内容脚本执行了这个方法browser.runtime.connect({name:"port-from-cs"}); 当前 API 便可以监听到连接事件。
同时也有如下的方法：
browser.runtime.onConnect.addListener(listener) // 向该事件添加监听器。
browser.runtime.onConnect.removeListener(listener) // 停止监听此事件。
browser.runtime.onConnect.hasListener(listener) // 检查 listener 是否已注册此事件。如果正在监听，则返回 true ，否则返回 false 。
browser.runtime.onConnect.addListener(listener) 这个方法监听的 listener，拿到的就是下面的chrome.runtime.Port API
chrome.runtime.Port API
文档介绍：runebook.dev/zh/docs/web…
介绍
官方解释： 该对象代表两个特定上下文之间连接的一端，可用于交换消息。一侧使用 connect() API 发起连接。这将返回一个 Port 对象。另一端使用 onConnect 侦听器侦听连接尝试。这是传递一个相应的 Port 对象。一旦双方都有 Port 对象，就可以使用 Port.postMessage() 和 Port.onMessage 交换消息。当它们完成时，任一端都可以使用 Port.disconnect() 断开连接，这将在另一端生成 Port.onDisconnect 事件，使另一端能够执行所需的任何清理工作。
翻译成中文~~（人话） ~~就是，我们通过 connect 来进行连接通信，使用同样的端口名称，我们就可以用 Port.postMessage 和 Port.onMessage 来进行通信。如果 2 端都使用 postMessage 和 onMessage 就可以实现，互相通信
- name: string，端口的名称
- disconnect：function 断开连接
- error： object 端口错误
- onDisconnect： 监听断开连接
- onMessage： 监听信息
- postMessage： 发送信息
实现一个简单通信例子
内容脚本创建一个连接 Port，发送一条信息。
同时监听 background 的 Port 时间。
// content-script.js

let myPort = browser.runtime.connect({name:"port-from-cs"});
myPort.postMessage({greeting: "hello from content script"});

myPort.onMessage.addListener((m) => {
  console.log("In content script, received message from background script: ");
  console.log(m.greeting);
});

document.body.addEventListener("click", () => {
  myPort.postMessage({greeting: "they clicked the page!"});
});

background 使用browser.runtime.onConnect.addListenerapi，获取所有的 port 连接
// background-script.js

let portFromCS;

function connected(p) {
  portFromCS = p; // 这个 p 就是一个 Port
  portFromCS.postMessage({greeting: "hi there content script!"});
  portFromCS.onMessage.addListener((m) => {
    console.log("In background script, received message from content script")
    console.log(m.greeting);
  });
}

browser.runtime.onConnect.addListener(connected); // 

browser.browserAction.onClicked.addListener(() => {
  portFromCS.postMessage({greeting: "they clicked the button!"});
});

如果有多个的话
// background-script.js
let ports = []

function connected(p) {
  ports[p.sender.tab.id]    = p
  // …
}

browser.runtime.onConnect.addListener(connected)

browser.browserAction.onClicked.addListener(() => {
  ports.forEach((p) => {
        p.postMessage({greeting: "they clicked the button!"})
    })
});

以上就是插件通信的方法介绍，接下来我们需要将这个通信实现在插件钱包里。
插件钱包通信
在 background 创建一个 index.js。
const init = () => {
    chrome.runtime.onConnect.addListener((port) => {
        console.log(port);
    })
}
init();//执行这个方法

上文介绍到多个连接的处理，这里我们需要进一步优化它。可以肯定的是，我们会有多个连接。如果后期的 Dapp 连接的通信等。因此我们需要实现一个方法，用来管理这些个 Port 连接。
创建一个 PortMessage 来进行管理 Port，使用一个 class类来管理
export class PortMessage {
      port: chrome.runtime.Port = null
      private requestIdPool = [...Array(1000).keys()]
      protected EVENT_PREFIX = "ETH_WALLET_"
      protected listenCallback: any
      
      private waitingMap = new Map<
        number,
        {
          data: any
          resolve: (arg: any) => any
          reject: (arg: any) => any
        }
      >() // 这里需要使用一个 map，同时返回一个 resolve 和 reject，通信使用 Promise 来管理，类似与请求 API 一样。
     listen = (listenCallback: any) => {
            if (!this.port) return
            this.listenCallback = listenCallback
            this.port.onMessage.addListener(({ _type_, data }) => {
              if (_type_ === `${this.EVENT_PREFIX}request`) {
                this.onRequest(data)
              }
            })
            return this
     }
}

修改 background/index.ts 文件
import walletMethods from "./walletService"

/* background 初始化 */
const init = () => {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") { // 这里使用的端口 name 为 popup 用来标识是 popup 创建的连接
      const pm = new PortMessage(port) // 使用PortMessage来优化 port
      pm.listen((data) => { //监听事件同时，约定 method，用于调用 background 中的方法
        if (data.method) {
          return walletMethods[data.method].apply(null, data.params) // 执行方法
        }
        return null
      })
      port.onDisconnect.addListener(() => {
      // 断开连接的处理。
      })
      return
    }
  })
}

init()


walletMethods 实现
export class WalletService {
  constructor() {
  }
  
  helloWorld(){
     console.log('hello world');
  }
}

export default new WalletService()

popup 创建连接，创建连接
import type { WalletService } from "~background/walletService"
import { getUIType } from "~utils/getUIType";
import { PortMessage } from "~utils/message"

const portMessageChannel = new PortMessage()
portMessageChannel.connect(getUIType());

export const wallet = new Proxy(
  {},
  {
    get(_, k) {
      return async (...params: any) => {
        try {
          // 获取钱包服务
          const res = await portMessageChannel.request({
            type: "controller",
            method: k,
            params
          })
          return res
        } catch (error) {
          Promise.reject(error)
          return {};
        }
      }
    }
  }
) as WalletService

在 React 组件中使用
 import { useRequest } from "ahooks"
 
 export const Demo = () => {
  useRequest(
    async () => {
      const info = await wallet.helloWorld()
      return info
    },
  )
  
  return <div>hello world</div>
 }

以上就实现了插件通信相关的代码，后续将进行钱包相关的开发，比如创建钱包、导入钱包、钱包账户系统等。


注入 ethereum 对象
通过 content-script
需要实现的接口 https://docs.metamask.io/wallet/reference/json-rpc-methods/eth_chainid/
wallet_addEthereumChain 添加区块链网络
eth_accounts 连接钱包，获取账户
eth_chainId 获取当前区块链网络id


需求：

前三天：
基于 sepolia 测试网
1. 基于BIP39 生成助记词、本地配置密码（存本地）、基于BIP42 创建账户私钥、导入账户私钥
2. 能够查询 eth 余额、其他代币余额
- EIP-747: 新增 RPC 方法 wallet_watchAsset， 用于向钱包添加 token, 支持 ERC-20 、ERC-721、ERC-1155
3. 可以导入ERC20代币、ERC721 并插叙余额
4. 可以转账（包括ETH、ERC20、721）
5. 用 content-script 将 mywallet 插入 window 对象  https://docs.metamask.io/wallet/reference/json-rpc-methods/eth_getbalance/
6. 用 background-script接收content-script的消息
7. 实现  EIP-1102:“ 新增 RPC 方法 eth_requestAccounts, 允许用户批准或拒绝给 Dapp 的哪些帐户的访问权限, 返回可供 Dapp 访问你的账号地址列表”
// 获取 provider
const provider = window.ethereum

// 请求连接钱包, 钱包插件通常会弹窗让用户选择要连接的账户地址, 并返回账户地址列表
// 一旦连接完成, 将会持久化连接数据， 用于下一次的自动连接
provider.request({ method: 'eth_requestAccounts' }).then((accounts) => {
  console.log(accounts)
})

后3天：
1. 允许切换区块链网络 
- EIP-3326: 新增 RPC 方法 wallet_switchEthereumChain, 用于切换网络
// 获取 chainId
provider.request({ method: 'eth_chainId' }).then((chainId) => {
  console.log(`chainId: ${chainId}`)
})

2. 允许添加区块链网络
- EIP-3085: 新增 RPC 方法 wallet_addEthereumChain， 用于添加网络
// 添加 Gnosis 网络
provider.request({
  method: 'wallet_addEthereumChain',
  params: [
    {
      chainId: '0x64',
      chainName: 'Gnosis',
      rpcUrls: ['https://rpc.ankr.com/gnosis'],
      iconUrls: [
        'https://xdaichain.com/fake/example/url/xdai.svg',
        'https://xdaichain.com/fake/example/url/xdai.png'
      ],
      nativeCurrency: {
        name: 'xDAI',
        symbol: 'xDAI',
        decimals: 18
      },
      blockExplorerUrls: ['https://blockscout.com/poa/xdai/']
    }
  ]
})

