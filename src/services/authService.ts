import { TLSClient, TLSResponse } from '../utils/TLSClient';
import { mTLSConfig } from '../config/mTLSConfig';

const AUTH_API_BASE = process.env.AUTH_API_BASE || 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2';

let client: TLSClient | null = null;

function getClient(): TLSClient {
  if (!client) {
    // 환경 변수가 있으면 환경 변수를 우선 사용하고, 없으면 mTLSConfig의 값을 사용합니다.
    const cert = process.env.CLIENT_CERT_PATH || mTLSConfig.clientCert;
    const key = process.env.CLIENT_KEY_PATH || mTLSConfig.clientKey;

    if (!cert || !key) {
      throw new Error('mTLS certificates are missing (both Env and Config)');
    }
    client = new TLSClient(cert, key);
  }
  return client;
}

export interface GetAccessTokenParams {
  authorizationCode: string;
  referrer: string;
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export async function getAccessToken({ authorizationCode, referrer }: GetAccessTokenParams): Promise<TLSResponse> {
  return getClient().post(`${AUTH_API_BASE}/generate-token`, {
    authorizationCode,
    referrer,
  });
}

export async function refreshAccessToken({ refreshToken }: RefreshTokenParams): Promise<TLSResponse> {
  return getClient().post(`${AUTH_API_BASE}/refresh-token`, {
    refreshToken,
  });
}

export async function getUserInfo(accessToken: string): Promise<TLSResponse> {
  console.log('AuthService: Requesting user info with token (first 10 chars):', accessToken.substring(0, 10));

  // 토스 API 가이드에 따라 Bearer 접두사가 필요한지 확인 (일반적으로 OAuth2는 필수)
  const authHeader = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;

  return getClient().get(`${AUTH_API_BASE}/login-me`, {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  });
}

export async function logoutByAccessToken(accessToken: string): Promise<TLSResponse> {
  return getClient().post(
    `${AUTH_API_BASE}/access/remove-by-access-token`,
    {},
    { Authorization: accessToken }
  );
}

export async function logoutByUserKey(userKey: string): Promise<TLSResponse> {
  return getClient().post(`${AUTH_API_BASE}/access/remove-by-user-key`, { userKey });
}
