/** Normalize asset ID for display — always uppercase with dash */
export function displayAssetId(id: string): string {
  if (!id) return '—';
  return id.toUpperCase().replace(/_/g, '-');
}

/** Short label for graph nodes — truncate long IDs */
export function graphNodeLabel(id: string): string {
  const display = displayAssetId(id);
  return display.length > 10 ? display.slice(0, 8) + '…' : display;
}
