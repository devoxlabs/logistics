// Helper utilities for reading Firestore document data safely without `any` casts.

type TimestampLike = {
  toDate: () => Date;
};

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as Record<string, unknown>).toDate === 'function'
  );
}

export function formatTimestamp(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (isTimestampLike(value)) {
    return value.toDate().toLocaleString();
  }
  return '';
}

export function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
