const path = require("path");
const SRC = "src/";

function computeBasePath(path1, path2) {
  const path1Parts = path1.split("/");
  const path2Parts = path2.split("/");
  let wilrdCardCount = 0;
  while (path2Parts.length) {
    const name = path2Parts.pop();
    const name2 = path1Parts[path1Parts.length - 1];
    if (name === "..") {
      wilrdCardCount++;
    } else if (name === ".") {
      continue;
    } else if (name === name2) {
      path1Parts.pop();
    } else {
      throw new Error("Invalid path");
    }
  }
  const basePath = path1Parts.join("/") + "/";
  return basePath + "*/".repeat(wilrdCardCount);
}

function resolvePath(basePath, relativePath) {
  // 移除basePath中的src/前缀（如果存在）
  const baseWithoutSrc = basePath.startsWith(SRC)
    ? basePath.slice(SRC.length)
    : basePath;

  const isFile = path.extname(baseWithoutSrc) === ".js";
  const baseDir = isFile ? path.dirname(baseWithoutSrc) : baseWithoutSrc;
  const fullPath = path.normalize(path.join(baseDir, relativePath));
  const finalPath = path.join(SRC, fullPath);
  return finalPath.replace(/\/+/g, "/");
}

function getDependencyChain(importTable, moduleName) {
  const dependencyChain = [];
  for (const [module, deps] of Object.entries(importTable)) {
    for (const [depPath, depModule] of Object.entries(deps)) {
      if (depModule === moduleName) {
        dependencyChain.push([module, depPath]);
      }
    }
  }
  return dependencyChain;
}

function sortDependencyChain(chain) {
  chain.sort((aPath, bPath) => {
    const a = aPath[1];
    const b = bPath[1];

    const aSegments = a.split("/").filter((p) => p !== "." && p !== "..");
    const bSegments = b.split("/").filter((p) => p !== "." && p !== "..");

    // 1. 比较有效路径长度（长的优先）
    const aLen = aSegments.length;
    const bLen = bSegments.length;
    if (aLen !== bLen) return bLen - aLen;

    // 2. 比较..数量（少的优先）
    const aParentCount = (a.match(/\.\.\//g) || []).length;
    const bParentCount = (b.match(/\.\.\//g) || []).length;
    if (aParentCount !== bParentCount) return aParentCount - bParentCount;

    // 3. 字典序排序
    return a.localeCompare(b);
  });
}

function getFilePath(importTable, moduleName, cache) {
  const moduleNameMap = {}; // 存储正在处理的模块

  function _getFilePath(moduleName) {
    if(cache[moduleName]){
      return cache[moduleName];
    }
    moduleNameMap[moduleName] = true;
    // 第一步：收集所有依赖目标模块的路径（转换为二维数组）
    let dependencyChain = getDependencyChain(importTable, moduleName);

    // 如果没有依赖关系，直接返回默认路径
    if (dependencyChain.length === 0) {
      const deps = importTable[moduleName];
      for (const [depPath, depModule] of Object.entries(deps)) {
        if (moduleNameMap[depModule]) {
          continue;
        }
        if (depPath.startsWith("..")) {
          continue;
        }
        const ret = _getFilePath(depModule);
        const basePath = computeBasePath(ret, depPath + ".js");
        return `${basePath}/${moduleName}.js`;
      }
      return `${SRC}/${moduleName}.js`;
    }

    sortDependencyChain(dependencyChain);

    let ret = "";
    // 第三步：路径遍历构建
    for (const [currentModule, currentDepPath] of dependencyChain) {
      ret = resolvePath(_getFilePath(currentModule), currentDepPath);
      if (ret.startsWith(SRC)) {
        return ret + ".js";
      }
      moduleNameMap[currentModule] = false;
    }
    moduleNameMap[moduleName] = false;
    throw new Error("Invalid dependency chain:" + moduleName);
  }

  return _getFilePath(moduleName).replace(/\/+/g, "/");
}

function getAllFilePath(importTable) {
  const ret = {};
  Object.keys(importTable).forEach((moduleName) => {
    ret[moduleName] = getFilePath(importTable, moduleName, ret);
  });
  return ret;
}

module.exports = getAllFilePath;