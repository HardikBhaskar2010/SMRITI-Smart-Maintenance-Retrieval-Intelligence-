import type { ThreadItem as ThreadItemType } from '@/api/types';
import { ThreadItem } from './ThreadItem';
import { Spinner } from '@/components/ui/Spinner';

interface ThreadListProps {
  items: ThreadItemType[];
  loading?: boolean;
}

export function ThreadList({ items, loading }: ThreadListProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{
        padding: '48px 24px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: '14px',
      }}>
        No knowledge items in this thread yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <ThreadItem key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
