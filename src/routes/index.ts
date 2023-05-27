import { Request, Response, Router } from 'express';
import { catchAsync, convertToBigInt, pick } from '../utils';
import * as constants from '../constants';
import store from '../../store';

const formatMemoryUsage = (data) =>
    `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;

const routes = Router();

routes.get(
    '/cache',
    catchAsync((req: Request, res: Response) => {
        const query = req.query?.fields || '';
        const fields = query ? String(query).split(',') : [];
        console.log('fileds: ', fields);
        res.status(200).json(
            fields.length ? pick(store.getData(), fields) : store.getData(),
        );
    }),
);

routes.get(
    '/memory-usage',
    catchAsync((_req: Request, res: Response) => {
        const memoryData = process.memoryUsage();

        const memoryUsage = {
            rss: `${formatMemoryUsage(
                memoryData.rss,
            )} -> Resident Set Size - total memory allocated for the process execution`,
            heapTotal: `${formatMemoryUsage(
                memoryData.heapTotal,
            )} -> total size of the allocated heap`,
            heapUsed: `${formatMemoryUsage(
                memoryData.heapUsed,
            )} -> actual memory used during the execution`,
            external: `${formatMemoryUsage(
                memoryData.external,
            )} -> V8 external memory`,
        };
        res.status(200).json(memoryUsage);
    }),
);

routes.get(
    '/pool-info',
    catchAsync((_req: Request, res: Response) => {
        const { liquiditiesInfo } = pick(store.getData(), ['liquiditiesInfo']);
        const hopersPrice =
            liquiditiesInfo[1].token2Reserve / liquiditiesInfo[1].token1Reserve;
        // const bluePrice =
        //     (liquiditiesInfo[10].token1Reserve /
        //         liquiditiesInfo[10].token2Reserve) *
        //     hopersPrice;
        const pools = liquiditiesInfo.map((_liquidity) => {
            let bondingPeriods = [];
            if (_liquidity.stakingAddress) {
                if (typeof _liquidity.stakingAddress == 'string') {
                    bondingPeriods.push({
                        apr: Number(_liquidity.apr.replace('%', '')),
                        stakingAddress: _liquidity.stakingAddress,
                        rewardToken: _liquidity.config.rewardToken,
                        lockDuration: _liquidity.config.lockDuration,
                        distributionEnd: _liquidity.config.distributionEnd,
                    });
                } else {
                    _liquidity.stakingAddress.forEach(
                        (_stakingAddress, index) => {
                            bondingPeriods.push({
                                apr: Number(
                                    _liquidity.apr[index].replace('%', ''),
                                ),
                                stakingAddress:
                                    _liquidity.stakingAddress[index],
                                rewardToken:
                                    _liquidity.config[index].rewardToken,
                                lockDuration:
                                    _liquidity.config[index].lockDuration,
                                distributionEnd:
                                    _liquidity.config[index].distributionEnd,
                            });
                        },
                    );
                }
            }
            let poolId = _liquidity.id;
            let lpAddress = _liquidity.lpAddress;
            let ratio = _liquidity.ratio;
            const contractAddress = _liquidity.contract;
            const lpTokens = _liquidity.pool;
            const isVerified = _liquidity.isVerified;
            const token1Price = hopersPrice;
            const token1Decimal =
                constants.TokenStatus[_liquidity.token1].decimal || 6;
            const token2Decimal =
                constants.TokenStatus[_liquidity.token2].decimal || 6;
            const decimalDiff = token2Decimal - token1Decimal;
            const liquidity = {
                usd: (token1Price * _liquidity.token1Reserve * 2) / 1000000,
                token1: {
                    amount: convertToBigInt(
                        _liquidity.token1Reserve,
                        18 - token1Decimal,
                    ),
                    tokenPrice: convertToBigInt(
                        token1Price,
                        18 - token1Decimal,
                    ),
                    denom: _liquidity.token1,
                },
                token2: {
                    amount: convertToBigInt(
                        _liquidity.token2Reserve,
                        18 - token2Decimal,
                    ),
                    tokenPrice: convertToBigInt(
                        (_liquidity.token1Reserve / _liquidity.token2Reserve) *
                            token1Price *
                            Math.pow(10, decimalDiff),
                        18 - token2Decimal,
                    ),
                    denom: _liquidity.token2,
                },
            };
            return {
                bondingPeriods: bondingPeriods.reverse(),
                poolId,
                lpAddress,
                ratio,
                contractAddress,
                lpTokens,
                isVerified,
                liquidity,
            };
        });
        let highestAprPoolId = 0;
        let highestApr = 0;
        let highestLiquidityPoolId = 0;
        let highestLiquidity = 0;
        for (let i = 0; i < pools.length; i++) {
            if (pools[i].liquidity.usd > highestLiquidity) {
                highestLiquidityPoolId = pools[i].poolId;
                highestLiquidity = pools[i].liquidity.usd;
            }
            const { bondingPeriods } = pools[i];
            if (bondingPeriods.length == 0) continue;
            const apr = bondingPeriods.sort((a, b) => b - a)[0].apr;
            if (apr > highestApr) {
                highestApr = apr;
                highestAprPoolId = pools[i].poolId;
            }
        }
        res.status(200).json({
            pools,
            highestAprPool: highestAprPoolId,
            highestLiquidity: highestLiquidityPoolId,
        });
    }),
);

export { routes };
