// Decap CMS GitHub OAuth — шаг 1: перенаправление на GitHub
export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  const redirectUri = origin + "/oauth/callback";
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "repo,user");
  authUrl.searchParams.set("state", crypto.randomUUID());
  return Response.redirect(authUrl.toString(), 302);
}
