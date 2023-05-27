import {
    convertStringToNumber,
    getClient,
    getTokenByDenom,
    runQuery,
} from '../utils';
import { Liquidities, TokenStatus } from '../constants';
import { TokenType, TPool, TPoolConfig } from '../types';

const fetchLiquiditiesInfo = async () => {
    const client = await getClient();

    const fetchLiquiditiesInfoQueries = Liquidities.map((liquidity) =>
        runQuery(liquidity.contractAddress, { info: {} }, client),
    );
    let liquidities: TPool[] = [];
    await Promise.all(fetchLiquiditiesInfoQueries)
        .then(async (liquiditiesInfoResult) => {
            let fetchStakedLPBalanceQueries: any[] = [],
                fetchConfigQueries: any[] = [];
            let stakedLPBalances: any[] = [],
                configs: any[] = [];
            let stakingQueryIndices: number[] = [];
            liquidities = liquiditiesInfoResult.map((liquidityInfo, index) => {
                const pool =
                    convertStringToNumber(liquidityInfo.lp_token_supply) / 1e6;

                const token1Reserve = convertStringToNumber(
                    liquidityInfo.token1_reserve,
                );
                const token2Reserve = convertStringToNumber(
                    liquidityInfo.token2_reserve,
                );
                const lpAddress = liquidityInfo.lp_token_address || '';

                const stakingAddress = Liquidities[index].stakingAddress;
                if (stakingAddress) {
                    const stakingAddressArray =
                        typeof stakingAddress === 'string'
                            ? [stakingAddress]
                            : stakingAddress;
                    stakingAddressArray.forEach((address) => {
                        stakingQueryIndices.push(index);
                        fetchStakedLPBalanceQueries.push(
                            runQuery(
                                lpAddress,
                                {
                                    balance: { address: address },
                                },
                                client,
                            ),
                        );
                        fetchConfigQueries.push(
                            runQuery(address, { config: {} }, client),
                        );
                    });
                }

                const token1 = Liquidities[index].tokenA,
                    token2 = Liquidities[index].tokenB;

                const ratio = token1Reserve
                    ? token2Reserve /
                      Math.pow(10, TokenStatus[token2].decimal || 6) /
                      (token1Reserve /
                          Math.pow(10, TokenStatus[token1].decimal || 6))
                    : 0;

                return {
                    id: index + 1,
                    token1,
                    token2,
                    isVerified: Liquidities[index].isVerified,
                    apr: '',
                    pool,
                    contract: Liquidities[index].contractAddress,
                    lpAddress,
                    stakingAddress,
                    volume: 18000,
                    token1Reserve,
                    token2Reserve,
                    ratio,
                };
            });
            await Promise.all(fetchStakedLPBalanceQueries)
                .then(
                    (stakedLPBalanceResults) =>
                        (stakedLPBalances = stakedLPBalanceResults),
                )
                .catch(() => {
                    console.log('fetch lp balance error');
                });
            await Promise.all(fetchConfigQueries)
                .then((configResult) => (configs = configResult))
                .catch(() => {
                    console.log('fetch liquidity config error');
                });

            for (let index = 0; index < configs.length; index++) {
                const liquidityIndex = stakingQueryIndices[index];
                const hasSeveralStakingContract =
                    typeof Liquidities[liquidityIndex].stakingAddress !==
                    'string';
                let config = configs[index];
                const distributionEnd =
                    config?.distribution_schedule?.[0]?.[1] || 0;
                const rewardTokenContract = config?.reward_token_contract || '';
                const rewardTokenDenom = config?.reward_token?.native || '';
                const configObject = {
                    lockDuration: (config?.lock_duration || 0) * 1e3,
                    distributionEnd: distributionEnd * 1e3,
                    rewardToken:
                        getTokenByDenom(rewardTokenContract) ||
                        rewardTokenDenom,
                };
                liquidities[liquidityIndex].config = hasSeveralStakingContract
                    ? [
                          ...((liquidities[liquidityIndex].config ||
                              []) as TPoolConfig[]),
                          configObject,
                      ]
                    : configObject;

                let totalSupplyInPresale =
                    config?.distribution_schedule?.[0]?.[2] || 0;
                totalSupplyInPresale = Number(totalSupplyInPresale);
                totalSupplyInPresale = isNaN(totalSupplyInPresale)
                    ? 0
                    : totalSupplyInPresale;

                const tokenReserve =
                    liquidities[liquidityIndex][
                        configObject.rewardToken === TokenType.FUZIO
                            ? 'token1Reserve'
                            : 'token2Reserve'
                    ];
                const totalLPBalance = liquidities[liquidityIndex].pool * 1e6;
                let stakedLPBalance = Number(
                    stakedLPBalances[index]?.balance || 0,
                );
                stakedLPBalance = isNaN(stakedLPBalance) ? 0 : stakedLPBalance;

                if (tokenReserve && totalLPBalance) {
                    const apr = stakedLPBalance
                        ? (100 * totalSupplyInPresale) /
                          ((2 * tokenReserve * stakedLPBalance) /
                              totalLPBalance)
                        : 0;
                    const aprString = stakedLPBalance
                        ? `${apr.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                          })}%`
                        : '';
                    liquidities[liquidityIndex].apr = hasSeveralStakingContract
                        ? [
                              ...((liquidities[liquidityIndex].apr ||
                                  []) as string[]),
                              aprString,
                          ]
                        : aprString;
                }
            }
        })
        .catch((e) => {
            console.log('fetch liquidities info error: ', e);
        });
    return { liquiditiesInfo: liquidities };
};

export default fetchLiquiditiesInfo;
