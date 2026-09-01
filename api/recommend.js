import { POST } from "../app/api/recommend/route.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const forwardedRequest = new Request(
    `https://${request.headers.host}/api/recommend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body || {})
    }
  );

  const result = await POST(forwardedRequest);
  const body = await result.text();

  response
    .status(result.status)
    .setHeader("Content-Type", "application/json")
    .send(body);
}
