import store from './store';
import { app } from './src/config/express';
import main from './src/controllers';

const port = process.env.PORT || '5000';

const startServer = async () => {
    app.listen(port, () => {
        console.log(`Listening to port ${port}`);

        // setInterval(() => {
        //     extraLogic(store.setData);
        // }, PRICE_INTERVAL);
        main(store.setData);
        // setInterval(() => {
        //     main(store.setData);
        // }, INTERVAL);
    });
};

startServer();
