export enum TokenType {
    ZIO = 'factory/sei1nsfrq4m5rnwtq5f0awkzr6u9wpsycctjlgzr9q/ZIO',
    SEI = 'usei',
    UST2 = 'factory/sei1jdppe6fnj2q7hjsepty5crxtrryzhuqsjrj95y/uust2',
    SEN = 'factory/sei1dreru8834gk69045rxha0rkfle5azrqdqr07md/SEN',
    YESP = 'factory/sei1s6dnc4zxcan6ag7ms72znv8vcpxlzg80fudptg/YESP',
    FABLE = 'factory/sei1rrhh4syyqsl4gtml0t55mcmt34x98gne23fgk3hsas0pjfw2mhyqhz5rxq/FABLE',
}

export type TokenStatusType = {
    isNativeCoin: boolean;
    isIBCCoin: boolean;
    decimal: number;
    denom: string;
};
