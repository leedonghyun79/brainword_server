/**
 * 애플리케이션 전역 상수 정의
 */

/** Gemini AI 모델 설정 */
export const GEMINI_CONFIG = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxOutputTokens: 2048,
};

/** 허용할 Origin 목록 */
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  '*',
];

// ============================================
// File Upload Settings
// ============================================

// Busboy limits to guard against oversized uploads and excessive parts.
export const BUSBOY_LIMITS = {
  fileSize: 10 * 1024 * 1024, // 10MB max per file
  files: 1, // only one file expected per request
  parts: 2, // file + minimal extra fields
  fields: 10, // allow a few text fields alongside the file
};

// Allow only common image MIME types for profile/word cards.
export const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// ============================================
// AI Analysis Prompts
// ============================================

/**
 * Vocabulary Generation Prompt
 */
export const WORD_GENERATION_PROMPT = (difficulty: string, count: number) => {
  let levelDescription = '';

  switch (difficulty) {
    case 'Easy':
      levelDescription = 'elementary to middle school level (basic vocabulary for beginners)';
      break;
    case 'Medium':
      levelDescription = 'Korean CSAT (Suneung) level, focusing on academic and literary words found in high school textbooks';
      break;
    case 'Hard':
      levelDescription = 'TOEIC/TOEFL level, focusing on business, office, commerce, and professional workplace vocabulary frequently found in official exams';
      break;
    case 'Expert':
      levelDescription = 'advanced professional, GRE, GMAT, or sophisticated literature level (very high difficulty)';
      break;
    default:
      levelDescription = 'basic vocabulary';
  }

  return `
    Please generate ${count} English vocabulary words suitable for a learner at the ${difficulty} level (${levelDescription}).
    
    The output must be a valid JSON array of objects.
    Each object must have the following fields:
    - "english": The English word (string)
    - "korean": The Korean meaning (string) - concise, representative meaning
    - "pronunciation": IPA pronunciation guide (string) e.g., /.../
    - "category": Part of speech (noun, verb, adjective, etc.) in Korean (string)

    Strictly return ONLY the JSON array. Do not include any Markdown formatting (no \`\`\`json or \`\`\`).
    Do not add any introductory or concluding text.
    
    Example:
    [
      { "english": "example", "korean": "예시", "pronunciation": "/ɪɡˈzæmpl/", "category": "명사" }
    ]
  `;
};
