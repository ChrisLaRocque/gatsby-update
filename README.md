# gatsby-update

## How to use

Meant to be run with `npx` when you want to get the latest of all your Gatsby plugins. `cd` into whereever your

```
npx gatsby-update
# or with flags
npx gatsby-update --tag next --excluded gatsby gatsby-plugin-vanilla-extract
```

Should be run in the root of your Gatsby site (wherever package.json is). Running `--tag next` requires Node 18.

### Options

#### `--tag latest | next`

Install the plugins `@latest` or `@next`. Defaults to `latest`.

#### `--excluded name-of-plugin or-several`

Plugins to exclude from the update. As noted above, the script aims to update `gatsby` and any package in package.json's `dependencies` that begins with `gatsby-`.

## What it does

You can obviously look at the logic in `src/index.ts` but TLDR of what goes on when you run the script:

1. Guess package manager to use based on lockfile in directory. Falls back to `npm`.
2. Remove previous lockfile(s) and `/node_modules`
3. Get `dependencies` from `package.json`, and filter for `gatsby` or any name starting with `gatsby-`. Remove `excluded` plugins if provided.
4. Run `npm install`/`yarn add` for each plugin in the filtered list at `latest`/`next`.
