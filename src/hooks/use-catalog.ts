import { queryOptions,useSuspenseQuery } from '@tanstack/react-query'; import { categories,products } from '@/services/catalog';
export const catalogQuery=queryOptions({queryKey:['catalog','demo'],queryFn:async()=>({products,categories}),staleTime:300000});
export const useCatalog=()=>useSuspenseQuery(catalogQuery);
