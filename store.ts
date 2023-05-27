class Store {
    private data;
    constructor() {
        this.data = {};
    }
    setData = (data: Record<string, any>) => {
        this.data = {
            ...this.data,
            ...data,
        };
    };
    getData = () => this.data;
}

const store = new Store();

export default store;
