/**
 * Shared utility functions — eliminates duplication across components.
 */

export function getInitials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slotsLeft(supervisor) {
  return Math.max(0, (supervisor?.capacity || 0) - (supervisor?.currentStudents || 0))
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
