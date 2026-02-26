import { Request } from 'express';
import Busboy from 'busboy';
import { BUSBOY_LIMITS, ALLOWED_MIME_TYPES } from '../config/constants';
import { HttpError } from '../utils/HttpError';

/**
 * multipart/form-data 요청에서 이미지 파일을 추출합니다.
 *
 * @param req - Express 요청 객체
 * @returns 이미지 버퍼 또는 null
 *
 * Busboy를 사용한 이유:
 * - Express의 기본 body parser는 multipart/form-data를 지원하지 않음
 * - Busboy는 스트리밍 방식으로 대용량 파일도 효율적으로 처리
 * - 파일 크기 제한, MIME 타입 검증 등 세밀한 제어 가능
 */
export function receiveImage(req: Request): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: BUSBOY_LIMITS,
    });

    let fileBuffer: Buffer | null = null;
    let hasFile = false;

    // 파일 업로드 이벤트
    busboy.on('file', (_fieldname, file, fileInfo) => {
      hasFile = true;

      // MIME 타입 검증
      const mimeType = fileInfo.mimeType || 'application/octet-stream';

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        file.resume(); // 스트림 버리기
        reject(
          new HttpError(
            415,
            '지원하지 않는 파일 형식입니다. JPEG, PNG, WEBP 이미지만 업로드 가능합니다.'
          )
        );
        return;
      }

      // 파일 데이터 수집
      const chunks: Buffer[] = [];

      file.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      // 파일 크기 초과 시
      file.on('limit', () => {
        file.resume();
        reject(
          new HttpError(413, '파일이 너무 큽니다. 최대 10MB까지 업로드 가능합니다.')
        );
      });

      // 파일 읽기 완료
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    // 폼 필드 크기 초과
    busboy.on('field', (_name, _val, info) => {
      if (info && info.valueTruncated) {
        reject(new HttpError(413, '폼 데이터가 너무 큽니다.'));
      }
    });

    // 에러 처리
    busboy.on('error', (error: Error) => {
      if (error.message === 'Unexpected end of form') {
        reject(new HttpError(400, '업로드가 중단되었습니다. 다시 시도해주세요.'));
      } else {
        reject(error);
      }
    });

    // 제한 초과 이벤트
    busboy.on('partsLimit', () => {
      reject(new HttpError(413, '요청 항목이 너무 많습니다.'));
    });

    busboy.on('filesLimit', () => {
      reject(new HttpError(413, '한 번에 하나의 이미지만 업로드할 수 있습니다.'));
    });

    busboy.on('fieldsLimit', () => {
      reject(new HttpError(413, 'Too many form fields.'));
    });

    // 파싱 완료
    busboy.on('finish', () => {
      if (!hasFile || !fileBuffer || fileBuffer.length === 0) {
        resolve(null);
        return;
      }

      resolve(fileBuffer);
    });

    // 요청 바디를 Busboy로 파이핑
    try {
      req.pipe(busboy);
    } catch (error) {
      reject(error);
    }
  });
}
