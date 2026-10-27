# Homepage CSS
The homepage embeds the three shared stylesheets in their original cascade positions to avoid render-blocking stylesheet requests. Other pages keep using the cached external stylesheets.

After editing `retail/etuning.css`, `retail/tbk-brand.css`, or `retail/see-work.css`, run from the repository root:

```sh
node scripts/refresh-home-css.mjs
```

Commit the refreshed `retail/index.html` with the stylesheet edits. The script updates existing `data-home-css` blocks without changing surrounding page content or the order of styles.
