// Format a comma-separated list of epochs into clean, capitalized entries
export function formatEpochs(rawEpochs: string): string {
  if (!rawEpochs) return '';

  return rawEpochs
    .split(',') // 1. Split ONLY by commas
    .map((item) => item.trim()) // 2. Trim leading and trailing spaces for each entry
    .filter((item) => item !== '') // 3. Remove empty entries (e.g., extra commas)
    .map(
      (item) =>
        item
          .split(/\s+/) // 4. Split each multi-word epoch by whitespace
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // 5. Capitalize every word
          .join(' ') // 6. Rejoin words with a single space
    )
    .join(', '); // 7. Rejoin epochs with ", "
}
