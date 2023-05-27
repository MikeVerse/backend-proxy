export enum TokenType {
    FUZIO = 'factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO',
    SEI = 'usei',
    UST2 = 'sei1kgdvajpjmagkcafl6l69p4rz5ayt8gyz7vwdcw48x8p8seapqvuq0q6zdp',
}

export type TokenStatusType = {
    isNativeCoin: boolean;
    isIBCCoin: boolean;
    decimal: number;
    denom: string;
};
