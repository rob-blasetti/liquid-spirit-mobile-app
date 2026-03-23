export const debugLog = (...args) => {
  if (__DEV__ && process.env.NODE_ENV !== 'test') {
    console.log(...args);
  }
};

export default debugLog;
