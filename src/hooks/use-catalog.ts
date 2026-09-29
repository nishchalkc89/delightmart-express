import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { buildCollections, fetchCatalog } from '@/services/catalog';

export const catalogQuery = queryOptions({ queryKey: ['catalog'], queryFn: fetchCatalog, staleTime: 5 * 60_000 });

export const useCatalog = () => useSuspenseQuery(catalogQuery);

/** Catalogue plus the homepage/category collections derived from it. */
export function useStorefront() {
  const { data } = useCatalog();
  const collections = useMemo(() => buildCollections(data.products), [data.products]);
  return { ...data, collections };
}
