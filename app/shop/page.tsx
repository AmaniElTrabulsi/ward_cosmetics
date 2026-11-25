import { supabase } from "@/lib/supabase";
import ShopClient from "./shop-client";
export const dynamic = "force-dynamic";
export default async function ShopPage() {
 const {data}=await supabase.from("products").select("*").order("brand").order("name");
 return <ShopClient products={data||[]}/>;
}
