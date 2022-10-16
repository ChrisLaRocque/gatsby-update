# gatsby-update

## How to use

Meant to be run with `npx` when you want to get the latest of all your Gatsby plugins. `cd` into whereever your

```
npx gatsby-update
```

You need to be using node 18

### Options

#### `--tag latest | next`

Install the plugins `@latest` or `@next`. Defaults to `latest`

#### `--excluded name-of-plugin or-several`

Plugins to exclude from the update. As noted above, the script aims to update `gatsby` and any package in package.json's `dependencies` that begins with `gatsby-`.

## What it does

You can obviously look at the logic in `src/index.ts` but TLDR of what goes on when you run the script:

1. Guess package manager based on lockfile in directory
