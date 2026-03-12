/**
 * POST /api/auth/google
 * Accepts POST with body: { idToken: string }
 * Proxies to Express backend or returns success to fix 405.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = typeof body?.idToken === "string" ? body.idToken.trim() : "";
    if (!idToken) {
      return Response.json(
        { error: "idToken gerekli" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const backendUrl =
      process.env.VITE_API_BASE ||
      process.env.API_BASE ||
      process.env.BACKEND_URL ||
      "http://localhost:3006";
    const url = `${backendUrl.replace(/\/$/, "")}/api/auth/google`;

    const backendRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await backendRes.json().catch(() => ({}));
    return Response.json(data, {
      status: backendRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json(
      { error: "Google auth failed", message },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET /api/auth/google - return 405 with clear message (use POST).
 */
export async function GET() {
  return Response.json(
    {
      error: "Method Not Allowed",
      message: "Use POST with body: { idToken: \"...\" }",
    },
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
}
