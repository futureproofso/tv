## usage
```
npm install
npm run start
```

## dev

rollup bundles js and namespaces variables to prevent conflicts. it doesn't use require statements, it just merges the js, so the js file stays fast when loaded.

grunt merges the html pages into a single page that gets loaded into index.html