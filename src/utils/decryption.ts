import crypto from 'crypto';

/**
 * AES-256-GCM 복호화 함수
 * @param encryptedBase64 - 암호문 (Base64 인코딩, IV + 암호문 + 태그)
 * @param base64EncodedKey - AES 키 (Base64)
 * @param aad - AAD 문자열
 * @returns 복호화된 평문
 */
export function decryptUserData(encryptedBase64: string, base64EncodedKey: string, aad: string): string {
  const IV_LENGTH = 12;

  const decoded = Buffer.from(encryptedBase64, 'base64');
  const key = Buffer.from(base64EncodedKey, 'base64');

  const iv = Buffer.from(decoded.subarray(0, IV_LENGTH));
  const ciphertext = Buffer.from(decoded.subarray(IV_LENGTH));

  const tag = Buffer.from(ciphertext.subarray(ciphertext.length - 16));
  const encrypted = Buffer.from(ciphertext.subarray(0, ciphertext.length - 16));

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf-8');
}

/**
 * 사용자 정보 객체에 대해 복호화 적용
 * @param userInfo - 암호화된 사용자 정보
 * @returns 복호화된 사용자 정보 (원본 포함)
 */
export function decryptUserInfo(userInfo: any, decryptionKey: string, aad: string): any {
  const fields = [
    'ci',
    'name',
    'phone',
    'gender',
    'nationality',
    'birthday',
    'email',
  ];

  const decrypted: any = {};

  for (const key of fields) {
    const value = userInfo?.[key];
    decrypted[key] =
      typeof value === 'string'
        ? decryptUserData(value, decryptionKey, aad)
        : null;
  }

  return {
    ...userInfo,
    ...decrypted,
  };
}
