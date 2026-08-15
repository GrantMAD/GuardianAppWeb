export function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const CATEGORY_COLORS: Record<string, string> = {
  social:        '#7C6AF5',
  games:         '#F5A623',
  entertainment: '#E91E8C',
  education:     '#4CAF82',
  productivity:  '#2196F3',
  other:         '#9E9E9E',
};
