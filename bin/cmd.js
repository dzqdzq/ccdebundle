#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const {debundle} = require("../debundle");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: ccdebundle <indexjsPath> [outputDir]");
  process.exit(1);
}

const indexJsPathFromArg = args[0];
const OUTPUT_DIR = args[1] || "ccdebundle_output";

if (!fs.existsSync(indexJsPathFromArg)) {
  console.error( `${indexJsPathFromArg} does not exist`);
  console.error("Usage: ccdebundle <indexjsPath> [outputDir]");
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getScriptMeta(uuid, isPlugin = false) {
  return {
    ver: "1.0.8",
    uuid,
    isPlugin,
    loadPluginInWeb: true,
    loadPluginInNative: true,
    loadPluginInEditor: false,
    subMetas: {},
  };
}

function saveCode(filePath, code, uuid) {
  filePath = path.join(OUTPUT_DIR, filePath);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, code, "utf8");
  fs.writeFileSync(
    filePath + ".meta",
    JSON.stringify(getScriptMeta(uuid), null, 2),
    "utf8"
  );
}

debundle(indexJsPathFromArg, saveCode);
