// 백엔드 API 호출 예시
// 프론트엔드 (React/TypeScript)에서 사용할 수 있는 API 클라이언트 예시

const API_BASE_URL = 'http://localhost:3001';

/**
 * 그림 분석 API 호출
 */
export async function analyzeDrawing(topic: string, imageData: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-drawing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        imageData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing drawing:', error);
    throw error;
  }
}

/**
 * 색상 분석 API 호출
 */
export async function analyzeColors(colors: string[]): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-colors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        colors,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing colors:', error);
    throw error;
  }
}

/**
 * 기억력 분석 API 호출
 */
export async function analyzeMemory(selectedCards: string[]): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedCards,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing memory:', error);
    throw error;
  }
}

/**
 * 사용 예시:
 * 
 * // 그림 분석
 * const canvas = document.querySelector('canvas');
 * const imageData = canvas.toDataURL('image/png');
 * const analysis = await analyzeDrawing('나무', imageData);
 * console.log(analysis);
 * 
 * // 색상 분석
 * const colors = ['#FF0000', '#00FF00', '#0000FF'];
 * const colorAnalysis = await analyzeColors(colors);
 * console.log(colorAnalysis);
 * 
 * // 기억력 분석
 * const cards = ['card1', 'card2', 'card3'];
 * const memoryAnalysis = await analyzeMemory(cards);
 * console.log(memoryAnalysis);
 */
