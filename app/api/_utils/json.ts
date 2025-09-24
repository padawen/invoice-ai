export const extractJsonFromText = (text: string): unknown => {
  if (!text) {
    throw new Error('Empty text received when attempting to extract JSON');
  }

  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    const fenceEnd = cleaned.indexOf('\n');
    cleaned = fenceEnd >= 0 ? cleaned.slice(fenceEnd + 1) : cleaned.slice(3);
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3).trim();
    }
  }

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    console.error('No JSON object found in response:', cleaned);
    throw new Error('No JSON object found in assistant response');
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    console.error('Attempted to parse:', match[0]);
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
};
