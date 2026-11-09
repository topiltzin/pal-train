/** Public domain-verification value for the OpenAI app submission. It is not a secret. */
const OPENAI_APPS_CHALLENGE = "GyBGGQPYRHEDunWG4cy68OB_cjH8Ycpxsbe5bpnoOKE";

export function GET(): Response {
  return new Response(OPENAI_APPS_CHALLENGE, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
