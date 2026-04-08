const logger = {
    log: (type: string, message: any) => {
        if (__DEV__) {
            console.log(`[${type}]`, message);
        }
    }
};

export default logger;
