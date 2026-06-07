"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setLog((l) => [...l, "USEEFFECT START"]);

    const run = async () => {
      setLog((l) => [...l, "ASYNC START"]);

      await new Promise((r) => setTimeout(r, 1000));

      setLog((l) => [...l, "ASYNC DONE"]);
    };

    run();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>TRACE</h1>
      {log.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}