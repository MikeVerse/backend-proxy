import { type Denom } from "@fuzio/contracts/types/FuzioStaking.types"
import { type BigNumber } from "bignumber.js"

export type ServerOptions = {
	dev?: boolean
	port?: number
	prefix?: string
}

export type Token = {
	chain: Chain
	contractAddress?: string
	decimal: number
	denom: string
	fullName: string
	isIBCCoin: boolean
	isNativeCoin: boolean
	logoURI: string
	symbol: string
}

export type Chain = {
	chainId: string
	chainName: string
	evmChainId?: number
	gasPrice: {
		amount: string
		denom: string
	}
	ibcChannels?: {
		deposit_channel: string
		withdraw_channel: string
	}
	isEVM: boolean
}

export type Reward = {
	apr: number
	rewardToken: Denom
}

export type BondingPeriod = {
	address: string
	distributionEnd: number
	distributionStart: number
	lockDuration: number
	rewards: Reward[]
}

export type BondingPeriodSummary = {
	aprArray: number[]
	bondingPeriods: BondingPeriod[]
}

export type LiquidityToken = {
	amount: BigNumber
	denom: string
	tokenPrice: BigNumber
}

export type Liquidity = {
	token1: LiquidityToken
	token2: LiquidityToken
	usd: BigNumber
}

export type Pool = {
	bondingPeriods: BondingPeriod[]
	highestApr: { highestAprToken: Denom | undefined; highestAprValue: number }
	isVerified: boolean
	liquidity: Liquidity
	lpTokenAddress: string
	lpTokens: BigNumber
	poolId: number
	ratio: BigNumber
	swapAddress: string
}
