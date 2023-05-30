export enum TokenType {
    FUZIO = 'factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO',
    SEI = 'usei',
    UST2 = 'factory/sei1jdppe6fnj2q7hjsepty5crxtrryzhuqsjrj95y/uust2',
}

export type TokenStatusType = {
    isNativeCoin: boolean;
    isIBCCoin: boolean;
    decimal: number;
    denom: string;
};
