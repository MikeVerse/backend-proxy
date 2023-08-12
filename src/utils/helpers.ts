import { BigNumber } from "bignumber.js"

export function convertMicroDenomToDenom(
	value: number | string | BigNumber,
	decimals: number
): BigNumber {
	if (decimals === 0) return BigNumber(value)
	const bnValue = BigNumber(value)
	return bnValue.dividedBy(BigNumber(10).pow(decimals))
}

export function convertDenomToMicroDenom(
	value: number | string | BigNumber,
	decimals: number
): BigNumber {
	if (decimals === 0) return BigNumber(value)
	const bnValue = BigNumber(value)
	return bnValue.multipliedBy(BigNumber(10).pow(decimals))
}
