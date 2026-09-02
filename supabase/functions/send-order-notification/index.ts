import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async () => {
  return new Response(
    JSON.stringify({
      message: "Ward Cosmetics notification function is working.",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
});