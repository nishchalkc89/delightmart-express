import { useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { keepPreviousData, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { currentBranchId } from '@/lib/branch';
import { categories as designedCategories, dealsCategory, fetchCategories, fetchProduct, fetchProducts, fetchStorefront, fetchSubcategories, type ProductFilter, type ProductPage } from '@/services/catalog';

const minutes = (n: number) => n * 60_000;

// Stock differs per store, so every product query is keyed by the shopper's store.
export const storefrontQuery = (branch = currentBranchId()) => queryOptions({ queryKey: ['storefront', branch], queryFn: () => fetchStorefront(branch), staleTime: minutes(5) });
export const categoriesQuery = queryOptions({ queryKey: ['categories'], queryFn: fetchCategories, staleTime: minutes(10) });
export const productsQuery = (filter: ProductFilter, branch = currentBranchId()) => queryOptions({ queryKey: ['products', branch, filter], queryFn: () => fetchProducts({ ...filter, branch }), staleTime: minutes(2), placeholderData: keepPreviousData });
export const subcategoriesQuery = (category: string) => queryOptions({ queryKey: ['subcategories', category], queryFn: () => fetchSubcategories(category), staleTime: minutes(10) });
export const productQuery = (slug: string, branch = currentBranchId()) => queryOptions({ queryKey: ['product', branch, slug], queryFn: () => fetchProduct(slug, branch), staleTime: minutes(2) });

const fallbackCategories = [...designedCategories, dealsCategory];

/** Store categories for navigation; shows the built-in list until the database answers. */
export function useCategories() {
  return useQuery({ ...categoriesQuery, placeholderData: fallbackCategories }).data ?? fallbackCategories;
}

/** True while the router loads the next page of results (never during the first render, so it matches the server HTML). */
export function useLoadingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pending = useRouterState({ select: (s) => s.status === 'pending' });
  return mounted && pending;
}

/**
 * Product listing that keeps loading the next page as the shopper scrolls.
 * The first page comes from the route loader (so the server HTML already has products).
 */
export function useInfiniteProducts(filter: ProductFilter, first: ProductPage | null | undefined) {
  const base = { ...filter, page: undefined, branch: filter.branch ?? currentBranchId() };
  const query = useInfiniteQuery({
    queryKey: ['products-infinite', base],
    queryFn: ({ pageParam }) => fetchProducts({ ...base, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    enabled: Boolean(first),
    staleTime: minutes(2),
    ...(first ? { initialData: { pages: [first], pageParams: [1] } } : {}),
  });
  const pages = query.data?.pages ?? (first ? [first] : []);
  return {
    products: pages.flatMap((p) => p.products),
    total: pages[0]?.total ?? 0,
    hasMore: Boolean(query.hasNextPage),
    loadingMore: query.isFetchingNextPage,
    loadMore: () => { if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage(); },
  };
}
