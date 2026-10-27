# Homepage first paint
The homepage embeds etuning.css, tbk-brand.css and see-work.css in their original cascade positions. Its existing mobile navigation initializer runs before main content is parsed so earlier styling does not cause the header to collapse after first paint. Without JavaScript the original navigation links remain visible.

After editing those stylesheets or the navigation initializer in retail/ask-keith.js, run from the repository root:

```sh
node scripts/refresh-home-css.mjs
```

Commit the refreshed retail/index.html with the shared source edits. Other pages continue to use the external stylesheets and shared script.
