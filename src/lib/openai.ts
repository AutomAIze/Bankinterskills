import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

export const openaiClient = apiKey
  ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  : null;

export const OPENAI_MODEL = 'gpt-4o-mini';
