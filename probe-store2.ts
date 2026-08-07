import { getConfiguredStore } from './lib/db/store.ts';

const store = await getConfiguredStore();
const cats = await store.getAllCategories();
const provs = await store.getAllProviders();
console.log('store.getAllCategories():', cats.length);
console.log('store.getAllProviders():', provs.length);

const byCat = new Map();
for (const p of provs) byCat.set(p.categoryId, (byCat.get(p.categoryId) ?? 0) + 1);
console.log('categories represented by providers:', byCat.size);
console.log('sample categories (id):', cats.slice(0, 5).map((c) => c.id).join(', '));
console.log('all cat ids:', cats.map((c) => c.id).join(', '));
