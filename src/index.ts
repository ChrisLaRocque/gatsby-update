#! /usr/bin/env node
import fs from "fs";
import path from "path";

const cwd = process.cwd();
import yargs from "yargs";

import { exec } from "node:child_process";

import chalk from "chalk";
type PackageJSON = {
  dependencies: object;
  version: string;
};
// Use lockfile to determine if we should use npm or yarn
function getLockFile(cwd: string): string {
  try {
    if (fs.existsSync(path.resolve(cwd, "package-lock.json"))) {
      console.log(
        `Found a package-lock.json file, using ${chalk.green("npm")}`
      );
      return "npm";
    } else if (fs.existsSync(path.resolve(cwd, "yarn.lock"))) {
      console.log(`Found a yarn.lock file, using ${chalk.green("yarn")}`);
      return "yarn";
    } else {
      console.log(
        `Could not find a lockfile from npm or yarn, using ${chalk.green(
          "npm"
        )}`
      );
      return "npm";
    }
  } catch (err) {
    console.error(
      `Error reading the filesystem, using ${chalk.green("npm")}`,
      err
    );
    return "npm";
  }
}

// Delete node_modules, package-lock.json, and yarn.lock
function removePrevDeps() {
  console.log(
    `${chalk.red(
      "Removing"
    )} node_modules, package-lock.json, and yarn.lock if any exist.`
  );
  try {
    fs.rmSync(path.resolve(cwd, "node_modules"), {
      recursive: true,
      force: true,
    });
  } catch (err) {
    console.error("Error removing node_modules", err);
  }
  try {
    fs.rmSync(path.resolve(cwd, "yarn.lock"), {
      recursive: true,
      force: true,
    });
  } catch (err) {
    console.error("Error removing yarn.lock", err);
  }
  try {
    fs.rmSync(path.resolve(cwd, "package-lock.json"), {
      recursive: true,
      force: true,
    });
  } catch (err) {
    console.error("Error removing package-lock.json", err);
  }
}

// Return package.json file contents
function getPackageJSON(cwd: string): PackageJSON {
  try {
    const data = fs.readFileSync(path.resolve(cwd, "package.json"), "utf8");
    return JSON.parse(data);
  } catch (err: unknown) {
    console.error("Error reading package.json in this directory.");
    throw new Error();
  }
}
function packageJSONExists() {
  return fs.existsSync(path.resolve(cwd, "package.json"));
}
/**
 * Filter dependencies in package.json for their gatsby-ness
 * @param {Object} packageJSON - The output of getPackageJSON above.
 * @param {Array.<string>} excluded - passed from run()
 * @return {Array.string} List of packages to update, removing excluded names if applicable.
 */
function getGatsbyPlugins(
  packageJSON: PackageJSON,
  excluded: string[]
): string[] {
  const deps = [...Object.keys(packageJSON.dependencies)].filter(
    (pluginName) => pluginName === "gatsby" || pluginName.startsWith("gatsby-")
  );
  if (excluded.length) {
    const excludedDeps = deps.filter((dep) => excluded.indexOf(dep) === -1);
    console.log(
      `${chalk.hex("#663399")("Gatsby")} packages minus ${chalk.yellow(
        "excluded"
      )}`,
      excludedDeps
    );
    return excludedDeps;
  }
  console.log(
    `Found the following ${chalk.hex("#663399")(
      "Gatsby"
    )} packages in package.json:\n`,
    deps
  );
  return deps;
}

/**
 * Wrap everything up in a function to control flow
 * @param {string} tag - 'latest' or 'next
 * @param {Array.<string>} excluded - Names of packages to exclude, some don't use `next` tag.
 */
function run(tag = "latest", excluded = []) {
  if (!packageJSONExists()) {
    console.error(`${chalk.red("Error:")} no package.json in this directory`);
    return;
  }
  // Return early if not using node v18
  const major = process.versions.node.split(".")[0];
  if (tag === "next" && major != "18") {
    console.error(`${chalk.red("Error:")} Gatsby 5 requires node v18`);
    return;
  }
  const packageManager = getLockFile(cwd); // Determine whether to use yarn or npm

  // Actually run npm install or yarn add
  function installPlugins(plugins: string[], tag: string) {
    const join = plugins.join(`@${tag} `);
    const buildCommand = (packageManager: string) => {
      switch (packageManager) {
        case "npm":
          return `npm install ${join} --legacy-peer-deps`;
        case "yarn":
          return `yarn add ${join}`;
        default:
          return `npm install ${join} --legacy-peer-deps`;
      }
    };
    console.log(
      `${chalk.green(
        "Installing"
      )} plugins found in package.json at ${chalk.green(`${tag}`)}`
    );
    return exec(buildCommand(packageManager), (error, stdout, stderr) => {
      if (error) {
        console.error(`Error updating`);
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(stdout);
    });
  }
  removePrevDeps(); // Remove old lockfiles + node_modules
  console.log(`${chalk.yellow("Excluding:")}`, excluded);
  const plugins = getGatsbyPlugins(getPackageJSON(cwd), excluded || []); // Get Gatsby packages from package.json
  installPlugins(plugins, tag); // u already kno
}
const flags = yargs(process.argv.slice(2))
  .options({
    tag: { type: "string", default: "latest", choices: ["latest", "next"] },
    excluded: { alias: "exclude", type: "array", default: [] },
  })
  .parseSync();

const { tag, excluded } = flags;
run(tag, excluded);
// run("next", ["gatsby-plugin-vanilla-extract"])
