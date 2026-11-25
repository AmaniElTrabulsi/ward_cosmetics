import {redirect} from "next/navigation";import {getSession} from "@/lib/session";import Workspace from "./workspace";
export const dynamic="force-dynamic";
export default async function AppPage(){const u=await getSession();if(!u)redirect("/login");if(u.role==="admin")redirect("/admin");return <Workspace user={u}/>;}
