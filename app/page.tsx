"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("START");

  useEffect(() => {
    async function test() {
      try {
        setStatus("STEP 1: JS OK");

        const res = await fetch("https://httpbin.org/get");
        setStatus("STEP 2: FETCH OK");

        const json = await res.json();
        console.log(json);

        setStatus("STEP 3: SUPABASE TEST START");

        const mod = await import("@/lib/supabase");
        console.log(mod.supabase);

        setStatus("STEP 4: SUPABASE IMPORT OK");
      } catch (e) {
        console.log(e);
        setStatus("ERROR");
      }
    }

    test();
  }, []);

  return (
    <div style={{ padding: 20, color: "white", background: "#000", minHeight: "100vh" }}>
      <h1>DEBUG MODE</h1>
      <p>{status}</p>
    </div>
  );
}