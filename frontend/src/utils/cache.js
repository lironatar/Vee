
// Simple Global Cache to make navigation feel instant (stale-while-revalidate pattern)
const cache = {
    data: {},
    set(key, value) {
        this.data[key] = {
            value,
            timestamp: Date.now()
        };
    },
    get(key) {
        const item = this.data[key];
        return item ? item.value : null;
    }
};

export default cache;
