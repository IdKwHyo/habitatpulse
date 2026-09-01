import { GET } from "../app/api/maps-config/route.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const result = GET();
  const body = await result.text();

  response
    .status(result.status)
    .setHeader("Content-Type", "application/json")
    .send(body);
}
