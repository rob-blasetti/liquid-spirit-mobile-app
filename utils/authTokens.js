import { parseJwt } from './parseJwt';

export const resolveAccessToken = payload =>
  payload?.accessToken || payload?.token || payload?.newAccessToken || payload?.data?.accessToken || payload?.data?.token || payload?.data?.newAccessToken || null;

export const resolveRefreshToken = payload =>
  payload?.newRefreshToken || payload?.refreshToken || payload?.data?.newRefreshToken || payload?.data?.refreshToken || null;

export const isJwtExpired = token => {
  try {
    const { exp } = parseJwt(token);
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};
