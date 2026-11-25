import {redirect} from "next/navigation";import {getSession} from "@/lib/session";import AdminDashboard from "./dashboard";
export const dynamic="force-dynamic";
export default async function AdminPage(){const u=await getSession();if(!u)redirect("/login");if(u.role!=="admin")redirect("/app");return <AdminDashboard user={u}/>;}
