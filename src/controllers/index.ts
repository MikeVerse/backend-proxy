import fetchLiquiditiesInfo from './liquidities_info';
import { INTERVAL } from '../../src/constants';

const chainCallingFunc = (
    func: () => Promise<any>,
    callbackFunc?: (data: any) => {},
    interval?: number,
) => {
    func().then((data) => {
        if (callbackFunc) callbackFunc(data);
        if (interval)
            setTimeout(() => {
                chainCallingFunc(func, callbackFunc, interval);
            }, interval);
    });
};

const main = (resultHandler) => {
    console.log('---------- start new fetching ----------');
    try {
        chainCallingFunc(fetchLiquiditiesInfo, resultHandler, INTERVAL);
    } catch (err) {
        console.log('main logic error', err);
    }
};

export default main;
