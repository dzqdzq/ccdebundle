const {getLongUUID} = require("./uuid-utils");

/**
 * 提取函数体中cc._RF.push和cc._RF.pop之间的内容，返回新的AST
 * @param {Object} functionAst - 函数的AST节点
 * @returns {Object} - 包含cc._RF.push和cc._RF.pop之间语句的新AST节点
 */
function getBodyNoRF(functionAst) {
    // 确保传入的是函数AST
    if (!functionAst || !functionAst.body || !functionAst.body.body) {
        console.error('传入的AST不是有效的函数AST');
        return null;
    }

    const statements = functionAst.body.body;
    let pushIndex = -1;
    let popIndex = -1;
    let shortUUID = '';
    // 查找push和pop语句的索引
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        
        // 检查是否是表达式语句
        if (stmt.type === 'ExpressionStatement' && stmt.expression) {
            // 检查是否包含cc._RF.push或cc._RF.pop调用
            const expr = stmt.expression;
            
            // 处理函数调用
            if (expr.type === 'CallExpression' && expr.callee && expr.callee.type === 'MemberExpression') {
                const callee = expr.callee;
                
                // 检查是否是cc._RF.push或cc._RF.pop
                if (callee.object && callee.object.type === 'MemberExpression' && 
                    callee.object.object && callee.object.object.name === 'cc' && 
                    callee.object.property && callee.object.property.name === '_RF') {
                    
                    if (callee.property && callee.property.name === 'push') {
                        pushIndex = i;
                        shortUUID = expr.arguments[1].value;
                    } else if (callee.property && callee.property.name === 'pop') {
                        popIndex = i;
                        break; // 找到pop后就可以停止了
                    }
                }
            }
        }
    }

    // 如果找到了push和pop语句
    if (pushIndex !== -1 && popIndex !== -1 && pushIndex < popIndex) {
        // 提取push和pop之间的语句
        const contentStatements = statements.slice(pushIndex + 1, popIndex);
        
        // 创建一个新的Program节点，包含提取出的语句
        return {
            type: 'Program',
            body: contentStatements,
            sourceType: 'script',
            __uuid__: getLongUUID(shortUUID)
        };
    }

    console.warn('未能在函数体中找到cc._RF.push和cc._RF.pop语句');
    return null;
}

module.exports = {
    getBodyNoRF
}