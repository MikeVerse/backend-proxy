export const poolListUrl = `https://raw.githubusercontent.com/Fuzio-DeFi-Network/fuzio-assetlist/main/${
	process.env.SEI_NETWORK === "MAINNET" ? "mainnet/" : "testnet/"
}poolList.json`

export const tokenListUrl = `https://raw.githubusercontent.com/Fuzio-DeFi-Network/fuzio-assetlist/main/${
	process.env.SEI_NETWORK === "MAINNET" ? "mainnet/" : "testnet/"
}tokenList.json`
