import { Elysia } from "elysia"
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { swagger } from "@elysiajs/swagger"
import { getPoolList } from "./query/getPoolList"
import { cors } from "@elysiajs/cors"
import { getPoolById } from "./query/getPoolById"
import { getFuzioPrice } from "./query/getFuzioPrice"

const client = await CosmWasmClient.connect("https://rpc-sei-testnet.rhinostake.com")

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
	.get("/poolList", async () => await getPoolList(client))
	.get("/fuzioPrice", async () => await getFuzioPrice(client))
	.get("/pool/:id", async ({ params: { id } }) => await getPoolById(client, Number(id)))
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
	.onError(({ code, error, set }) => {
		if (code === "NOT_FOUND") {
			set.status = 404

			return "Route Not Found :("
		}
		if (code === "VALIDATION") {
			return "Validation Error :("
		}
		if (code === "INTERNAL_SERVER_ERROR") {
			return "Internal Server Error :("
		}
		if (code === "PARSE") {
			return "Parsing Error :("
		}
		if (code === "UNKNOWN") {
			return "Unknown Error :("
		}
	})
	.listen(process.env.BUNPORT ?? 3000)

console.log(`🦎 Fuzio DEX Microservice started at ${app.server?.hostname}:${app.server?.port}`)
