# andy.bigwhitebox.org

Source for **[andy.bigwhitebox.org](https://andy.bigwhitebox.org)** — Andy Szybalski's personal site.

## How it works

This is a plain static site served directly by GitHub Pages from the `master`
branch (the custom domain lives in `CNAME`). There is **no build step**,
bundler, or package manager — just HTML, CSS, and some JSON/image assets. Edit
the files and push; GitHub Pages redeploys automatically.

- The homepage (`index.html`) is styled with [Tailwind](https://tailwindcss.com/) loaded from a CDN.
- `zoom/` uses a single static Bootstrap 4 stylesheet (`vendor/bootstrap/css/bootstrap.min.css`) for layout.
- Other sections live in their own folders: `portfolio/`, `resume/`, `onionmap/`, `art/`, `maps/`.

## Local preview

Open `index.html` directly in a browser, or serve the folder statically:

```bash
python3 -m http.server
```

Then visit http://localhost:8000.

## License

Content is © Andy Szybalski. The site was originally bootstrapped from the
MIT-licensed [Start Bootstrap – Scrolling Nav](https://startbootstrap.com/templates/scrolling-nav/)
template; see `LICENSE`.
