import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG, WORD_GENERATION_PROMPT } from '../config/constants';
import fs from 'fs';
import path from 'path';
import os from 'os';

let genAI: GoogleGenerativeAI | null = null;

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in environment variables');
} else {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export interface Word {
  english: string;
  korean: string;
  pronunciation: string;
  category: string;
}

// 캐시 디렉토리 설정 (서버리스 환경에서는 /tmp만 쓰기 가능)
const CACHE_DIR = path.join(os.tmpdir(), 'brain-word-cache');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn('⚠️ Failed to create cache directory, caching will be disabled:', err);
  }
}

/**
 * 단어 데이터 유효성 검사
 */
function isValidWord(word: any): word is Word {
  return (
    word &&
    typeof word.english === 'string' && word.english.trim().length > 0 &&
    typeof word.korean === 'string' && word.korean.trim().length > 0 &&
    typeof word.pronunciation === 'string' &&
    typeof word.category === 'string'
  );
}

/**
 * AI를 사용하여 단어 생성 (서버 캐싱 + 검증 및 재시도 로직 적용)
 */
export async function generateWords(difficulty: string, count: number = 5): Promise<Word[]> {
  // 오늘 날짜 기반 캐시 파일명 생성
  const today = new Date().toISOString().split('T')[0];
  const cacheFileName = `words-${today}-${difficulty}-${count}.json`;
  const cachePath = path.join(CACHE_DIR, cacheFileName);

  // 1. 캐시가 활성화되어 있고 파일이 존재하면 즉시 반환
  if (fs.existsSync(cachePath)) {
    console.log(`📦 Serving from server cache: ${cacheFileName}`);
    try {
      const cachedData = fs.readFileSync(cachePath, 'utf8');
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.error('Failed to read cache file, proceeding with AI generation', err);
    }
  }

  if (!genAI) {
    throw new Error('Gemini API가 초기화되지 않았습니다. GEMINI_API_KEY를 .env 파일에 설정해주세요.');
  }

  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🤖 AI Generation Attempt ${attempt}/${MAX_RETRIES} for: ${today} (${difficulty})`);

      const model = genAI.getGenerativeModel({ model: GEMINI_CONFIG.model });
      const prompt = WORD_GENERATION_PROMPT(difficulty, count);

      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text();

      // JSON 파싱 전처리
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
      }

      const words = JSON.parse(text);

      // 데이터 유효성 검증
      if (!Array.isArray(words) || words.length === 0) {
        throw new Error('AI가 빈 리스트를 반환했습니다.');
      }

      const validWords = words.filter(isValidWord);

      if (validWords.length < count * 0.6) { // 요청한 개수의 60% 미만이면 실패로 간주하고 재시도
        throw new Error(`유효한 단어가 부족합니다. (${validWords.length}/${words.length} 유효)`);
      }

      // 2. 생성 및 검증된 단어를 파일 시스템에 캐싱
      fs.writeFileSync(cachePath, JSON.stringify(validWords, null, 2));
      console.log(`✅ Saved ${validWords.length} words to cache: ${cacheFileName}`);

      return validWords;

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      lastError = error;
      // 재시도 전 약간의 대기 (선택 사항)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw new Error(`단어 생성에 최종 실패했습니다 (${MAX_RETRIES}회 시도): ${lastError?.message}`);
}
