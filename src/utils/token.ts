import { TokenType } from '../types';
import { TokenStatus } from '../constants';

export const getTokenByDenom = (denom: string): TokenType =>
    (Object.keys(TokenStatus) as Array<keyof typeof TokenStatus>).find(
        (token) => TokenStatus[token].denom === denom,
    );
