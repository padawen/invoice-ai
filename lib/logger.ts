import pino from 'pino';

type Environment = 'development' | 'production' | 'test';

const nodeEnv = (process.env.NODE_ENV as Environment | undefined) ?? 'development';
const defaultLevel: 'debug' | 'info' = nodeEnv === 'production' ? 'info' : 'debug';
const explicitLevel =
  (typeof process !== 'undefined' && process.env.LOG_LEVEL) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_LOG_LEVEL);

const logger = pino({
  level: (explicitLevel as typeof defaultLevel | undefined) ?? defaultLevel,
  base: {
    service: 'invoice-ai',
    environment: nodeEnv,
  },
  redact: ['authorization', 'token', 'password'],
});

export default logger;
