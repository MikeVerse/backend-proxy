import { BigNumber } from "bignumber.js"

export function convertMicroDenomToDenom(
	value: number | string | BigNumber,
	decimals: number
): BigNumber {
	if (decimals === 0) return BigNumber(value)

	return BigNumber(Number(value) / Math.pow(10, decimals))
}

export function convertDenomToMicroDenom(
	value: number | string | BigNumber,
	decimals: number
): BigNumber {
	if (decimals === 0) return BigNumber(value)

	return BigNumber(String(Number(value) * Math.pow(10, decimals)))
}
