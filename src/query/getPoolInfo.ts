import { Decimal } from "decimal.js"
import { convertDenomToMicroDenom, convertMicroDenomToDenom } from "../utils/helpers"
import { BondingPeriod, BondingPeriodSummary, Pool, Token } from "../types"
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { contracts } from "@fuzio/contracts"

export const getPoolInfo = async (client: CosmWasmClient) => {
	const poolListResponse = await fetch(
		"https://raw.githubusercontent.com/fuzio-defi-network/fuzio-assetlist/main/poolList.json"
	)
	const poolListJson: any = await poolListResponse.json()
	const poolList: Array<Pool> = poolListJson["pools"].map((pool: Pool) => {
		return pool
	})

	const tokenListResponse = await fetch(
		"https://raw.githubusercontent.com/fuzio-defi-network/fuzio-assetlist/main/tokenList.json"
	)
	const tokenListJson: any = await tokenListResponse.json()
	const tokenList = tokenListJson["tokens"].map((token: Token) => {
		return token
	})

	const {
		FuzioPool: { FuzioPoolQueryClient },
		FuzioStaking: { FuzioStakingQueryClient }
	} = contracts

	const poolQueries = poolList.map((pool) => {
		const poolQueryClient = new FuzioPoolQueryClient(client, pool.swapAddress)
		return poolQueryClient.info()
	})

	const poolInfos = await Promise.all(poolQueries)

	const fuzioPrice = new Decimal(poolInfos[2].token2_reserve).dividedBy(
		new Decimal(poolInfos[2].token1_reserve)
	)

	const poolsWithData: Array<Pool> = []

	for await (const [index, poolInfo] of poolInfos.entries()) {
		const token1: Token = tokenList.find((token: Token) => {
			if (Object.keys(poolInfo.token1_denom)[0] === "cw20") {
				if (Object.values(poolInfo.token1_denom)[0] === token.contractAddress) {
					return token
				}
			} else {
				if (Object.values(poolInfo.token1_denom)[0] === token.denom) {
					return token
				}
			}
		})

		const token2: Token = tokenList.find((token: Token) => {
			if (Object.keys(poolInfo.token2_denom)[0] === "cw20") {
				if (Object.values(poolInfo.token2_denom)[0] === token.contractAddress) {
					return token.decimal
				}
			} else {
				if (Object.values(poolInfo.token2_denom)[0] === token.denom) {
					return token.decimal
				}
			}
		})

		const token2ReserveDenom = new Decimal(poolInfo.token2_reserve).dividedBy(
			convertDenomToMicroDenom(10, token2.decimal)
		)

		const token1ReserveDenom = new Decimal(poolInfo.token1_reserve).dividedBy(
			convertDenomToMicroDenom(10, token1.decimal)
		)

		console.log(index + 1, token2ReserveDenom.dividedBy(token1ReserveDenom).toFixed(24))

		const decimalDiff = token2.decimal - token1.decimal

		const token1Price =
			token1.denom === "factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO"
				? fuzioPrice
				: new Decimal(
						new Decimal(poolInfo.token1_reserve).dividedBy(
							new Decimal(poolInfo.token2_reserve)
						)
				  ).times(fuzioPrice)

		const token2Price = convertDenomToMicroDenom(
			new Decimal(
				new Decimal(poolInfo.token1_reserve).dividedBy(new Decimal(poolInfo.token2_reserve))
			).times(token1Price),
			decimalDiff
		)

		for await (const bondingPeriod of poolList[index].bondingPeriods) {
			const bondingPeriodString = bondingPeriod as unknown as string
			const stakingQueryClient = new FuzioStakingQueryClient(client, bondingPeriodString)
			const lpQueryClient = new FuzioPoolQueryClient(client, poolInfo.lp_token_address)

			const totalStakedBalance = await lpQueryClient.balance({
				address: bondingPeriodString
			})

			console.log(totalStakedBalance)

			// const config = await stakingQueryClient.config()

			// let bondingPeriodOld: BondingPeriod = {
			// 	apr: 0,
			// 	distributionStart: 0,
			// 	rewardToken: { native: "" },
			// 	lockDuration: config.lock_duration,
			// 	distributionEnd: 0
			// }

			// const bondingPeriod = config.distribution_schedule.map((distributions, index) => {
			// 	for (const [_index, distribution] of distributions.entries()) {
			// 		if (bondingPeriodOld.distributionStart === 0) {
			// 			// @ts-ignore
			// 			let totalTokenReward = Number(distribution.amount as string)
			// 			totalTokenReward = isNaN(totalTokenReward) ? 0 : totalTokenReward

			// 			// console.log(totalTokenReward)
			// 			// console.log(config.reward_token[_index])

			// 			bondingPeriodOld = {
			// 				apr: 0,
			// 				rewardToken: config.reward_token[index],
			// 				// @ts-ignore
			// 				distributionStart: distribution.start_time,
			// 				// @ts-ignore
			// 				distributionEnd: distribution.end_time,
			// 				lockDuration: config.lock_duration
			// 			}
			// 		} else {
			// 			// @ts-ignore
			// 			let totalTokenReward = Number(distribution.amount as string)
			// 			totalTokenReward = isNaN(totalTokenReward) ? 0 : totalTokenReward

			// 			// console.log(totalTokenReward)
			// 			// console.log(config.reward_token[_index])

			// 			// const tokenReserve =
			// 			// 	poolInfo[index][
			// 			// 		config.rewardToken === TokenType.ZIO
			// 			// 			? "token1Reserve"
			// 			// 			: "token2Reserve"
			// 			// 	]

			// 			const totalLPBalance = Number(poolInfo.token1_reserve) * 1e6

			// 			bondingPeriodOld = { ...bondingPeriodOld }
			// 		}
			// 	}

			// 	return bondingPeriodOld
			// })

			// const test2: BondingPeriodSummary = { aprArray: [], bondingPeriods: bondingPeriod }
		}

		const poolWithData: Pool = {
			lpTokens: convertMicroDenomToDenom(poolInfo.lp_token_supply, 6),
			liquidity: {
				token1: {
					amount: new Decimal(poolInfo.token1_reserve),
					tokenPrice: token1Price,
					denom: token1.denom
				},
				token2: {
					amount: new Decimal(poolInfo.token2_reserve),
					tokenPrice: token2Price,
					denom: token2.denom
				},
				usd: 0
			},
			lpTokenAddress: poolInfo.lp_token_address,
			swapAddress: poolList[index].swapAddress,
			isVerified: poolList[index].isVerified,
			poolId: index + 1,
			ratio: token2ReserveDenom.dividedBy(token1ReserveDenom),
			bondingPeriods: poolList[index].bondingPeriods
		}

		poolsWithData.push(poolWithData)
	}

	return { pools: poolsWithData }
}
