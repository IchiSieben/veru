import data from '../data/products.json';

export const products = data.products;
export const categories = data.categories;
export const lookbook = data.lookbook;
export const instagram = data.instagram;
export const media = data.media;

/** Categorías para los chips del catálogo: "Todos" + únicas en orden de aparición. */
export const chipCategories = ['Todos', ...new Set(products.map((p) => p.cat))];

export const getBySlug = (slug) => products.find((p) => p.slug === slug);
export const getById = (id) => products.find((p) => p.id === id);
export const byCat = (cat) => products.filter((p) => p.cat === cat);

/** Productos relacionados (misma categoría, excluyendo el actual). */
export function related(slug, limit = 4) {
  const p = getBySlug(slug);
  if (!p) return [];
  const same = products.filter((x) => x.cat === p.cat && x.slug !== slug);
  const rest = products.filter((x) => x.cat !== p.cat && x.slug !== slug);
  return [...same, ...rest].slice(0, limit);
}
