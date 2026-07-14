import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

// Mirrors the access token payload signed in auth.js:
// jwt.sign({ userId: user.id, email: user.email }, ...)
type AccessTokenPayload = {
  userId: string | number;
  email: string;
};

// Decodes (does NOT verify — that's the server's job on every request) the
// current access token to read the userId. Used purely to scope
// client-side local storage (e.g. per-account bot cards) to the right
// account so data can't leak between accounts sharing a device.
export const getCurrentUserId = async (): Promise<string | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<AccessTokenPayload>(token);
    return decoded.userId != null ? String(decoded.userId) : null;
  } catch {
    return null;
  }
};