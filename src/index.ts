import { getFuzioPrice } from "./query/getFuzioPrice"
import { getPoolById } from "./query/getPoolById"
import { getPoolList } from "./query/getPoolList"
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"
import { Elysia } from "elysia"

const client = await CosmWasmClient.connect({
	headers: {
		"x-apikey": process.env.SEIAPISKEY ?? ""
	},
	url:
		process.env.SEI_NETWORK === "MAINNET"
			? "https://rpc.sei-apis.com"
			: "https://rpc-testnet.sei-apis.com"
})

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
	.get(
		"/pool/:id",
		async ({ params: { id } }) => await getPoolById(client, Number(id))
	)
	.use(
		swagger({
			documentation: {
				info: {
					contact: {
						name: "Telegram",
						url: "https://fuzio.network/social/telegram"
					},
					description: "API Routes for the Fuzio DEX",
					title: "Fuzio DEX Backend",
					version: "1.0.0"
				}
			}
		})
	)
	.onError(({ code, set }) => {
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
		} else {
			return "Unknown Error :("
		}
	})
	.listen(process.env.BUNPORT ?? 3_000)

// eslint-disable-next-line no-console
console.log(
	`🦎 Fuzio DEX Microservice started at ${app.server?.hostname}:${app.server?.port}`
)
