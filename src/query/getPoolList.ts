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
	BigNumber.config({
		DECIMAL_PLACES: 18,
		EXPONENTIAL_AT: 18,
		ROUNDING_MODE: 1
	})

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

			const baseToken =
				process.env.SEI_NETWORK === "MAINNET"
					? "usei"
					: "factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO"

			const tokenOnePrice =
				token1.denom === baseToken
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

			const temporaryHighestApr: {
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

				for (const [
					localIndex,
					schedule
				] of config.distribution_schedule.entries()) {
					const totalTokenReward = BigNumber(schedule.amount)

					const tokenReserve = BigNumber(poolInfo.token1_reserve)
					const totalLPBalance = BigNumber(poolInfo.lp_token_supply)
					const totalStakeBalance = BigNumber(totalStakedBalance.balance)

					const value1 = totalTokenReward.multipliedBy(100)
					const value2 = BigNumber(
						2 * tokenReserve.toNumber() * totalStakeBalance.toNumber()
					)
					const value3 = value2.dividedBy(totalLPBalance)
					const value4 = value1.dividedBy(value3)

					const apr = totalStakeBalance.gt(0)
						? value4.decimalPlaces(2, 1)
						: BigNumber(0)

					if (apr.gt(temporaryHighestApr.highestAprValue)) {
						temporaryHighestApr.highestAprValue = apr.toNumber()
						temporaryHighestApr.highestAprToken =
							config.reward_token[localIndex]
					}

					bondingPeriodToReturn.rewards.push({
						apr: apr.toNumber(),
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
					usd: convertMicroDenomToDenom(
						tokenOnePrice.multipliedBy(poolInfo.token1_reserve),
						token1.decimal
					).plus(
						convertMicroDenomToDenom(
							tokenTwoPrice.multipliedBy(poolInfo.token2_reserve),
							token2.decimal
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
