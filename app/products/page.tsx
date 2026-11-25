import ProductManager from "@/app/shared/product-manager";
import {redirect} from "next/navigation";import {getSession} from "@/lib/session";
export const dynamic="force-dynamic";
export default async function Page(){const u=await getSession();if(!u)redirect("/login");return <ProductManager/>;}
