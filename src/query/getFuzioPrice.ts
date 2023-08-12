import { type Pool } from "../types"
import { poolListUrl } from "./urls"
import { type CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { contracts } from "@fuzio/contracts"
import { BigNumber } from "bignumber.js"

export const getFuzioPrice = async (client: CosmWasmClient) => {
	try {
		const poolListResponse = await fetch(poolListUrl)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const poolListJson: any = await poolListResponse.json()
		const poolList: Pool[] = poolListJson.pools.map((pool: Pool) => {
			return pool
		})

		const {
			FuzioPool: { FuzioPoolQueryClient }
		} = contracts

		if (poolList.length === 0) {
			return BigNumber(0)
		}

		const poolQueryClient = new FuzioPoolQueryClient(
			client,
			poolList[1].swapAddress
		)
		const poolInfo = await poolQueryClient.info()

		const fuzioPrice = BigNumber(poolInfo.token2_reserve).dividedBy(
			BigNumber(poolInfo.token1_reserve)
		)

		return fuzioPrice
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("An error occurred:", error)
		throw error
	}
}
