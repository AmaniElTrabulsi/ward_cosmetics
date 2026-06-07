"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [state, setState] = useState("INIT");

  useEffect(() => {
    console.log("USE EFFECT RAN");
    setState("EFFECT RAN");
  }, []);

  return (
    <div style={{ padding: 20, color: "white", background: "#000", minHeight: "100vh" }}>
      <h1>WARD TEST</h1>
      <p>{state}</p>
    </div>
  );
}