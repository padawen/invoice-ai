export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface PinoOptions {
  level?: LogLevel;
  base?: Record<string, unknown> | null;
  redact?: string[];
}

export interface Logger {
  level: LogLevel;
  fatal: LogMethod;
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
  child(bindings: Record<string, unknown>): Logger;
}

export type LogInput = Record<string, unknown> | string | undefined | null;
export type LogMethod = (messageOrData?: LogInput, maybeDataOrMessage?: LogInput) => void;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Number.POSITIVE_INFINITY,
};

const LEVEL_TO_CONSOLE: Record<Exclude<LogLevel, 'silent'>, keyof Console> = {
  trace: 'log',
  debug: 'log',
  info: 'log',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

const REDACTED = '[redacted]';

function normalizeInput(input: LogInput): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }

  if (typeof input === 'string') {
    return { msg: input };
  }

  return input;
}

function redact(data: Record<string, unknown>, redactedKeys: string[]): Record<string, unknown> {
  if (!redactedKeys.length) {
    return data;
  }

  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    clone[key] = redactedKeys.includes(key) ? REDACTED : value;
  }

  return clone;
}

function mergeObjects(
  base: Record<string, unknown> | null,
  bindings: Record<string, unknown>,
  entry: Record<string, unknown> | undefined,
  redactedKeys: string[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    time: new Date().toISOString(),
    ...(base ?? {}),
    ...bindings,
    ...entry,
  };

  return redact(payload, redactedKeys);
}

function stringify(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

function logToConsole(level: Exclude<LogLevel, 'silent'>, payload: Record<string, unknown>) {
  const message = stringify(payload);
  const consoleMethod = LEVEL_TO_CONSOLE[level];
  if (typeof console !== 'undefined' && typeof console[consoleMethod] === 'function') {
    console[consoleMethod](message);
  }
}

export default function pino(options: PinoOptions = {}): Logger {
  let currentLevel: LogLevel = options.level ?? 'info';
  const base = options.base ?? {};
  const redactedKeys = options.redact ?? [];

  const bindings: Record<string, unknown> = {};

  const shouldLog = (level: LogLevel) => LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[currentLevel];

  const emit = (level: Exclude<LogLevel, 'silent'>, messageOrData?: LogInput, maybeDataOrMessage?: LogInput) => {
    if (!shouldLog(level)) {
      return;
    }

    const first = normalizeInput(messageOrData);
    const second = normalizeInput(maybeDataOrMessage);

    let entry: Record<string, unknown> = {};
    if (first && second) {
      entry = { ...first, ...second };
    } else if (first) {
      entry = first;
    } else if (second) {
      entry = second;
    }

    const payload = mergeObjects(base, bindings, { ...entry, level }, redactedKeys);
    logToConsole(level, payload);
  };

  const child = (childBindings: Record<string, unknown>): Logger => {
    const nextLogger = pino({
      level: currentLevel,
      base: { ...base, ...bindings, ...childBindings },
      redact: redactedKeys,
    });
    return nextLogger;
  };

  return {
    get level() {
      return currentLevel;
    },
    set level(next) {
      currentLevel = next;
    },
    fatal: (messageOrData, maybeDataOrMessage) => emit('fatal', messageOrData, maybeDataOrMessage),
    error: (messageOrData, maybeDataOrMessage) => emit('error', messageOrData, maybeDataOrMessage),
    warn: (messageOrData, maybeDataOrMessage) => emit('warn', messageOrData, maybeDataOrMessage),
    info: (messageOrData, maybeDataOrMessage) => emit('info', messageOrData, maybeDataOrMessage),
    debug: (messageOrData, maybeDataOrMessage) => emit('debug', messageOrData, maybeDataOrMessage),
    trace: (messageOrData, maybeDataOrMessage) => emit('trace', messageOrData, maybeDataOrMessage),
    child,
  } as Logger;
}
