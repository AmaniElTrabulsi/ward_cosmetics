"use client";
import { useEffect, useState } from "react";

type BadgeNavigator = Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
export default function AppIconBadge({ count }: { count: number }) {
  const [message,setMessage]=useState("");
  useEffect(()=>{const nav=navigator as BadgeNavigator;if(!nav.setAppBadge)return;void (count>0?nav.setAppBadge(count):nav.clearAppBadge?.());},[count]);
  async function enable(){
    const nav=navigator as BadgeNavigator;
    if(!nav.setAppBadge){setMessage("This device does not support PWA icon badges.");return;}
    if("Notification" in window && Notification.permission==="default"){
      const permission=await Notification.requestPermission();
      if(permission!=="granted"){setMessage("Allow notifications for Ward Cosmetics to show the badge on your iPhone Home Screen.");return;}
    }
    if("Notification" in window && Notification.permission!=="granted"){
      setMessage("Enable notifications for Ward Cosmetics in your device settings to show the icon badge.");return;
    }
    try{if(count>0)await nav.setAppBadge(count);else await nav.clearAppBadge?.();setMessage("App icon badge enabled.");}catch{setMessage("Could not update the app icon badge on this device.");}
  }
  return <div className="app-badge-control"><button onClick={enable} type="button">Enable app icon badge</button>{message&&<small role="status">{message}</small>}<style jsx>{`.app-badge-control{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.app-badge-control button{border:1px solid #e7ddd3;background:#fffdfa;color:#65444b;border-radius:10px;padding:8px 11px;font-size:11px;font-weight:750;cursor:pointer}.app-badge-control small{font-size:11px;color:#8b7d76}`}</style></div>;
}
