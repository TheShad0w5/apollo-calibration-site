# Retail asset generation

Edit `source-assets/tune-intake.js`, then regenerate the deployed file from the repository root:

```sh
npx --yes esbuild@0.25.12 source-assets/tune-intake.js --minify --target=es2020 --outfile=retail/tune-intake.js
```

Commit both files. The static deployment serves the generated file; it requires no build-time dependencies. Update the script version in `retail/shop.html` when behavior changes.
