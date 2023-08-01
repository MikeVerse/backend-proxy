import { BigNumber } from "bignumber.js"
import { convertDenomToMicroDenom, convertMicroDenomToDenom } from "../utils/helpers"
import { BondingPeriod, Pool, Token } from "../types"
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { contracts } from "@fuzio/contracts"
import { Denom } from "@fuzio/contracts/types/FuzioStaking.types"
import { getFuzioPrice } from "./getFuzioPrice"

export const getPoolById = async (client: CosmWasmClient, poolId: number) => {
	try {
		const poolListResponse = await fetch(
			"https://raw.githubusercontent.com/Fuzio-DeFi-Network/fuzio-assetlist/main/poolList.json"
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

		const poolQueryClient = new FuzioPoolQueryClient(client, poolList[poolId].swapAddress)
		const poolInfo = await poolQueryClient.info()

		const fuzioPrice = await getFuzioPrice(client)

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

		const token2ReserveDenom = BigNumber(poolInfo.token2_reserve).dividedBy(
			convertDenomToMicroDenom(10, token2.decimal)
		)

		const token1ReserveDenom = BigNumber(poolInfo.token1_reserve).dividedBy(
			convertDenomToMicroDenom(10, token1.decimal)
		)

		const decimalDiff = token2.decimal - token1.decimal

		const token1Price =
			token1.denom === "factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO"
				? fuzioPrice
				: BigNumber(
						BigNumber(poolInfo.token1_reserve).dividedBy(BigNumber(poolInfo.token2_reserve))
				  ).times(fuzioPrice)

		const token2Price = convertDenomToMicroDenom(
			BigNumber(
				BigNumber(poolInfo.token1_reserve).dividedBy(BigNumber(poolInfo.token2_reserve))
			).times(token1Price),
			decimalDiff
		)

		const bondingPeriods: Array<BondingPeriod> = []
		const lpQueryClient = new FuzioPoolQueryClient(client, poolInfo.lp_token_address)

		let highestApr: { highestAprValue: number; highestAprToken: Denom | undefined } = {
			highestAprValue: 0,
			highestAprToken: undefined
		}

		for await (const bondingPeriod of poolList[poolId].bondingPeriods) {
			const stakingQueryClient = new FuzioStakingQueryClient(client, bondingPeriod.address)
			const config = await stakingQueryClient.config()
			const totalStakedBalance = await lpQueryClient.balance({
				address: bondingPeriod.address
			})

			let bondingPeriodToReturn: BondingPeriod = {
				address: bondingPeriod.address,
				distributionStart: 0,
				rewards: [], // { apr: 0, rewardToken: { native: "" } }
				lockDuration: config.lock_duration,
				distributionEnd: 0
			}

			highestApr = { highestAprValue: 0, highestAprToken: undefined }

			for (const [_index, schedule] of config.distribution_schedule.entries()) {
				let totalTokenReward = Number(schedule.amount)
				totalTokenReward = isNaN(totalTokenReward) ? 0 : totalTokenReward

				const tokenReserve = poolInfo["token1_reserve"]

				const totalLPBalance = Number(poolInfo.lp_token_supply) * 1e6

				const apr = Number(totalStakedBalance.balance)
					? (100 * totalTokenReward) /
					  ((2 * Number(tokenReserve) * Number(totalStakedBalance.balance)) / totalLPBalance)
					: 0

				if (apr > highestApr.highestAprValue) {
					highestApr.highestAprValue = apr
					highestApr.highestAprToken = config.reward_token[_index]
				}

				bondingPeriodToReturn.rewards.push({ apr, rewardToken: config.reward_token[_index] })

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
			highestApr,
			lpTokens: convertMicroDenomToDenom(poolInfo.lp_token_supply, 6),
			liquidity: {
				token1: {
					amount: BigNumber(poolInfo.token1_reserve),
					tokenPrice: token1Price,
					denom: token1.denom
				},
				token2: {
					amount: BigNumber(poolInfo.token2_reserve),
					tokenPrice: token2Price,
					denom: token2.denom
				},
				usd: convertMicroDenomToDenom(poolInfo.token1_reserve, 6)
					.times(token1Price)
					.plus(convertMicroDenomToDenom(poolInfo.token2_reserve, 6).times(token2Price))
			},
			lpTokenAddress: poolInfo.lp_token_address,
			swapAddress: poolList[poolId].swapAddress,
			isVerified: poolList[poolId].isVerified,
			poolId,
			ratio: token2ReserveDenom.dividedBy(token1ReserveDenom),
			bondingPeriods
		}

		return poolWithData
	} catch (error) {
		console.error("An error occurred:", error)
		throw error
	}
}
