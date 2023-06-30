import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"

export const queryRPC = async (
	client: CosmWasmClient,
	contractAddress: string,
	message: Record<string, any>
) => {
	try {
		const result = await client.queryContractSmart(contractAddress, message)
		return result
	} catch {
		return null
	}
}
