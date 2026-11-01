# SnowClient News (admin website + API)

Same idea as the partners site. A small Cloudflare Pages project that lets you post news with a
landscape image, a title and a 2-line description, shown on the launcher's Home page. No launcher rebuild needed.

* `index.html`                  - admin page (password protected): add / edit / remove posts
* `functions/api/news.js`       - public list the launcher reads
* `functions/api/admin/news.js` - protected add / edit / delete
* `functions/api/image/[id].js` - serves each post's image

## Deploy
1. Put the `news-admin` folder in a GitHub repo (can be private).
2. Cloudflare -> Workers & Pages -> Create -> Pages -> Connect to Git. Project name: `snowclient-news`
   (gives `snowclient-news.pages.dev`). Framework: None, no build command, output directory `/`.
3. Storage & Databases -> KV -> Create namespace `snowclient-news`.
4. Pages project -> Settings -> Bindings -> Add -> KV namespace. Variable name: `NEWS`.
5. Settings -> Variables and Secrets -> add secret `ADMIN_PASSWORD` (long and strong).
6. Redeploy. Open `https://snowclient-news.pages.dev`, log in, add your first post.

The launcher reads `https://snowclient-news.pages.dev/api/news`.
