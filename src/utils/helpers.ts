import { Decimal } from "decimal.js"

export function convertMicroDenomToDenom(
	value: number | string | Decimal,
	decimals: number
): Decimal {
	if (decimals === 0) return new Decimal(value)

	return new Decimal(Number(value) / Math.pow(10, decimals))
}

export function convertDenomToMicroDenom(
	value: number | string | Decimal,
	decimals: number
): Decimal {
	if (decimals === 0) return new Decimal(value)

	return new Decimal(String(Number(value) * Math.pow(10, decimals)))
}
