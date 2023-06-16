import { TokenStatusType, TokenType } from '../types';

export const TokenStatus: { [key in TokenType]: TokenStatusType } = {
    [TokenType.ZIO]: {
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
    [TokenType.SEN]: {
        isNativeCoin: true,
        isIBCCoin: false,
        decimal: 6,
        denom: 'factory/sei1dreru8834gk69045rxha0rkfle5azrqdqr07md/SEN',
    },
    [TokenType.YESP]: {
        isNativeCoin: true,
        isIBCCoin: false,
        decimal: 6,
        denom: 'factory/sei1s6dnc4zxcan6ag7ms72znv8vcpxlzg80fudptg/YESP',
    },
    [TokenType.FABLE]: {
        isNativeCoin: true,
        isIBCCoin: false,
        decimal: 6,
        denom: 'factory/sei1rrhh4syyqsl4gtml0t55mcmt34x98gne23fgk3hsas0pjfw2mhyqhz5rxq/FABLE',
    },
};
