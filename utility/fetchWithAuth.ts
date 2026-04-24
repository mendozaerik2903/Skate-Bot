import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveTokens,
} from "./auth";
import { API_URL } from "./config";

export const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const accessToken = await getAccessToken();

  // attach the access token to the request
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  // if not a 401, return the response as normal
  if (response.status !== 401) {
    return response;
  }

  // access token expired — try to refresh
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearTokens();
    throw new Error("No refresh token, please sign in again");
  }

  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) {
    // refresh token expired or revoked, force sign out
    await clearTokens();
    throw new Error("Session expired, please sign in again");
  }

  const { accessToken: newAccessToken } = await refreshResponse.json();

  // save the new access token
  await saveTokens(newAccessToken, refreshToken);

  // retry the original request with the new access token
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${newAccessToken}`,
      ...options.headers,
    },
  });
};
