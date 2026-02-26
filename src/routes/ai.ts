import { Router, Request, Response } from 'express';
import { generateWords } from '../services/geminiService';

const router = Router();

/**
 * POST /api/ai/generate-words
 */
router.post('/generate-words', async (req: Request, res: Response): Promise<void> => {
  try {
    const { difficulty, count } = req.body;

    if (!difficulty) {
      res.status(400).json({
        success: false,
        message: '난이도(difficulty)를 명시해주세요.'
      });
      return;
    }

    const words = await generateWords(difficulty, count || 5);

    res.json({
      success: true,
      words,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in generate-words:', error);
    res.status(500).json({
      success: false,
      message: error.message || '단어 생성 중 오류가 발생했습니다.'
    });
  }
});

export default router;
