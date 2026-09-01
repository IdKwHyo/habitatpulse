export function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.GOOGLE_MAPS_ID;

  if (!apiKey || !mapId) {
    return Response.json(
      { error: "Google Maps is not configured." },
      { status: 503 }
    );
  }

  return Response.json(
    { apiKey, mapId },
    {
      headers: {
        "Cache-Control": "public, max-age=300"
      }
    }
  );
}
