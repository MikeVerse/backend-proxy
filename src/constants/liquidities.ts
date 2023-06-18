import { TLiquidity, TokenType } from '../types';

export const Liquidities: TLiquidity[] = [
    {
        tokenA: TokenType.ZIO,
        tokenB: TokenType.SEI,
        contractAddress:
            'sei1q9z68ysc8yf0k2tlwdkje3kyrud5esqattmkdjhy6w3fyceg9j2sy5fm2g',
        stakingAddress: [],
        isVerified: true,
    },
    {
        tokenA: TokenType.ZIO,
        tokenB: TokenType.UST2,
        contractAddress:
            'sei1kgdvajpjmagkcafl6l69p4rz5ayt8gyz7vwdcw48x8p8seapqvuq0q6zdp',
        stakingAddress: [],
        isVerified: true,
    },
    {
        tokenA: TokenType.ZIO,
        tokenB: TokenType.SEN,
        contractAddress:
            'sei1kljwpmgtkuw4dxk2e7kzqvspz2wtcsp3ug9x9cqfzpw3sxf3utrqlgenqw',
        stakingAddress: [
            'sei15sz9muf4a3tgs2pyhtc223rskg76p6zkuzf862dgcp8crugxekcqsk7aph',
        ],
        isVerified: true,
    },
    {
        tokenA: TokenType.ZIO,
        tokenB: TokenType.YESP,
        contractAddress:
            'sei102s092zagvkrrzvntzhsv5xcpdm2j46u8yws9nrzxqp87ywl7n6qqz06v9',
        stakingAddress: [],
        isVerified: true,
    },
    {
        tokenA: TokenType.ZIO,
        tokenB: TokenType.FABLE,
        contractAddress:
            'sei1f5c4j8ygkyfxch4kve0m40jsmhulp3w2vs7shv6ud8w3rwwwnf9q7c4pyz',
        stakingAddress: [],
        isVerified: false,
    },
];
