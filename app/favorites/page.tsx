import SectionTitle from "@/components/global/SectionTitle";
import ProductsGrid from "@/components/products/ProductsGrid";
import { fetchUserFavorites } from "@/utils/actions";

async function FavoritesPage() {
  const products = await fetchUserFavorites();

  if (products.length === 0)
    return <SectionTitle text="You have no favorites yes." />;

  return (
    <div>
      <SectionTitle text="Favorites" />
      <ProductsGrid products={products.map((product) => product.product)} />
    </div>
  );
}
export default FavoritesPage;
