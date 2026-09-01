import habitatDocument from "../index.html?raw";

export function GET() {
  return new Response(habitatDocument, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
