import { Denom } from "@fuzio/contracts/types/FuzioStaking.types"
import { BigNumber } from "bignumber.js"

export type ServerOptions = {
	dev?: boolean
	port?: number
	prefix?: string
}

export type Token = {
	isNativeCoin: boolean
	isIBCCoin: boolean
	chain: Chain
	fullName: string
	decimal: number
	denom: string
	symbol: string
	logoURI: string
	contractAddress?: string
}

export type Chain = {
	chainName: string
	chainId: string
	gasPrice: {
		denom: string
		amount: string
	}
	isEVM: boolean
	ibcChannels?: {
		deposit_channel: string
		withdraw_channel: string
	}
	evmChainId?: number
}

export type Reward = {
	apr: number
	rewardToken: Denom
}

export type BondingPeriod = {
	address: string
	rewards: Array<Reward>
	lockDuration: number
	distributionEnd: number
	distributionStart: number
}

export type BondingPeriodSummary = {
	aprArray: number[]
	bondingPeriods: BondingPeriod[]
}

export type LiquidityToken = {
	amount: BigNumber
	tokenPrice: BigNumber
	denom: string
}

export type Liquidity = {
	usd: BigNumber
	token1: LiquidityToken
	token2: LiquidityToken
}

export type Pool = {
	highestApr: { highestAprValue: number; highestAprToken: Denom | undefined }
	bondingPeriods: Array<BondingPeriod>
	poolId: number
	swapAddress: string
	ratio: BigNumber
	lpTokenAddress: string
	lpTokens: BigNumber
	isVerified: boolean
	liquidity: Liquidity
}
