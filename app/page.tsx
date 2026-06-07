"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("START");
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        setStatus("STEP 1: SUPABASE CALL START");

        const { data, error } = await supabase
          .from("products")
          .select("*");

        if (error) {
          throw error;
        }

        setStatus("SUCCESS: " + (data?.length || 0) + " products");
      } catch (e: any) {
        console.log("REAL ERROR:", e);
        setError(JSON.stringify(e, null, 2));
        setStatus("FAILED");
      }
    }

    run();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>PROD DEBUG</h1>
      <p>{status}</p>

      {error && (
        <pre style={{ color: "red" }}>
          {error}
        </pre>
      )}
    </div>
  );
}