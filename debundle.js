const fs = require("fs");
const acorn = require("acorn");
const escodegen = require("escodegen");
const getAllFilePath = require("./getjspath");
const { getBodyNoRF } = require("./getBodyNoRF");

function getImportTable(dependencyMap) {
  const importTable = {};
  for (const moduleName in dependencyMap) {
    const { dependencies } = dependencyMap[moduleName];
    importTable[moduleName] = { ...dependencies };
  }
  return importTable;
}

function debundle(indexjs, savecb) {
  const content = fs.readFileSync(indexjs, "utf-8");
  const ast = acorn.parse(content, {
    ecmaVersion: 2020,
    sourceType: "script",
  });

  let modulesObject = null; // 第一个参数
  let emptyObject = null; // 第二个参数 {}
  let entryModulesArray = null; // 第三个参数 [file1, file2, file3]

  for (const node of ast.body) {
    // 检查是否是表达式语句
    if (node.type === "ExpressionStatement") {
      const expr = node.expression;

      // 检查是否是window.__require赋值表达式
      if (
        expr.type === "AssignmentExpression" &&
        expr.left.type === "MemberExpression" &&
        expr.left.object.name === "window" &&
        expr.left.property.name === "__require"
      ) {
        // 提取IIFE的参数
        if (
          expr.right.type === "CallExpression" &&
          expr.right.callee.type === "FunctionExpression"
        ) {
          const args = expr.right.arguments;
          if (args.length === 3) {
            modulesObject = args[0];
            emptyObject = args[1];
            entryModulesArray = args[2];
            break; // 找到目标后立即退出循环
          }
        }
      }
    }
  }

  if (!modulesObject || !emptyObject || !entryModulesArray) {
    console.error("无法解析window.__require函数的参数");
    process.exit(1);
  }

  // 解析模块定义对象
  const dependencyMap = {};
  if (modulesObject.type === "ObjectExpression") {
    modulesObject.properties.forEach((prop) => {
      if (prop.value.elements.length !== 2) {
        throw new Error("模块定义对象格式不正确");
      }
      if (
        prop.value.type === "ArrayExpression" &&
        prop.value.elements[0].type === "FunctionExpression" &&
        prop.value.elements[1].type === "ObjectExpression"
      ) {
        const moduleName =
          prop.key.type === "Identifier" ? prop.key.name : prop.key.value;

        // 解析依赖对象
        const dependencies = {};
        prop.value.elements[1].properties.forEach((depProp) => {
          const relativePath =
            depProp.key.type === "Identifier"
              ? depProp.key.name
              : depProp.key.value;
          const targetModule =
            depProp.value.type === "Identifier"
              ? depProp.value.name
              : depProp.value.value;
          dependencies[relativePath] = targetModule;
        });

        dependencyMap[moduleName] = {
          functionAst: prop.value.elements[0], // function (e, t, i)
          dependencies,
        };
      }
    });
  }

  // 存储每个模块的文件路径{'ScoreSheetWin':'src/ScoreSheetWin.js'}
  const modFilePathMap = getAllFilePath(getImportTable(dependencyMap));

  // 遍历entryModulesArray
  for (const moduleName in modFilePathMap) {
    const { functionAst } = dependencyMap[moduleName];
    const filePath = modFilePathMap[moduleName];
    const noRFAst = getBodyNoRF(functionAst);
    savecb(filePath, escodegen.generate(noRFAst), noRFAst.__uuid__);
  }
}

module.exports = {
  debundle,
};
