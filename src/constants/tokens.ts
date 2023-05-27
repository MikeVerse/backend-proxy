import { TokenStatusType, TokenType } from '../types';

export const TokenStatus: { [key in TokenType]: TokenStatusType } = {
    [TokenType.FUZIO]: {
        isNativeCoin: true,
        isIBCCoin: false,
        decimal: 6,
        denom: 'factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO',
    },
    [TokenType.SEI]: {
        isNativeCoin: true,
        isIBCCoin: false,
        decimal: 6,
        denom: 'usei',
    },
    [TokenType.UST2]: {
        isNativeCoin: true,
        isIBCCoin: false,
        decimal: 6,
        denom: 'factory/sei1jdppe6fnj2q7hjsepty5crxtrryzhuqsjrj95y/uust2',
    },
};
