const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parsea una fecha YYYY-MM-DD sin desfase de zona horaria (UTC vs Local)
 * y valida días reales del calendario (incluyendo años bisiestos como 2028-02-29).
 */
export function parseLocalDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = ISO_DATE_REGEX.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isValidLocalDateString(dateStr?: string | null): boolean {
  return parseLocalDate(dateStr) !== null;
}

export function getTodayIsoDate(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateOverdue(
  dateStr?: string | null,
  referenceDateStr: string = getTodayIsoDate()
): boolean {
  if (!isValidLocalDateString(dateStr) || !isValidLocalDateString(referenceDateStr)) {
    return false;
  }
  return (dateStr as string).trim() < referenceDateStr.trim();
}

export function isDateToday(
  dateStr?: string | null,
  referenceDateStr: string = getTodayIsoDate()
): boolean {
  if (!isValidLocalDateString(dateStr) || !isValidLocalDateString(referenceDateStr)) {
    return false;
  }
  return (dateStr as string).trim() === referenceDateStr.trim();
}

export function formatDisplayDate(dateStr?: string | null): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) {
    if (!dateStr) return 'Sin fecha';
    const fallback = new Date(dateStr);
    if (Number.isNaN(fallback.getTime())) return 'Fecha inválida';
    return fallback.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
