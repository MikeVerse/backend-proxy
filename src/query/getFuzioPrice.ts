import { BigNumber } from "bignumber.js"
import { convertDenomToMicroDenom, convertMicroDenomToDenom } from "../utils/helpers"
import { Pool, Token } from "../types"
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { contracts } from "@fuzio/contracts"
import { poolListUrl } from "./urls"

export const getFuzioPrice = async (client: CosmWasmClient) => {
	try {
		const poolListResponse = await fetch(poolListUrl)
		const poolListJson: any = await poolListResponse.json()
		const poolList: Array<Pool> = poolListJson["pools"].map((pool: Pool) => {
			return pool
		})

		const {
			FuzioPool: { FuzioPoolQueryClient }
		} = contracts

		console.log(poolList)

		if (poolList.length === 0) {
			return BigNumber(0)
		}

		const poolQueryClient = new FuzioPoolQueryClient(client, poolList[1].swapAddress)
		const poolInfo = await poolQueryClient.info()

		const fuzioPrice = BigNumber(poolInfo.token2_reserve).dividedBy(
			BigNumber(poolInfo.token1_reserve)
		)

		return fuzioPrice
	} catch (error) {
		console.error("An error occurred:", error)
		throw error
	}
}
