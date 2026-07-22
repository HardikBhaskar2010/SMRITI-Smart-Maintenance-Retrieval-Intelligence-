import { useQuery } from '@tanstack/react-query'
import { useAssetStore } from '@/stores/assetStore'
import { fetchAssets, fetchAsset } from '@/api/assets'

export function useAssets() {
  const setAssets = useAssetStore((s) => s.setAssets)
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const data = await fetchAssets()
      setAssets(data)
      return data
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}

export function useAssetDetail(assetId: string | null) {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAsset(assetId!),
    enabled: !!assetId,
  })
}
