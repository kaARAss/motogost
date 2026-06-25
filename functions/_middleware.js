// Cloudflare Pages middleware.
// Вшивает фотку главного экрана (из content/hero.json) прямо в CSS
// ещё на сервере — чтобы старая картинка не мелькала при загрузке.
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Обрабатываем только главную страницу, остальное пропускаем как есть.
  if (path !== "/" && path !== "/index.html") {
    return next();
  }

  const response = await next();
  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return response;

  let html = await response.text();

  try {
    const heroRes = await fetch(new URL("/content/hero.json", url.origin).toString(), {
      cf: { cacheTtl: 0 },
    });
    if (heroRes.ok) {
      const data = await heroRes.json();
      if (data && data.image) {
        html = html.replace(/--hero:url\([^)]*\)/, '--hero:url("' + data.image + '")');
      }
      if (data && data.imageMobile) {
        html = html.replace(/--hero-m:url\([^)]*\)/, '--hero-m:url("' + data.imageMobile + '")');
      }
    }
  } catch (e) {
    // Если что-то пошло не так — отдаём исходный HTML без изменений.
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("cache-control", "no-cache");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
