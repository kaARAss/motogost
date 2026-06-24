// Decap CMS GitHub OAuth — шаг 2: обмен кода на токен и возврат в админку
export async function onRequestGet(context) {
  const { env, request } = context;
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return new Response("Нет параметра ?code от GitHub", { status: 400 });
  }
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code: code,
    }),
  });
  const result = await tokenResp.json();
  const status = result.error ? "error" : "success";
  const payload = result.error
    ? { error: result.error_description || result.error }
    : { token: result.access_token, provider: "github" };
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
(function(){
  var data = ${JSON.stringify(payload)};
  var message = "authorization:github:${status}:" + JSON.stringify(data);
  function receive(e){
    if(!window.opener){return;}
    window.opener.postMessage(message, e.origin);
    window.removeEventListener("message", receive, false);
  }
  window.addEventListener("message", receive, false);
  if(window.opener){ window.opener.postMessage("authorizing:github", "*"); }
})();
</script>
<p>Готово. Можно закрыть это окно.</p>
</body></html>`;
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
