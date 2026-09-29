import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { StorePage } from '@/components/delight/store-shell';
import { ProductGridPage, ResetButton, ToolbarSelect } from '@/components/delight/product-grid-page';
import { useCatalog } from '@/hooks/use-catalog';
import { catalogQuery } from '@/hooks/use-catalog';

export const Route = createFileRoute('/products/')({
  head: () => ({ meta: [{ title: 'All Products — Delight Shopping Mart' }, { name: 'description', content: 'Browse products available at Delight Shopping Mart.' }, { property: 'og:title', content: 'Shop All Products — Delight' }, { property: 'og:description', content: 'Groceries, fashion, home essentials and more.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: ProductsPage,
});

const sorts = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

function ProductsPage() {
  const { data } = useCatalog();
  const [category, setCategory] = useState('All Categories');
  const [sort, setSort] = useState('Featured');
  const [stock, setStock] = useState('All Products');

  const list = useMemo(() => data.products
    .filter((p) => (category === 'All Categories' || p.category === category) && (stock === 'All Products' || p.stock > 0))
    .sort((a, b) => sort === 'Price: Low to High' ? a.price - b.price : sort === 'Price: High to Low' ? b.price - a.price : sort === 'Top Rated' ? b.rating - a.rating : Number(Boolean(b.featured)) - Number(Boolean(a.featured))), [data.products, category, sort, stock]);

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: 'Search products...' }}>
      <ProductGridPage
        crumb="All Products"
        title="All Products"
        subtitle={`${list.length} products · Fresh choices and everyday essentials`}
        products={list}
        toolbar={<>
          <ToolbarSelect label="Category" value={category} onChange={setCategory} options={['All Categories', ...data.categories.map((c) => c.name)]} />
          <ToolbarSelect label="Availability" value={stock} onChange={setStock} options={['All Products', 'In Stock Only']} />
          <ToolbarSelect label="Sort by" value={sort} onChange={setSort} options={sorts} />
          <ResetButton onClick={() => { setCategory('All Categories'); setSort('Featured'); setStock('All Products'); }} />
        </>}
      />
    </StorePage>
  );
}
