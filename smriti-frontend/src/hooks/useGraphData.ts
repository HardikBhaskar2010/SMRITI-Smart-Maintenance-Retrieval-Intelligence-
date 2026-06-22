import { useQuery } from '@tanstack/react-query'
import { fetchGraph } from '@/api/graph'

export function useGraphData() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: fetchGraph,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}
