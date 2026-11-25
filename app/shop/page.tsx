
import { supabase } from "@/lib/supabase";
import ShopClient from "./shop-client";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, brand, name, price, stock_quantity, image_url, description, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Shop products error:", error.message);

    return (
      <main className="shell">
        <h1 className="section-title">The collection</h1>
        <p className="muted">
          We could not load the products. Please try again later.
        </p>
      </main>
    );
  }

  return <ShopClient products={data || []} />;
}
