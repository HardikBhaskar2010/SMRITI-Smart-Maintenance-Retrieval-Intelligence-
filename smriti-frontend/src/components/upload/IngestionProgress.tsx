import type { IngestProgress, IngestResult } from '@/api/types';

interface IngestionProgressProps {
  progress: IngestProgress | null;
  result: IngestResult | null;
}

export { IngestionProgress };

function IngestionProgress({ progress, result }: IngestionProgressProps) {
  if (!progress && !result) return null;
  // Rendered inside DropZone — kept as named export for direct use
  return null;
}
