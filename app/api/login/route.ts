import {NextRequest,NextResponse} from "next/server";
import {createHash,randomBytes} from "crypto";import {supabase} from "@/lib/supabase";
export async function POST(req:NextRequest){try{const {username,password,role}=await req.json();if(!username||!password||!["admin","employee"].includes(role))return NextResponse.json({error:"Enter username, password and account type."},{status:400});
const token=randomBytes(32).toString("hex");const hash=createHash("sha256").update(token).digest("hex");
const {data,error}=await supabase.rpc("ward_login",{p_username:String(username).trim().toLowerCase(),p_password:String(password),p_role:role,p_token_hash:hash});
if(error||!data?.success)return NextResponse.json({error:"Incorrect username or password, or account inactive."},{status:401});
const response=NextResponse.json({user:{role:data.role,name:data.name,username:data.username}});
response.cookies.set("ward_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});return response;
}catch{return NextResponse.json({error:"Unable to sign in."},{status:500})}}
