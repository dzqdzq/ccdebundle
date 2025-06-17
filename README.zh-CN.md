# ccdebundle
[English](./README.md) | [中文](./README.zh-CN.md)

`ccdebundle` 是一个命令行工具，用于解包 Cocos Creator 2.x 项目生成的 `index.js` 文件

## 功能特性

-   解析 Cocos Creator 2.x 构建的 `index.js` 文件。
-   识别并提取独立的 JavaScript 模块。
-   为提取的模块重建原始文件路径。
-   将每个模块另存为输出目录中的独立 `.js` 文件。
-   为每个脚本生成相应的 `.meta` 文件

## 安装

要将 `ccdebundle` 用作命令行工具，您可以使用 npm 全局安装它：

```bash
npm install -g ccdebundle
```

## 使用方法

安装后，您可以从终端使用 `ccdebundle`：

```bash
ccdebundle <indexjsPath> [outputDir]
```

**参数说明：**

-   `<indexjsPath>`：（必需）Cocos Creator 2.x 项目生成的 `index.js` 文件的路径。
-   `[outputDir]`：（可选）解包文件将保存到的目录。如果未指定，则默认为当前工作目录中的 `ccdebundle_output`。

**示例：**

```bash
ccdebundle ./build/web-mobile/index.js unpacked_outputDir
```

## 许可证

MIT