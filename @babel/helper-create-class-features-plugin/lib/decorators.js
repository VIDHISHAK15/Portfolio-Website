"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var _core = require("@babel/core");
var _helperReplaceSupers = require("@babel/helper-replace-supers");
var _helperSplitExportDeclaration = require("@babel/helper-split-export-declaration");
var _helperSkipTransparentExpressionWrappers = require("@babel/helper-skip-transparent-expression-wrappers");
var _fields = require("./fields.js");
function incrementId(id, idx = id.length - 1) {
  if (idx === -1) {
    id.unshift(65);
    return;
  }
  const current = id[idx];
  if (current === 90) {
    id[idx] = 97;
  } else if (current === 122) {
    id[idx] = 65;
    incrementId(id, idx - 1);
  } else {
    id[idx] = current + 1;
  }
}
function createPrivateUidGeneratorForClass(classPath) {
  const currentPrivateId = [];
  const privateNames = new Set();
  classPath.traverse({
    PrivateName(path) {
      privateNames.add(path.node.id.name);
    }
  });
  return () => {
    let reifiedId;
    do {
      incrementId(currentPrivateId);
      reifiedId = String.fromCharCode(...currentPrivateId);
    } while (privateNames.has(reifiedId));
    return _core.types.privateName(_core.types.identifier(reifiedId));
  };
}
function createLazyPrivateUidGeneratorForClass(classPath) {
  let generator;
  return () => {
    if (!generator) {
      generator = createPrivateUidGeneratorForClass(classPath);
    }
    return generator();
  };
}
function replaceClassWithVar(path, className) {
  if (path.type === "ClassDeclaration") {
    const id = path.node.id;
    const className = id.name;
    const varId = path.scope.generateUidIdentifierBasedOnNode(id);
    const classId = _core.types.identifier(className);
    path.scope.rename(className, varId.name);
    path.get("id").replaceWith(classId);
    return {
      id: _core.types.cloneNode(varId),
      path
    };
  } else {
    let varId;
    if (path.node.id) {
      className = path.node.id.name;
      varId = path.scope.parent.generateDeclaredUidIdentifier(className);
      path.scope.rename(className, varId.name);
    } else {
      varId = path.scope.parent.generateDeclaredUidIdentifier(typeof className === "string" ? className : "decorated_class");
    }
    const newClassExpr = _core.types.classExpression(typeof className === "string" ? _core.types.identifier(className) : null, path.node.superClass, path.node.body);
    const [newPath] = path.replaceWith(_core.types.sequenceExpression([newClassExpr, varId]));
    return {
      id: _core.types.cloneNode(varId),
      path: newPath.get("expressions.0")
    };
  }
}
function generateClassProperty(key, value, isStatic) {
  if (key.type === "PrivateName") {
    return _core.types.classPrivateProperty(key, value, undefined, isStatic);
  } else {
    return _core.types.classProperty(key, value, undefined, undefined, isStatic);
  }
}
function addProxyAccessorsFor(className, element, originalKey, targetKey, version, isComputed, isStatic) {
  const thisArg = (version === "2023-11" || version === "2023-05") && isStatic ? className : _core.types.thisExpression();
  const getterBody = _core.types.blockStatement([_core.types.returnStatement(_core.types.memberExpression(_core.types.cloneNode(thisArg), _core.types.cloneNode(targetKey)))]);
  const setterBody = _core.types.blockStatement([_core.types.expressionStatement(_core.types.assignmentExpression("=", _core.types.memberExpression(_core.types.cloneNode(thisArg), _core.types.cloneNode(targetKey)), _core.types.identifier("v")))]);
  let getter, setter;
  if (originalKey.type === "PrivateName") {
    getter = _core.types.classPrivateMethod("get", _core.types.cloneNode(originalKey), [], getterBody, isStatic);
    setter = _core.types.classPrivateMethod("set", _core.types.cloneNode(originalKey), [_core.types.identifier("v")], setterBody, isStatic);
  } else {
    getter = _core.types.classMethod("get", _core.types.cloneNode(originalKey), [], getterBody, isComputed, isStatic);
    setter = _core.types.classMethod("set", _core.types.cloneNode(originalKey), [_core.types.identifier("v")], setterBody, isComputed, isStatic);
  }
  element.insertAfter(setter);
  element.insertAfter(getter);
}
function extractProxyAccessorsFor(targetKey, version) {
  if (version !== "2023-11" && version !== "2023-05" && version !== "2023-01") {
    return [_core.template.expression.ast`
        function () {
          return this.${_core.types.cloneNode(targetKey)};
        }
      `, _core.template.expression.ast`
        function (value) {
          this.${_core.types.cloneNode(targetKey)} = value;
        }
      `];
  }
  return [_core.template.expression.ast`
      o => o.${_core.types.cloneNode(targetKey)}
    `, _core.template.expression.ast`
      (o, v) => o.${_core.types.cloneNode(targetKey)} = v
    `];
}
function prependExpressionsToFieldInitializer(expressions, fieldPath) {
  const initializer = fieldPath.get("value");
  if (initializer.node) {
    expressions.push(initializer.node);
  } else if (expressions.length > 0) {
    expressions[expressions.length - 1] = _core.types.unaryExpression("void", expressions[expressions.length - 1]);
  }
  initializer.replaceWith(maybeSequenceExpression(expressions));
}
function prependExpressionsToStaticBlock(expressions, blockPath) {
  blockPath.unshiftContainer("body", _core.types.expressionStatement(maybeSequenceExpression(expressions)));
}
function prependExpressionsToConstructor(expressions, constructorPath) {
  constructorPath.node.body.body.unshift(_core.types.expressionStatement(maybeSequenceExpression(expressions)));
}
function isProtoInitCallExpression(expression, protoInitCall) {
  return _core.types.isCallExpression(expression) && _core.types.isIdentifier(expression.callee, {
    name: protoInitCall.name
  });
}
function optimizeSuperCallAndExpressions(expressions, protoInitLocal) {
  if (expressions.length >= 2 && isProtoInitCallExpression(expressions[1], protoInitLocal)) {
    const mergedSuperCall = _core.types.callExpression(_core.types.cloneNode(protoInitLocal), [expressions[0]]);
    expressions.splice(0, 2, mergedSuperCall);
  }
  if (expressions.length >= 2 && _core.types.isThisExpression(expressions[expressions.length - 1]) && isProtoInitCallExpression(expressions[expressions.length - 2], protoInitLocal)) {
    expressions.splice(expressions.length - 1, 1);
  }
  return maybeSequenceExpression(expressions);
}
function insertExpressionsAfterSuperCallAndOptimize(expressions, constructorPath, protoInitLocal) {
  constructorPath.traverse({
    CallExpression: {
      exit(path) {
        if (!path.get("callee").isSuper()) return;
        const newNodes = [path.node, ...expressions.map(expr => _core.types.cloneNode(expr))];
        if (path.isCompletionRecord()) {
          newNodes.push(_core.types.thisExpression());
        }
        path.replaceWith(optimizeSuperCallAndExpressions(newNodes, protoInitLocal));
        path.skip();
      }
    },
    ClassMethod(path) {
      if (path.node.kind === "constructor") {
        path.skip();
      }
    }
  });
}
function createConstructorFromExpressions(expressions, isDerivedClass) {
  const body = [_core.types.expressionStatement(maybeSequenceExpression(expressions))];
  if (isDerivedClass) {
    body.unshift(_core.types.expressionStatement(_core.types.callExpression(_core.types.super(), [_core.types.spreadElement(_core.types.identifier("args"))])));
  }
  return _core.types.classMethod("constructor", _core.types.identifier("constructor"), isDerivedClass ? [_core.types.restElement(_core.types.identifier("args"))] : [], _core.types.blockStatement(body));
}
function createStaticBlockFromExpressions(expressions) {
  return _core.types.staticBlock([_core.types.expressionStatement(maybeSequenceExpression(expressions))]);
}
const FIELD = 0;
const ACCESSOR = 1;
const METHOD = 2;
const GETTER = 3;
const SETTER = 4;
const STATIC_OLD_VERSION = 5;
const STATIC = 8;
const DECORATORS_HAVE_THIS = 16;
function getElementKind(element) {
  switch (element.node.type) {
    case "ClassProperty":
    case "ClassPrivateProperty":
      return FIELD;
    case "ClassAccessorProperty":
      return ACCESSOR;
    case "ClassMethod":
    case "ClassPrivateMethod":
      if (element.node.kind === "get") {
        return GETTER;
      } else if (element.node.kind === "set") {
        return SETTER;
      } else {
        return METHOD;
      }
  }
}
function toSortedDecoratorInfo(info) {
  return [...info.filter(el => el.isStatic && el.kind >= ACCESSOR && el.kind <= SETTER), ...info.filter(el => !el.isStatic && el.kind >= ACCESSOR && el.kind <= SETTER), ...info.filter(el => el.isStatic && el.kind === FIELD), ...info.filter(el => !el.isStatic && el.kind === FIELD)];
}
function generateDecorationList(decorators, decoratorsThis, version) {
  const decsCount = decorators.length;
  const haveOneThis = decoratorsThis.some(Boolean);
  const decs = [];
  for (let i = 0; i < decsCount; i++) {
    if ((version === "2023-11" || version === "2023-05") && haveOneThis) {
      decs.push(decoratorsThis[i] || _core.types.unaryExpression("void", _core.types.numericLiteral(0)));
    }
    decs.push(decorators[i]);
  }
  return {
    haveThis: haveOneThis,
    decs
  };
}
function generateDecorationExprs(decorationInfo, version) {
  return _core.types.arrayExpression(decorationInfo.map(el => {
    let flag = el.kind;
    if (el.isStatic) {
      flag += version === "2023-11" || version === "2023-05" ? STATIC : STATIC_OLD_VERSION;
    }
    if (el.decoratorsHaveThis) flag += DECORATORS_HAVE_THIS;
    return _core.types.arrayExpression([el.decoratorsArray, _core.types.numericLiteral(flag), el.name, ...(el.privateMethods || [])]);
  }));
}
function extractElementLocalAssignments(decorationInfo) {
  const localIds = [];
  for (const el of decorationInfo) {
    const {
      locals
    } = el;
    if (Array.isArray(locals)) {
      localIds.push(...locals);
    } else if (locals !== undefined) {
      localIds.push(locals);
    }
  }
  return localIds;
}
function addCallAccessorsFor(version, element, key, getId, setId, isStatic) {
  element.insertAfter(_core.types.classPrivateMethod("get", _core.types.cloneNode(key), [], _core.types.blockStatement([_core.types.returnStatement(_core.types.callExpression(_core.types.cloneNode(getId), version === "2023-11" && isStatic ? [] : [_core.types.thisExpression()]))]), isStatic));
  element.insertAfter(_core.types.classPrivateMethod("set", _core.types.cloneNode(key), [_core.types.identifier("v")], _core.types.blockStatement([_core.types.expressionStatement(_core.types.callExpression(_core.types.cloneNode(setId), version === "2023-11" && isStatic ? [_core.types.identifier("v")] : [_core.types.thisExpression(), _core.types.identifier("v")]))]), isStatic));
}
function movePrivateAccessor(element, key, methodLocalVar, isStatic) {
  let params;
  let block;
  if (element.node.kind === "set") {
    params = [_core.types.identifier("v")];
    block = [_core.types.expressionStatement(_core.types.callExpression(methodLocalVar, [_core.types.thisExpression(), _core.types.identifier("v")]))];
  } else {
    params = [];
    block = [_core.types.returnStatement(_core.types.callExpression(methodLocalVar, [_core.types.thisExpression()]))];
  }
  element.replaceWith(_core.types.classPrivateMethod(element.node.kind, _core.types.cloneNode(key), params, _core.types.blockStatement(block), isStatic));
}
function isClassDecoratableElementPath(path) {
  const {
    type
  } = path;
  return type !== "TSDeclareMethod" && type !== "TSIndexSignature" && type !== "StaticBlock";
}
function staticBlockToIIFE(block) {
  return _core.types.callExpression(_core.types.arrowFunctionExpression([], _core.types.blockStatement(block.body)), []);
}
function maybeSequenceExpression(exprs) {
  if (exprs.length === 0) return _core.types.unaryExpression("void", _core.types.numericLiteral(0));
  if (exprs.length === 1) return exprs[0];
  return _core.types.sequenceExpression(exprs);
}
function createFunctionExpressionFromPrivateMethod(node) {
  const {
    params,
    body,
    generator: isGenerator,
    async: isAsync
  } = node;
  return _core.types.functionExpression(undefined, params, body, isGenerator, isAsync);
}
function createSetFunctionNameCall(state, className) {
  return _core.types.callExpression(state.addHelper("setFunctionName"), [_core.types.thisExpression(), className]);
}
function createToPropertyKeyCall(state, propertyKey) {
  return _core.types.callExpression(state.addHelper("toPropertyKey"), [propertyKey]);
}
function createPrivateBrandCheckClosure(brandName) {
  return _core.types.arrowFunctionExpression([_core.types.identifier("_")], _core.types.binaryExpression("in", _core.types.cloneNode(brandName), _core.types.identifier("_")));
}
function usesFunctionContext(expression) {
  try {
    _core.types.traverseFast(expression, node => {
      if (_core.types.isThisExpression(node) || _core.types.isSuper(node) || _core.types.isIdentifier(node, {
        name: "arguments"
      }) || _core.types.isMetaProperty(node) && node.meta.name !== "import") {
        throw null;
      }
    });
    return false;
  } catch (_unused) {
    return true;
  }
}
function usesPrivateField(expression) {
  try {
    _core.types.traverseFast(expression, node => {
      if (_core.types.isPrivateName(node)) {
        throw null;
      }
    });
    return false;
  } catch (_unused2) {
    return true;
  }
}
function checkPrivateMethodUpdateError(path, decoratedPrivateMethods) {
  const privateNameVisitor = (0, _fields.privateNameVisitorFactory)({
    PrivateName(path, state) {
      if (!state.privateNamesMap.has(path.node.id.name)) return;
      const parentPath = path.parentPath;
      const parentParentPath = parentPath.parentPath;
      if (parentParentPath.node.type === "AssignmentExpression" && parentParentPath.node.left === parentPath.node || parentParentPath.node.type === "UpdateExpression" || parentParentPath.node.type === "RestElement" || parentParentPath.node.type === "ArrayPattern" || parentParentPath.node.type === "ObjectProperty" && parentParentPath.node.value === parentPath.node && parentParentPath.parentPath.type === "ObjectPattern" || parentParentPath.node.type === "ForOfStatement" && parentParentPath.node.left === parentPath.node) {
        throw path.buildCodeFrameError(`Decorated private methods are read-only, but "#${path.node.id.name}" is updated via this expression.`);
      }
    }
  });
  const privateNamesMap = new Map();
  for (const name of decoratedPrivateMethods) {
    privateNamesMap.set(name, null);
  }
  path.traverse(privateNameVisitor, {
    privateNamesMap: privateNamesMap
  });
}
function transformClass(path, state, constantSuper, version, className, propertyVisitor) {
  var _classDecorationsId;
  const body = path.get("body.body");
  const classDecorators = path.node.decorators;
  let hasElementDecorators = false;
  let hasComputedKeysSideEffects = false;
  let elemDecsUseFnContext = false;
  const generateClassPrivateUid = createLazyPrivateUidGeneratorForClass(path);
  const assignments = [];
  const scopeParent = path.scope.parent;
  const memoiseExpression = (expression, hint) => {
    const localEvaluatedId = scopeParent.generateDeclaredUidIdentifier(hint);
    assignments.push(_core.types.assignmentExpression("=", localEvaluatedId, expression));
    return _core.types.cloneNode(localEvaluatedId);
  };
  let protoInitLocal;
  let staticInitLocal;
  for (const element of body) {
    if (!isClassDecoratableElementPath(element)) {
      continue;
    }
    if (isDecorated(element.node)) {
      switch (element.node.type) {
        case "ClassProperty":
          propertyVisitor.ClassProperty(element, state);
          break;
        case "ClassPrivateProperty":
          propertyVisitor.ClassPrivateProperty(element, state);
          break;
        case "ClassAccessorProperty":
          propertyVisitor.ClassAccessorProperty(element, state);
          if (version === "2023-11") {
            break;
          }
        default:
          if (element.node.static) {
            var _staticInitLocal;
            (_staticInitLocal = staticInitLocal) != null ? _staticInitLocal : staticInitLocal = scopeParent.generateDeclaredUidIdentifier("initStatic");
          } else {
            var _protoInitLocal;
            (_protoInitLocal = protoInitLocal) != null ? _protoInitLocal : protoInitLocal = scopeParent.generateDeclaredUidIdentifier("initProto");
          }
          break;
      }
      hasElementDecorators = true;
      elemDecsUseFnContext || (elemDecsUseFnContext = element.node.decorators.some(usesFunctionContext));
    } else if (element.node.type === "ClassAccessorProperty") {
      propertyVisitor.ClassAccessorProperty(element, state);
      const {
        key,
        value,
        static: isStatic,
        computed
      } = element.node;
      const newId = generateClassPrivateUid();
      const newField = generateClassProperty(newId, value, isStatic);
      const keyPath = element.get("key");
      const [newPath] = element.replaceWith(newField);
      addProxyAccessorsFor(path.node.id, newPath, computed && !keyPath.isConstantExpression() ? memoiseExpression(createToPropertyKeyCall(state, key), "computedKey") : key, newId, version, computed, isStatic);
    }
    if ("computed" in element.node && element.node.computed) {
      hasComputedKeysSideEffects || (hasComputedKeysSideEffects = !scopeParent.isStatic(element.node.key));
    }
  }
  if (!classDecorators && !hasElementDecorators) {
    if (assignments.length > 0) {
      path.insertBefore(assignments.map(expr => _core.types.expressionStatement(expr)));
      path.scope.crawl();
    }
    return;
  }
  const elementDecoratorInfo = [];
  let constructorPath;
  const decoratedPrivateMethods = new Set();
  let classInitLocal, classIdLocal;
  let decoratorReceiverId = null;
  function handleDecoratorExpressions(expressions) {
    let hasSideEffects = false;
    let usesFnContext = false;
    const decoratorsThis = [];
    for (const expression of expressions) {
      let object;
      if ((version === "2023-11" || version === "2023-05") && _core.types.isMemberExpression(expression)) {
        if (_core.types.isSuper(expression.object)) {
          object = _core.types.thisExpression();
        } else if (scopeParent.isStatic(expression.object)) {
          object = _core.types.cloneNode(expression.object);
        } else {
          var _decoratorReceiverId;
          (_decoratorReceiverId = decoratorReceiverId) != null ? _decoratorReceiverId : decoratorReceiverId = scopeParent.generateDeclaredUidIdentifier("obj");
          object = _core.types.assignmentExpression("=", _core.types.cloneNode(decoratorReceiverId), expression.object);
          expression.object = _core.types.cloneNode(decoratorReceiverId);
        }
      }
      decoratorsThis.push(object);
      hasSideEffects || (hasSideEffects = !scopeParent.isStatic(expression));
      usesFnContext || (usesFnContext = usesFunctionContext(expression));
    }
    return {
      hasSideEffects,
      usesFnContext,
      decoratorsThis
    };
  }
  const willExtractSomeElemDecs = hasComputedKeysSideEffects || elemDecsUseFnContext || version !== "2023-11";
  let needsDeclaraionForClassBinding = false;
  let classDecorationsFlag = 0;
  let classDecorations = [];
  let classDecorationsId;
  if (classDecorators) {
    classInitLocal = scopeParent.generateDeclaredUidIdentifier("initClass");
    needsDeclaraionForClassBinding = path.isClassDeclaration();
    ({
      id: classIdLocal,
      path
    } = replaceClassWithVar(path, className));
    path.node.decorators = null;
    const decoratorExpressions = classDecorators.map(el => el.expression);
    const classDecsUsePrivateName = decoratorExpressions.some(usesPrivateField);
    const {
      hasSideEffects,
      decoratorsThis
    } = handleDecoratorExpressions(decoratorExpressions);
    const {
      haveThis,
      decs
    } = generateDecorationList(decoratorExpressions, decoratorsThis, version);
    classDecorationsFlag = haveThis ? 1 : 0;
    classDecorations = decs;
    if (hasSideEffects && willExtractSomeElemDecs || classDecsUsePrivateName) {
      classDecorationsId = memoiseExpression(_core.types.arrayExpression(classDecorations), "classDecs");
    }
  } else {
    if (!path.node.id) {
      path.node.id = path.scope.generateUidIdentifier("Class");
    }
    classIdLocal = _core.types.cloneNode(path.node.id);
  }
  let lastInstancePrivateName;
  let needsInstancePrivateBrandCheck = false;
  let fieldInitializerExpressions = [];
  let staticFieldInitializerExpressions = [];
  if (hasElementDecorators) {
    if (protoInitLocal) {
      const protoInitCall = _core.types.callExpression(_core.types.cloneNode(protoInitLocal), [_core.types.thisExpression()]);
      fieldInitializerExpressions.push(protoInitCall);
    }
    for (const element of body) {
      if (!isClassDecoratableElementPath(element)) {
        if (staticFieldInitializerExpressions.length > 0 && element.isStaticBlock()) {
          prependExpressionsToStaticBlock(staticFieldInitializerExpressions, element);
          staticFieldInitializerExpressions = [];
        }
        continue;
      }
      const {
        node
      } = element;
      const decorators = node.decorators;
      const hasDecorators = !!(decorators != null && decorators.length);
      const isComputed = "computed" in node && node.computed;
      let name = "computedKey";
      if (node.key.type === "PrivateName") {
        name = node.key.id.name;
      } else if (!isComputed && node.key.type === "Identifier") {
        name = node.key.name;
      }
      let decoratorsArray;
      let decoratorsHaveThis;
      if (hasDecorators) {
        const decoratorExpressions = decorators.map(d => d.expression);
        const {
          hasSideEffects,
          usesFnContext,
          decoratorsThis
        } = handleDecoratorExpressions(decoratorExpressions);
        const {
          decs,
          haveThis
        } = generateDecorationList(decoratorExpressions, decoratorsThis, version);
        decoratorsHaveThis = haveThis;
        decoratorsArray = decs.length === 1 ? decs[0] : _core.types.arrayExpression(decs);
        if (usesFnContext || hasSideEffects && willExtractSomeElemDecs) {
          decoratorsArray = memoiseExpression(decoratorsArray, name + "Decs");
        }
      }
      if (isComputed) {
        if (!element.get("key").isConstantExpression()) {
          node.key = memoiseExpression(createToPropertyKeyCall(state, node.key), "computedKey");
        }
      }
      const {
        key,
        static: isStatic
      } = node;
      const isPrivate = key.type === "PrivateName";
      const kind = getElementKind(element);
      if (isPrivate && !isStatic) {
        if (hasDecorators) {
          needsInstancePrivateBrandCheck = true;
        }
        if (_core.types.isClassPrivateProperty(node) || !lastInstancePrivateName) {
          lastInstancePrivateName = key;
        }
      }
      if (element.isClassMethod({
        kind: "constructor"
      })) {
        constructorPath = element;
      }
      let locals;
      if (hasDecorators) {
        let privateMethods;
        if (kind === ACCESSOR) {
          const {
            value
          } = element.node;
          const params = version === "2023-11" && isStatic ? [] : [_core.types.thisExpression()];
          if (value) {
            params.push(_core.types.cloneNode(value));
          }
          const newId = generateClassPrivateUid();
          const newFieldInitId = element.scope.parent.generateDeclaredUidIdentifier(`init_${name}`);
          const newValue = _core.types.callExpression(_core.types.cloneNode(newFieldInitId), params);
          const newField = generateClassProperty(newId, newValue, isStatic);
          const [newPath] = element.replaceWith(newField);
          if (isPrivate) {
            privateMethods = extractProxyAccessorsFor(newId, version);
            const getId = newPath.scope.parent.generateDeclaredUidIdentifier(`get_${name}`);
            const setId = newPath.scope.parent.generateDeclaredUidIdentifier(`set_${name}`);
            addCallAccessorsFor(version, newPath, key, getId, setId, isStatic);
            locals = [newFieldInitId, getId, setId];
          } else {
            addProxyAccessorsFor(path.node.id, newPath, key, newId, version, isComputed, isStatic);
            locals = [newFieldInitId];
          }
        } else if (kind === FIELD) {
          const initId = element.scope.parent.generateDeclaredUidIdentifier(`init_${name}`);
          const valuePath = element.get("value");
          const args = version === "2023-11" && isStatic ? [] : [_core.types.thisExpression()];
          if (valuePath.node) args.push(valuePath.node);
          valuePath.replaceWith(_core.types.callExpression(_core.types.cloneNode(initId), args));
          locals = [initId];
          if (isPrivate) {
            privateMethods = extractProxyAccessorsFor(key, version);
          }
        } else if (isPrivate) {
          const callId = element.scope.parent.generateDeclaredUidIdentifier(`call_${name}`);
          locals = [callId];
          const replaceSupers = new _helperReplaceSupers.default({
            constantSuper,
            methodPath: element,
            objectRef: classIdLocal,
            superRef: path.node.superClass,
            file: state.file,
            refToPreserve: classIdLocal
          });
          replaceSupers.replace();
          privateMethods = [createFunctionExpressionFromPrivateMethod(element.node)];
          if (kind === GETTER || kind === SETTER) {
            movePrivateAccessor(element, _core.types.cloneNode(key), _core.types.cloneNode(callId), isStatic);
          } else {
            const node = element.node;
            path.node.body.body.unshift(_core.types.classPrivateProperty(key, _core.types.cloneNode(callId), [], node.static));
            decoratedPrivateMethods.add(key.id.name);
            element.remove();
          }
        }
        let nameExpr;
        if (isComputed) {
          nameExpr = _core.types.cloneNode(key);
        } else if (key.type === "PrivateName") {
          nameExpr = _core.types.stringLiteral(key.id.name);
        } else if (key.type === "Identifier") {
          nameExpr = _core.types.stringLiteral(key.name);
        } else {
          nameExpr = _core.types.cloneNode(key);
        }
        elementDecoratorInfo.push({
          kind,
          decoratorsArray,
          decoratorsHaveThis,
          name: nameExpr,
          isStatic,
          privateMethods,
          locals
        });
        if (element.node) {
          element.node.decorators = null;
        }
      }
      if (fieldInitializerExpressions.length > 0 && !isStatic && (kind === FIELD || kind === ACCESSOR)) {
        prependExpressionsToFieldInitializer(fieldInitializerExpressions, element);
        fieldInitializerExpressions = [];
      }
      if (staticFieldInitializerExpressions.length > 0 && isStatic && (kind === FIELD || kind === ACCESSOR)) {
        prependExpressionsToFieldInitializer(staticFieldInitializerExpressions, element);
        staticFieldInitializerExpressions = [];
      }
      if (hasDecorators && version === "2023-11") {
        if (kind === FIELD || kind === ACCESSOR) {
          const initExtraId = scopeParent.generateDeclaredUidIdentifier(`init_extra_${name}`);
          locals.push(initExtraId);
          const initExtraCall = _core.types.callExpression(_core.types.cloneNode(initExtraId), isStatic ? [] : [_core.types.thisExpression()]);
          if (!isStatic) {
            fieldInitializerExpressions.push(initExtraCall);
          } else {
            staticFieldInitializerExpressions.push(initExtraCall);
          }
        }
      }
    }
  }
  if (fieldInitializerExpressions.length > 0) {
    const isDerivedClass = !!path.node.superClass;
    if (constructorPath) {
      if (isDerivedClass) {
        insertExpressionsAfterSuperCallAndOptimize(fieldInitializerExpressions, constructorPath, protoInitLocal);
      } else {
        prependExpressionsToConstructor(fieldInitializerExpressions, constructorPath);
      }
    } else {
      path.node.body.body.unshift(createConstructorFromExpressions(fieldInitializerExpressions, isDerivedClass));
    }
    fieldInitializerExpressions = [];
  }
  if (staticFieldInitializerExpressions.length > 0) {
    path.node.body.body.push(createStaticBlockFromExpressions(staticFieldInitializerExpressions));
    staticFieldInitializerExpressions = [];
  }
  const sortedElementDecoratorInfo = toSortedDecoratorInfo(elementDecoratorInfo);
  const elementDecorations = generateDecorationExprs(version === "2023-11" ? elementDecoratorInfo : sortedElementDecoratorInfo, version);
  const elementLocals = extractElementLocalAssignments(sortedElementDecoratorInfo);
  if (protoInitLocal) {
    elementLocals.push(protoInitLocal);
  }
  if (staticInitLocal) {
    elementLocals.push(staticInitLocal);
  }
  const classLocals = [];
  let classInitInjected = false;
  const classInitCall = classInitLocal && _core.types.callExpression(_core.types.cloneNode(classInitLocal), []);
  const originalClass = path.node;
  if (classDecorators) {
    classLocals.push(classIdLocal, classInitLocal);
    const statics = [];
    path.get("body.body").forEach(element => {
      if (element.isStaticBlock()) {
        staticFieldInitializerExpressions.push(staticBlockToIIFE(element.node));
        element.remove();
        return;
      }
      const isProperty = element.isClassProperty() || element.isClassPrivateProperty();
      if ((isProperty || element.isClassPrivateMethod()) && element.node.static) {
        if (isProperty && staticFieldInitializerExpressions.length > 0) {
          prependExpressionsToFieldInitializer(staticFieldInitializerExpressions, element);
          staticFieldInitializerExpressions = [];
        }
        element.node.static = false;
        statics.push(element.node);
        element.remove();
      }
    });
    if (statics.length > 0 || staticFieldInitializerExpressions.length > 0) {
      const staticsClass = _core.template.expression.ast`
        class extends ${state.addHelper("identity")} {}
      `;
      staticsClass.body.body = [_core.types.staticBlock([_core.types.toStatement(originalClass, true) || _core.types.expressionStatement(originalClass)]), ...statics];
      const constructorBody = [];
      const newExpr = _core.types.newExpression(staticsClass, []);
      if (staticFieldInitializerExpressions.length > 0) {
        constructorBody.push(...staticFieldInitializerExpressions);
      }
      if (classInitCall) {
        classInitInjected = true;
        constructorBody.push(classInitCall);
      }
      if (constructorBody.length > 0) {
        constructorBody.unshift(_core.types.callExpression(_core.types.super(), [_core.types.cloneNode(classIdLocal)]));
        staticsClass.body.body.push(createConstructorFromExpressions(constructorBody, false));
      } else {
        newExpr.arguments.push(_core.types.cloneNode(classIdLocal));
      }
      path.replaceWith(newExpr);
    }
  }
  if (!classInitInjected && classInitCall) {
    path.node.body.body.push(_core.types.staticBlock([_core.types.expressionStatement(classInitCall)]));
  }
  let {
    superClass
  } = originalClass;
  if (superClass && (version === "2023-11" || version === "2023-05")) {
    const id = path.scope.maybeGenerateMemoised(superClass);
    if (id) {
      originalClass.superClass = _core.types.assignmentExpression("=", id, superClass);
      superClass = id;
    }
  }
  originalClass.body.body.unshift(_core.types.staticBlock([_core.types.expressionStatement(createLocalsAssignment(elementLocals, classLocals, elementDecorations, (_classDecorationsId = classDecorationsId) != null ? _classDecorationsId : _core.types.arrayExpression(classDecorations), _core.types.numericLiteral(classDecorationsFlag), needsInstancePrivateBrandCheck ? lastInstancePrivateName : null, typeof className === "object" ? className : undefined, _core.types.cloneNode(superClass), state, version)), staticInitLocal && _core.types.expressionStatement(_core.types.callExpression(_core.types.cloneNode(staticInitLocal), [_core.types.thisExpression()]))].filter(Boolean)));
  path.insertBefore(assignments.map(expr => _core.types.expressionStatement(expr)));
  if (needsDeclaraionForClassBinding) {
    path.insertBefore(_core.types.variableDeclaration("let", [_core.types.variableDeclarator(_core.types.cloneNode(classIdLocal))]));
  }
  if (decoratedPrivateMethods.size > 0) {
    checkPrivateMethodUpdateError(path, decoratedPrivateMethods);
  }
  path.scope.crawl();
  return path;
}
function createLocalsAssignment(elementLocals, classLocals, elementDecorations, classDecorations, classDecorationsFlag, maybePrivateBrandName, setClassName, superClass, state, version) {
  let lhs, rhs;
  const args = [setClassName ? createSetFunctionNameCall(state, setClassName) : _core.types.thisExpression(), classDecorations, elementDecorations];
  {
    if (version !== "2023-11") {
      args.splice(1, 2, elementDecorations, classDecorations);
    }
    if (version === "2021-12" || version === "2022-03" && !state.availableHelper("applyDecs2203R")) {
      lhs = _core.types.arrayPattern([...elementLocals, ...classLocals]);
      rhs = _core.types.callExpression(state.addHelper(version === "2021-12" ? "applyDecs" : "applyDecs2203"), args);
      return _core.types.assignmentExpression("=", lhs, rhs);
    } else if (version === "2022-03") {
      rhs = _core.types.callExpression(state.addHelper("applyDecs2203R"), args);
    } else if (version === "2023-01") {
      if (maybePrivateBrandName) {
        args.push(createPrivateBrandCheckClosure(maybePrivateBrandName));
      }
      rhs = _core.types.callExpression(state.addHelper("applyDecs2301"), args);
    } else if (version === "2023-05") {
      if (maybePrivateBrandName || superClass || classDecorationsFlag.value !== 0) {
        args.push(classDecorationsFlag);
      }
      if (maybePrivateBrandName) {
        args.push(createPrivateBrandCheckClosure(maybePrivateBrandName));
      } else if (superClass) {
        args.push(_core.types.unaryExpression("void", _core.types.numericLiteral(0)));
      }
      if (superClass) args.push(superClass);
      rhs = _core.types.callExpression(state.addHelper("applyDecs2305"), args);
    }
  }
  if (version === "2023-11") {
    if (maybePrivateBrandName || superClass || classDecorationsFlag.value !== 0) {
      args.push(classDecorationsFlag);
    }
    if (maybePrivateBrandName) {
      args.push(createPrivateBrandCheckClosure(maybePrivateBrandName));
    } else if (superClass) {
      args.push(_core.types.unaryExpression("void", _core.types.numericLiteral(0)));
    }
    if (superClass) args.push(superClass);
    rhs = _core.types.callExpression(state.addHelper("applyDecs2311"), args);
  }
  if (elementLocals.length > 0) {
    if (classLocals.length > 0) {
      lhs = _core.types.objectPattern([_core.types.objectProperty(_core.types.identifier("e"), _core.types.arrayPattern(elementLocals)), _core.types.objectProperty(_core.types.identifier("c"), _core.types.arrayPattern(classLocals))]);
    } else {
      lhs = _core.types.arrayPattern(elementLocals);
      rhs = _core.types.memberExpression(rhs, _core.types.identifier("e"), false, false);
    }
  } else {
    lhs = _core.types.arrayPattern(classLocals);
    rhs = _core.types.memberExpression(rhs, _core.types.identifier("c"), false, false);
  }
  return _core.types.assignmentExpression("=", lhs, rhs);
}
function isProtoKey(node) {
  return node.type === "Identifier" ? node.name === "__proto__" : node.value === "__proto__";
}
function isDecorated(node) {
  return node.decorators && node.decorators.length > 0;
}
function shouldTransformElement(node) {
  switch (node.type) {
    case "ClassAccessorProperty":
      return true;
    case "ClassMethod":
    case "ClassProperty":
    case "ClassPrivateMethod":
    case "ClassPrivateProperty":
      return isDecorated(node);
    default:
      return false;
  }
}
function shouldTransformClass(node) {
  return isDecorated(node) || node.body.body.some(shouldTransformElement);
}
function NamedEvaluationVisitoryFactory(isAnonymous, visitor) {
  function handleComputedProperty(propertyPath, key, state) {
    switch (key.type) {
      case "StringLiteral":
        return _core.types.stringLiteral(key.value);
      case "NumericLiteral":
      case "BigIntLiteral":
        {
          const keyValue = key.value + "";
          propertyPath.get("key").replaceWith(_core.types.stringLiteral(keyValue));
          return _core.types.stringLiteral(keyValue);
        }
      default:
        {
          const ref = propertyPath.scope.maybeGenerateMemoised(key);
          propertyPath.get("key").replaceWith(_core.types.assignmentExpression("=", ref, createToPropertyKeyCall(state, key)));
          return _core.types.cloneNode(ref);
        }
    }
  }
  return {
    VariableDeclarator(path, state) {
      const id = path.node.id;
      if (id.type === "Identifier") {
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("init"));
        if (isAnonymous(initializer)) {
          const name = id.name;
          visitor(initializer, state, name);
        }
      }
    },
    AssignmentExpression(path, state) {
      const id = path.node.left;
      if (id.type === "Identifier") {
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("right"));
        if (isAnonymous(initializer)) {
          switch (path.node.operator) {
            case "=":
            case "&&=":
            case "||=":
            case "??=":
              visitor(initializer, state, id.name);
          }
        }
      }
    },
    AssignmentPattern(path, state) {
      const id = path.node.left;
      if (id.type === "Identifier") {
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("right"));
        if (isAnonymous(initializer)) {
          const name = id.name;
          visitor(initializer, state, name);
        }
      }
    },
    ObjectExpression(path, state) {
      for (const propertyPath of path.get("properties")) {
        const {
          node
        } = propertyPath;
        if (node.type !== "ObjectProperty") continue;
        const id = node.key;
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(propertyPath.get("value"));
        if (isAnonymous(initializer)) {
          if (!node.computed) {
            if (!isProtoKey(id)) {
              if (id.type === "Identifier") {
                visitor(initializer, state, id.name);
              } else {
                const className = _core.types.stringLiteral(id.value + "");
                visitor(initializer, state, className);
              }
            }
          } else {
            const ref = handleComputedProperty(propertyPath, id, state);
            visitor(initializer, state, ref);
          }
        }
      }
    },
    ClassPrivateProperty(path, state) {
      const {
        node
      } = path;
      const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("value"));
      if (isAnonymous(initializer)) {
        const className = _core.types.stringLiteral("#" + node.key.id.name);
        visitor(initializer, state, className);
      }
    },
    ClassAccessorProperty(path, state) {
      const {
        node
      } = path;
      const id = node.key;
      const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("value"));
      if (isAnonymous(initializer)) {
        if (!node.computed) {
          if (id.type === "Identifier") {
            visitor(initializer, state, id.name);
          } else if (id.type === "PrivateName") {
            const className = _core.types.stringLiteral("#" + id.id.name);
            visitor(initializer, state, className);
          } else {
            const className = _core.types.stringLiteral(id.value + "");
            visitor(initializer, state, className);
          }
        } else {
          const ref = handleComputedProperty(path, id, state);
          visitor(initializer, state, ref);
        }
      }
    },
    ClassProperty(path, state) {
      const {
        node
      } = path;
      const id = node.key;
      const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("value"));
      if (isAnonymous(initializer)) {
        if (!node.computed) {
          if (id.type === "Identifier") {
            visitor(initializer, state, id.name);
          } else {
            const className = _core.types.stringLiteral(id.value + "");
            visitor(initializer, state, className);
          }
        } else {
          const ref = handleComputedProperty(path, id, state);
          visitor(initializer, state, ref);
        }
      }
    }
  };
}
function isDecoratedAnonymousClassExpression(path) {
  return path.isClassExpression({
    id: null
  }) && shouldTransformClass(path.node);
}
function _default({
  assertVersion,
  assumption
}, {
  loose
}, version, inherits) {
  var _assumption;
  {
    if (version === "2023-11" || version === "2023-05" || version === "2023-01") {
      assertVersion("^7.21.0");
    } else if (version === "2021-12") {
      assertVersion("^7.16.0");
    } else {
      assertVersion("^7.19.0");
    }
  }
  const VISITED = new WeakSet();
  const constantSuper = (_assumption = assumption("constantSuper")) != null ? _assumption : loose;
  const namedEvaluationVisitor = NamedEvaluationVisitoryFactory(isDecoratedAnonymousClassExpression, visitClass);
  function visitClass(path, state, className) {
    var _className, _node$id;
    if (VISITED.has(path)) return;
    const {
      node
    } = path;
    (_className = className) != null ? _className : className = (_node$id = node.id) == null ? void 0 : _node$id.name;
    const newPath = transformClass(path, state, constantSuper, version, className, namedEvaluationVisitor);
    if (newPath) {
      VISITED.add(newPath);
      return;
    }
    VISITED.add(path);
  }
  return {
    name: "proposal-decorators",
    inherits: inherits,
    visitor: Object.assign({
      ExportDefaultDeclaration(path, state) {
        const {
          declaration
        } = path.node;
        if ((declaration == null ? void 0 : declaration.type) === "ClassDeclaration" && isDecorated(declaration)) {
          const isAnonymous = !declaration.id;
          const updatedVarDeclarationPath = (0, _helperSplitExportDeclaration.default)(path);
          if (isAnonymous) {
            visitClass(updatedVarDeclarationPath, state, _core.types.stringLiteral("default"));
          }
        }
      },
      ExportNamedDeclaration(path) {
        const {
          declaration
        } = path.node;
        if ((declaration == null ? void 0 : declaration.type) === "ClassDeclaration" && isDecorated(declaration)) {
          (0, _helperSplitExportDeclaration.default)(path);
        }
      },
      Class(path, state) {
        visitClass(path, state, undefined);
      }
    }, namedEvaluationVisitor)
  };
}

//# sourceMappingURL=decorators.js.map
