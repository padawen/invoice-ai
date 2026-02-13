import { logger } from '@/lib/logger';

export const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.trim() === '') return '';

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const testDate = new Date(dateString);
      if (!isNaN(testDate.getTime())) {
        return dateString;
      }
    }

    if (dateString.includes('.')) {
      const cleaned = dateString.replace(/\./g, '').trim();
      const parts = cleaned.split(' ').filter(part => part.length > 0);

      if (parts.length === 3) {
        const [first, second, third] = parts;

        if (first.length === 4) {
          const formattedDate = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
          const testDate = new Date(formattedDate);
          if (!isNaN(testDate.getTime())) {
            return formattedDate;
          }
        } else {
          const formattedDate = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
          const testDate = new Date(formattedDate);
          if (!isNaN(testDate.getTime())) {
            return formattedDate;
          }
        }
      } else {
        const dotParts = dateString.split('.');
        if (dotParts.length === 3) {
          const [first, second, thirdRaw] = dotParts;

          const third = thirdRaw.replace(/[.\s]+$/, '');

          if (first.length === 4) {
            const formattedDate = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
            const testDate = new Date(formattedDate);
            if (!isNaN(testDate.getTime())) {
              return formattedDate;
            }
          } else {
            const formattedDate = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
            const testDate = new Date(formattedDate);
            if (!isNaN(testDate.getTime())) {
              return formattedDate;
            }
          }
        }
      }
    }

    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [first, second, third] = parts;

        if (first.length === 4) {
          const formattedDate = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
          const testDate = new Date(formattedDate);
          if (!isNaN(testDate.getTime())) {
            return formattedDate;
          }
        } else {
          const formattedDate = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
          const testDate = new Date(formattedDate);
          if (!isNaN(testDate.getTime())) {
            return formattedDate;
          }
        }
      }
    }

    if (dateString.includes(' ')) {
      const parts = dateString.split(' ').filter(part => part.length > 0);

      if (parts.length === 3) {
        const [first, second, third] = parts;

        if (first.length === 4) {
          const formattedDate = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
          const testDate = new Date(formattedDate);
          if (!isNaN(testDate.getTime())) {
            return formattedDate;
          }
        }
      }
    }

    const testDate = new Date(dateString);
    if (!isNaN(testDate.getTime())) {
      return testDate.toISOString().split('T')[0];
    }

    logger.warn('Could not parse date', { data: { dateString } });
    return '';
  } catch (error) {
    logger.warn('Date formatting failed', { data: { dateString, error } });
    return '';
  }
};

export const formatDateForDisplay = (dateString: string | undefined | null): string => {
  if (!dateString || dateString.trim() === '') return '';

  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    return dateString;
  } catch (error) {
    logger.warn('Date display formatting failed', { data: { dateString, error } });
    return dateString;
  }
}; 
