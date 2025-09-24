/**
 * Supported input formats:
 * - YYYY-MM-DD
 * - YYYY.MM.DD (optional spaces and trailing dot)
 * - DD.MM.YYYY (optional spaces and trailing dot)
 * - YYYY/MM/DD
 * - DD/MM/YYYY
 * - YYYY MM DD (space separated)
 */

type DateOrder = 'YMD' | 'DMY';

const HUNGARIAN_DATE_FORMATTER = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const normalizeToIso = (yearStr: string, monthStr: string, dayStr: string): string | null => {
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const testDate = new Date(year, month - 1, day);

  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month - 1 ||
    testDate.getDate() !== day
  ) {
    return null;
  }

  return [
    year.toString().padStart(4, '0'),
    month.toString().padStart(2, '0'),
    day.toString().padStart(2, '0')
  ].join('-');
};

const normalizeByOrder = (
  parts: [string, string, string],
  order: DateOrder
): string | null => {
  const [first, second, third] = parts;
  return order === 'YMD'
    ? normalizeToIso(first, second, third)
    : normalizeToIso(third, second, first);
};

const parseDotSeparated = (parts: [string, string, string], order: DateOrder) =>
  normalizeByOrder(parts, order);

const parseSlashSeparated = (parts: [string, string, string], order: DateOrder) =>
  normalizeByOrder(parts, order);

const parseSpaceSeparated = (parts: [string, string, string]) =>
  normalizeByOrder(parts, 'YMD');

type PatternHandler = {
  regex: RegExp;
  formatter: (match: RegExpMatchArray) => string | null;
};

const DATE_FORMAT_PATTERNS: PatternHandler[] = [
  {
    regex: /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/,
    formatter: match => normalizeToIso(match[1], match[2], match[3])
  },
  {
    regex: /^\s*(\d{4})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})(?:\s*\.)?\s*$/,
    formatter: match => parseDotSeparated([match[1], match[2], match[3]], 'YMD')
  },
  {
    regex: /^\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})(?:\s*\.)?\s*$/,
    formatter: match => parseDotSeparated([match[1], match[2], match[3]], 'DMY')
  },
  {
    regex: /^\s*(\d{4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/,
    formatter: match => parseSlashSeparated([match[1], match[2], match[3]], 'YMD')
  },
  {
    regex: /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})\s*$/,
    formatter: match => parseSlashSeparated([match[1], match[2], match[3]], 'DMY')
  },
  {
    regex: /^\s*(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s*$/,
    formatter: match => parseSpaceSeparated([match[1], match[2], match[3]])
  }
];

export const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.trim() === '') return '';

  const trimmedDate = dateString.trim();

  try {
    for (const { regex, formatter } of DATE_FORMAT_PATTERNS) {
      const match = trimmedDate.match(regex);
      if (!match) continue;

      const formatted = formatter(match);
      if (formatted) {
        return formatted;
      }
    }

    const parsedTimestamp = Date.parse(trimmedDate);
    if (!Number.isNaN(parsedTimestamp)) {
      return new Date(parsedTimestamp).toISOString().split('T')[0];
    }

    console.warn('Could not parse date:', dateString);
    return '';
  } catch (error) {
    console.warn('Date formatting failed for:', dateString, error);
    return '';
  }
};

export const formatDateForDisplay = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.trim() === '') return '';

  try {
    const timestamp = Date.parse(dateString);
    if (!Number.isNaN(timestamp)) {
      return HUNGARIAN_DATE_FORMATTER.format(new Date(timestamp));
    }
    return dateString;
  } catch (error) {
    console.warn('Date display formatting failed for:', dateString, error);
    return dateString;
  }
};