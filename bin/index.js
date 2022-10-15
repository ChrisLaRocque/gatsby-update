#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cwd = process.cwd();
const yargs_1 = __importDefault(require("yargs"));
const node_child_process_1 = require("node:child_process");
const chalk_1 = __importDefault(require("chalk"));
// Use lockfile to determine if we should use npm or yarn
function getLockFile(cwd) {
    try {
        if (fs_1.default.existsSync(path_1.default.resolve(cwd, "package-lock.json"))) {
            console.log(`Found a ${chalk_1.default.yellow("package-lock.json")} file, using ${chalk_1.default.green("npm")}`);
            return "npm";
        }
        else if (fs_1.default.existsSync(path_1.default.resolve(cwd, "yarn.lock"))) {
            console.log(`Found a ${chalk_1.default.yellow("yarn.lock")} file, using ${chalk_1.default.green("yarn")}`);
            return "yarn";
        }
        else {
            console.log(`Could not find a lockfile from npm or yarn, using ${chalk_1.default.green("npm")}`);
            return "npm";
        }
    }
    catch (err) {
        console.error(`Error reading the filesystem, using ${chalk_1.default.green("npm")}`, err);
        return "npm";
    }
}
// Delete node_modules, package-lock.json, and yarn.lock
function removePrevDeps() {
    console.log(`${chalk_1.default.red("Removing")} node_modules, package-lock.json, and yarn.lock if any exist.`);
    try {
        fs_1.default.rmSync(path_1.default.resolve(cwd, "node_modules"), {
            recursive: true,
            force: true,
        });
    }
    catch (err) {
        console.error("Error removing node_modules", err);
    }
    try {
        fs_1.default.rmSync(path_1.default.resolve(cwd, "yarn.lock"), {
            recursive: true,
            force: true,
        });
    }
    catch (err) {
        console.error("Error removing yarn.lock", err);
    }
    try {
        fs_1.default.rmSync(path_1.default.resolve(cwd, "package-lock.json"), {
            recursive: true,
            force: true,
        });
    }
    catch (err) {
        console.error("Error removing package-lock.json", err);
    }
}
// Return package.json file contents
function getPackageJSON(cwd) {
    const data = fs_1.default.readFileSync(path_1.default.resolve(cwd, "package.json"), "utf8");
    return JSON.parse(data);
}
/**
 * Filter dependencies in package.json for their gatsby-ness
 * @param {Object} packageJSON - The output of getPackageJSON above.
 * @param {Array.<string>} excluded - passed from run()
 * @return {Array.string} List of packages to update, removing excluded names if applicable.
 */
function getGatsbyPlugins(packageJSON, excluded) {
    const deps = [...Object.keys(packageJSON.dependencies)].filter((pluginName) => pluginName === "gatsby" || pluginName.startsWith("gatsby-"));
    if (excluded.length) {
        const excludedDeps = deps.filter((dep) => excluded.indexOf(dep) === -1);
        console.log(`All packages minus ${chalk_1.default.green("excluded")}`, excludedDeps);
        return excludedDeps;
    }
    console.log(`Found the following ${chalk_1.default.hex("#663399")("Gatsby")} packages in package.json:\n`, deps);
    return deps;
}
/**
 * Wrap everything up in a function to control flow
 * @param {string} tag - 'latest' or 'next
 * @param {Array.<string>} excluded - Names of packages to exclude, some don't use `next` tag.
 */
function run(tag = "latest", excluded = []) {
    // Return early if not using node v18
    const major = process.versions.node.split(".")[0];
    if (major != "18") {
        console.error(`${chalk_1.default.red("Error:")} Gatsby 5 requires node v18`);
        return;
    }
    const packageManager = getLockFile(cwd); // Determine whether to use yarn or npm
    // Actually run npm install or yarn add
    function installPlugins(plugins, tag) {
        const join = plugins.join(`@${tag} `);
        // const buildCommand = {
        //   npm: `npm install ${join} --legacy-peer-deps`,
        //   yarn: `yarn add ${join}`,
        // }[packageManager];
        const buildCommand = (packageManager) => {
            switch (packageManager) {
                case "npm":
                    return `npm install ${join} --legacy-peer-deps`;
                case "yarn":
                    return `yarn add ${join}`;
                default:
                    return `npm install ${join} --legacy-peer-deps`;
            }
        };
        console.log(`Installing plugins found in package.json at ${chalk_1.default.green(`${tag}`)}`);
        return (0, node_child_process_1.exec)(buildCommand(packageManager), (error, stdout, stderr) => {
            if (error) {
                console.error(`Error updating`);
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(stdout);
        });
    }
    removePrevDeps(); // Remove old lockfiles + node_modules
    const plugins = getGatsbyPlugins(getPackageJSON(cwd), excluded || []); // Get Gatsby packages from package.json
    installPlugins(plugins, tag); // u already kno
}
const flags = (0, yargs_1.default)(process.argv.slice(2))
    .options({
    tag: { type: "string", default: "latest" },
    excluded: { alias: "exclude", type: "array", default: [] },
})
    .parseSync();
const { tag, excluded } = flags;
run(tag, excluded);
// run("next", ["gatsby-plugin-vanilla-extract"])
