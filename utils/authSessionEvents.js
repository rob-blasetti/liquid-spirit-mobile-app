let authExpiredHandler = null;
let authExpiredInFlight = null;

export const setAuthExpiredHandler = handler => {
  authExpiredHandler = typeof handler === 'function' ? handler : null;
};

export const notifyAuthExpired = error => {
  if (!authExpiredHandler) return;
  if (authExpiredInFlight) return;

  authExpiredInFlight = Promise.resolve()
    .then(() => authExpiredHandler(error))
    .catch(err => {
      console.warn('Auth expiry handler failed:', err);
    })
    .finally(() => {
      authExpiredInFlight = null;
    });
};
