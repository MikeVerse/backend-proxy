import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

export const getClient = async () => {
    const cosmwasmClient = await CosmWasmClient.connect(
        'https://sei-testnet-rpc.orbitalcommand.io/',
    );

    return cosmwasmClient;
};

export const runQuery = async (
    contractAddress: string,
    message: Record<string, any>,
    cosmwasmClient: CosmWasmClient,
) => {
    try {
        const result = await cosmwasmClient.queryContractSmart(
            contractAddress,
            message,
        );
        return result;
    } catch {
        // console.log('query error', contractAddress, message);
        return null;
    }
};
