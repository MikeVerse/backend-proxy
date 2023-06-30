import { Elysia } from "elysia"
// import cron from "./utils/cron"
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { swagger } from "@elysiajs/swagger"
import { getPoolInfo } from "./query/getPoolInfo"
import { cors } from "@elysiajs/cors"

const client = await CosmWasmClient.connect("https://sei.kingnodes.com")

const app = new Elysia()
	.use(
		cors({
			origin: true
		})
	)
	.get(
		"/",
		() => `
                                  _____________
                           __,---'::.-  -::_ _ '-----.___      ______
                       _,-'::_  ::-  -  -. _   ::-::_   .'--,'   :: .:'-._
                    -'_ ::   _  ::_ .:   :: - _ .:   ::- _/ ::   ,-. ::. '-._
                _,-'   ::-  ::        ::-  _ ::  -  ::     |  .: ((|))      ::'
        ___,---'   ::    ::    ;::   ::     :.- _ ::._  :: | :    '_____::..--'
    ,-""  ::  ::.   ,------.  (.  ::  |  ::  ::  ,-- :. _  :'. ::  |       '-._
   '     ::   '   _._.:_  :.)___,-------------._ :: ____'-._ '._ ::'--...___; ;
 ;:::. ,--'--"""""      /  /                     |. |     ''-----''''---------'
;  '::;              _ /.:/_,                    _|.:|_,
|    ;             ='-//||--"                  ='-//||--"
'   .|               ''  ''                     ''  ''
 |::'|
  |   |    🦎🦎🦎 Welcome to the Fuzio Dex API! Head to /swagger for a better UI! 🦎🦎🦎
   '..:'.
     '.  '--.____
       '-:______ '-._
                '---'
`
	)
	.get("/pool-info", async () => await getPoolInfo(client))
	.use(
		swagger({
			documentation: {
				info: {
					title: "Fuzio DEX Backend",
					version: "1.0.0",
					description: "API Routes for the Fuzio DEX",
					contact: { name: "Telegram", url: "https://fuzio.network/social/telegram" }
				}
			}
		})
	)
	.listen(3000)

console.log(`🦎 Fuzio Dex Backend started at ${app.server?.hostname}:${app.server?.port}`)
console.log(`
                                  _____________
                           __,---'::.-  -::_ _ '-----.___      ______
                       _,-'::_  ::-  -  -. _   ::-::_   .'--,'   :: .:'-._
                    -'_ ::   _  ::_ .:   :: - _ .:   ::- _/ ::   ,-. ::. '-._
                _,-'   ::-  ::        ::-  _ ::  -  ::     |  .: ((|))      ::'
        ___,---'   ::    ::    ;::   ::     :.- _ ::._  :: | :    '_____::..--'
    ,-""  ::  ::.   ,------.  (.  ::  |  ::  ::  ,-- :. _  :'. ::  |       '-._
   '     ::   '   _._.:_  :.)___,-------------._ :: ____'-._ '._ ::'--...___; ;
 ;:::. ,--'--"""""      /  /                     |. |     ''-----''''---------'
;  '::;              _ /.:/_,                    _|.:|_,
|    ;             ='-//||--"                  ='-//||--"
'   .|               ''  ''                     ''  ''
 |::'|
  |   |
   '..:'.
     '.  '--.____
       '-:______ '-._
                '---'
`)
