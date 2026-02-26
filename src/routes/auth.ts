import { Router, Request, Response, RequestHandler } from 'express';
import * as authService from '../services/authService';
import { decryptUserInfo } from '../utils/decryption';
import { mTLSConfig } from '../config/mTLSConfig';

const router = Router();

const DECRYPTION_KEY_BASE64 = process.env.DECRYPTION_KEY_BASE64 || mTLSConfig.decryptionKey;
const AAD_STRING = process.env.AAD_STRING || mTLSConfig.aadString; // mTLSConfig의 'TOSS' 사용

/**
 * POST /api/auth/get-access-token
 */
const getAccessToken: RequestHandler = async (req, res) => {
  try {
    const { authorizationCode, referrer } = req.body;
    const response = await authService.getAccessToken({ authorizationCode, referrer });

    res.status(200).json({
      statusCode: response.statusCode,
      data: JSON.parse(response.data),
    });
  } catch (error: any) {
    console.error('getAccessToken 실패:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/auth/refresh-token
 */
const refreshToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const response = await authService.refreshAccessToken({ refreshToken });

    res.status(200).json({
      statusCode: response.statusCode,
      data: JSON.parse(response.data),
    });
  } catch (error: any) {
    console.error('refreshToken 실패:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/auth/get-user-info
 */
const getUserInfo: RequestHandler = async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      res.status(401).json({ error: 'Authorization header is required' });
      return;
    }

    const response = await authService.getUserInfo(authorization);
    const parsedData = JSON.parse(response.data);
    console.log('Raw User Info from Toss (Encrypted):', parsedData);

    if (parsedData.success) {
      const decryptedUser = decryptUserInfo(parsedData.success, DECRYPTION_KEY_BASE64, AAD_STRING);
      console.log('Decrypted User Info:', decryptedUser);
      res.status(200).json({
        statusCode: response.statusCode,
        data: {
          ...parsedData,
          success: decryptedUser,
        },
      });
    } else {
      res.status(response.statusCode || 400).json({
        statusCode: response.statusCode,
        data: parsedData,
      });
    }
  } catch (error: any) {
    console.error('getUserInfo 실패:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/auth/logout-by-access-token
 */
const logoutByAccessToken: RequestHandler = async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      res.status(401).json({ error: 'Authorization header is required' });
      return;
    }

    const response = await authService.logoutByAccessToken(authorization);

    res.status(200).json({
      statusCode: response.statusCode,
      data: JSON.parse(response.data),
    });
  } catch (error: any) {
    console.error('logout 실패:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/auth/logout-by-user-key
 */
const logoutByUserKey: RequestHandler = async (req, res) => {
  try {
    const { userKey } = req.body;
    const response = await authService.logoutByUserKey(userKey);

    res.status(200).json({
      statusCode: response.statusCode,
      data: JSON.parse(response.data),
    });
  } catch (error: any) {
    console.error('logoutByUserKey 실패:', error);
    res.status(500).json({ error: error.message });
  }
};

router.post('/get-access-token', getAccessToken);
router.post('/refresh-token', refreshToken);
router.get('/get-user-info', getUserInfo);
router.post('/logout-by-access-token', logoutByAccessToken);
router.post('/logout-by-user-key', logoutByUserKey);

export default router;
