/* eslint-disable @typescript-eslint/no-explicit-any */
import { type BondingPeriod, type Pool, type Token } from "../types"
import {
	convertDenomToMicroDenom,
	convertMicroDenomToDenom
} from "../utils/helpers"
import { poolListUrl, tokenListUrl } from "../utils/urls"
import { getFuzioPrice } from "./getFuzioPrice"
import { type CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { contracts } from "@fuzio/contracts"
import { type Denom } from "@fuzio/contracts/types/FuzioStaking.types"
import { BigNumber } from "bignumber.js"

export const getPoolList = async (client: CosmWasmClient) => {
	try {
		const poolListResponse = await fetch(poolListUrl)
		const poolListJson: any = await poolListResponse.json()
		const poolList: Pool[] = poolListJson.pools.map((pool: Pool) => {
			return pool
		})

		const tokenListResponse = await fetch(tokenListUrl)
		const tokenListJson: any = await tokenListResponse.json()
		const tokenList = tokenListJson.tokens.map((token: Token) => {
			return token
		})

		const {
			FuzioPool: { FuzioPoolQueryClient },
			FuzioStaking: { FuzioStakingQueryClient }
		} = contracts

		const poolQueries = poolList.map(async (pool) => {
			const poolQueryClient = new FuzioPoolQueryClient(client, pool.swapAddress)
			return await poolQueryClient.info()
		})

		const poolInfos = await Promise.all(poolQueries)

		const fuzioPrice = await getFuzioPrice(client)

		const poolsWithData: Pool[] = []

		if (poolList.length === 0) {
			return {
				highestAprPool: 0,
				highestLiquidity: 0,
				pools: poolsWithData
			}
		}

		for await (const [index, poolInfo] of poolInfos.entries()) {
			// eslint-disable-next-line array-callback-return, consistent-return
			const token1: Token = tokenList.find((token: Token) => {
				if (Object.keys(poolInfo.token1_denom)[0] === "cw20") {
					if (
						Object.values(poolInfo.token1_denom)[0] === token.contractAddress
					) {
						return token
					}
				} else if (Object.values(poolInfo.token1_denom)[0] === token.denom) {
					return token
				}
			})

			// eslint-disable-next-line array-callback-return, consistent-return
			const token2: Token = tokenList.find((token: Token) => {
				if (Object.keys(poolInfo.token2_denom)[0] === "cw20") {
					if (
						Object.values(poolInfo.token2_denom)[0] === token.contractAddress
					) {
						return token.decimal
					}
				} else if (Object.values(poolInfo.token2_denom)[0] === token.denom) {
					return token.decimal
				}
			})

			const tokenOneReserveDenom = BigNumber(poolInfo.token1_reserve).dividedBy(
				convertDenomToMicroDenom(10, token1.decimal)
			)

			const tokenTwoReserveDenom = BigNumber(poolInfo.token2_reserve).dividedBy(
				convertDenomToMicroDenom(10, token2.decimal)
			)

			const decimalDiff = token2.decimal - token1.decimal

			const tokenOnePrice =
				token1.denom ===
				"factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO"
					? fuzioPrice
					: BigNumber(
							BigNumber(poolInfo.token1_reserve).dividedBy(
								BigNumber(poolInfo.token2_reserve)
							)
					  ).times(fuzioPrice)

			const tokenTwoPrice = convertDenomToMicroDenom(
				BigNumber(
					BigNumber(poolInfo.token1_reserve).dividedBy(
						BigNumber(poolInfo.token2_reserve)
					)
				).times(tokenOnePrice),
				decimalDiff
			)

			const bondingPeriods: BondingPeriod[] = []
			const lpQueryClient = new FuzioPoolQueryClient(
				client,
				poolInfo.lp_token_address
			)

			let temporaryHighestApr: {
				highestAprToken: Denom | undefined
				highestAprValue: number
			} = {
				highestAprToken: undefined,
				highestAprValue: 0
			}

			for await (const bondingPeriod of poolList[index].bondingPeriods) {
				const stakingQueryClient = new FuzioStakingQueryClient(
					client,
					bondingPeriod.address
				)
				const config = await stakingQueryClient.config()
				const totalStakedBalance = await lpQueryClient.balance({
					address: bondingPeriod.address
				})

				const bondingPeriodToReturn: BondingPeriod = {
					address: bondingPeriod.address,
					distributionEnd: 0,

					distributionStart: 0,
					// { apr: 0, rewardToken: { native: "" } }
					lockDuration: config.lock_duration,
					rewards: []
				}

				temporaryHighestApr = { highestAprToken: undefined, highestAprValue: 0 }

				for (const [
					localIndex,
					schedule
				] of config.distribution_schedule.entries()) {
					let totalTokenReward = Number(schedule.amount)
					totalTokenReward = Number.isNaN(totalTokenReward)
						? 0
						: totalTokenReward

					const tokenReserve = poolInfo.token1_reserve

					const totalLPBalance = Number(poolInfo.lp_token_supply) * 1e6

					const apr = Number(totalStakedBalance.balance)
						? (100 * totalTokenReward) /
						  ((2 * Number(tokenReserve) * Number(totalStakedBalance.balance)) /
								totalLPBalance)
						: 0

					if (apr > temporaryHighestApr.highestAprValue) {
						temporaryHighestApr.highestAprValue = apr
						temporaryHighestApr.highestAprToken =
							config.reward_token[localIndex]
					}

					bondingPeriodToReturn.rewards.push({
						apr,
						rewardToken: config.reward_token[localIndex]
					})

					if (
						schedule.start_time < bondingPeriodToReturn.distributionStart ||
						bondingPeriodToReturn.distributionStart === 0
					) {
						bondingPeriodToReturn.distributionStart = schedule.start_time
					}

					if (schedule.end_time > bondingPeriodToReturn.distributionEnd) {
						bondingPeriodToReturn.distributionEnd = schedule.end_time
					}
				}

				bondingPeriods.push(bondingPeriodToReturn)
			}

			const poolWithData: Pool = {
				bondingPeriods,
				highestApr: temporaryHighestApr,
				isVerified: poolList[index].isVerified,
				liquidity: {
					token1: {
						amount: BigNumber(poolInfo.token1_reserve),
						denom: token1.denom,
						tokenPrice: tokenOnePrice
					},
					token2: {
						amount: BigNumber(poolInfo.token2_reserve),
						denom: token2.denom,
						tokenPrice: tokenTwoPrice
					},
					usd: convertMicroDenomToDenom(poolInfo.token1_reserve, 6)
						.times(tokenOnePrice)
						.plus(
							convertMicroDenomToDenom(poolInfo.token2_reserve, 6).times(
								tokenTwoPrice
							)
						)
				},
				lpTokenAddress: poolInfo.lp_token_address,
				lpTokens: convertMicroDenomToDenom(poolInfo.lp_token_supply, 6),
				poolId: index + 1,
				ratio: tokenTwoReserveDenom.dividedBy(tokenOneReserveDenom),
				swapAddress: poolList[index].swapAddress
			}

			poolsWithData.push(poolWithData)
		}

		let highestAprPoolId = 0
		let highestApr = BigNumber(0)
		let highestLiquidityPoolId = 0
		let highestLiquidity = BigNumber(0)
		for (const pool of poolsWithData) {
			if (pool.liquidity.usd.gt(highestLiquidity)) {
				highestLiquidityPoolId = pool.poolId
				highestLiquidity = pool.liquidity.usd
			}

			if (highestApr.lt(pool.highestApr.highestAprValue)) {
				highestApr = BigNumber(pool.highestApr.highestAprValue)
				highestAprPoolId = pool.poolId
			}
		}

		return {
			highestAprPool: highestAprPoolId,
			highestLiquidity: highestLiquidityPoolId,
			pools: poolsWithData
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("An error occurred:", error)
		throw error
	}
}
