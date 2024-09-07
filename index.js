var _ = require("lodash");
var jexl = require("jexl");

var currentLoopItem;
var globalModel;

function make(mapping, model) {
  const jsonMapping = {
    mapping,
    model,
  };

  globalModel = model;

  var obj = [];

  _.mapKeys(mapping, async (value, key) => {
    checkKeyType(key, value, obj, mapping, model);
  });

  console.log(obj);

  return obj;
}

function checkKeyType(key, value, obj, customDataOption, model) {
  let varType = key.split(":");
  let o;
  let datasource;
  let mapping;
  let data;

  if (varType.length === 1) {
    varType[1] = "string";
  }

  let valueKey = _.get(customDataOption, key);

  switch (varType[1]) {
    case "int":
      obj[varType[0]] = Number(_.get(model, valueKey));
      break;
    case "float":
      obj[varType[0]] = parseFloat(_.get(model, valueKey));
      break;
    case "string":
      let val = String(_.get(model, valueKey));

      obj[varType[0]] = val;
      break;
    case "bool":
      obj[varType[0]] = Boolean(_.get(model, valueKey));
      break;
    case "raw":
      obj[varType[0]] = valueKey;
      break;
    case "object":
      obj[varType[0]] = {};

      datasource = valueKey.datasource;
      mapping = valueKey.mapping;

      data = model[datasource];

      o = {};

      _.mapKeys(mapping, (value, key) => {
        checkKeyType(key, value, o, mapping, data);
      });

      obj[varType[0]] = o;

      break;
    case "array":
      obj[varType[0]] = [];

      datasource = valueKey.datasource;
      mapping = valueKey.mapping;

      data = model[datasource];

      data.forEach((dataItem, index) => {
        o = [];

        iterateArray(dataItem, mapping, o);

        obj[varType[0]].push(o);
      });

      break;
    case "custom":
      obj[varType[0]] = [];

      o = [];

      _.mapKeys(valueKey, (value, key) => {
        checkKeyType(key, value, o, valueKey, globalModel);
      });

      obj[varType[0]] = o;

      break;
    case "customArray":
      obj[varType[0]] = [];

      _.mapKeys(valueKey, (value, key) => {
        o = [];

        _.mapKeys(value, (v, k) => {
          checkKeyType(k, v, o, value, model);
        });

        obj[varType[0]].push(o);
      });

      break;
    case "expr":
      obj[varType[0]] = [];

      let vars = _.get(valueKey, "vars");
      let expr = _.get(valueKey, "expr");

      let context = {};
      _.mapKeys(vars, (value, key) => {
        context[key] = _.get(model, value);
      });

      const res = jexl.evalSync(expr, context);

      obj[varType[0]] = res;

      break;
  }

  return obj;
}

function iterateArray(dataItem, mapping, o) {
  Object.keys(mapping).forEach((keyMap) => {
    currentLoopItem = dataItem;

    checkKeyType(keyMap, dataItem[keyMap], o, mapping, dataItem);
  });
}

// make(
//   // mapping
//   {
//     // "e:expr": {
//     //   vars: {
//     //     o: "obj",
//     //   },
//     //   expr: "o.t",
//     // },
//     "s:string": "array.0.b",
//     // "number:int": "teste",
//     // "boolean:bool": "val",
//     // "float:float": "val2",
//     // "raw:string": "raw",
//     // "o:object": {
//     //   datasource: "obj",
//     //   mapping: {
//     //     "a:string": "t",
//     //   },
//     // },
//     // "a:array": {
//     //   datasource: "array",
//     //   mapping: {
//     //     "b:string": "b",
//     //     "c:int": "c",
//     //   },
//     // },
//     // "m:custom": {
//     //   "g:string": "obj.t",
//     //   "f:string": "teste",
//     // },
//     // "n:customArray": [
//     //   {
//     //     "g:string": "obj.t",
//     //     "f:string": "teste",
//     //   },
//     // ],
//   },
//   // model
//   {
//     teste: 123,
//     val: false,
//     val2: 1.0,
//     raw: "123213",
//     obj: {
//       t: "teste nested",
//     },
//     array: [
//       {
//         b: "teste arr",
//         c: 1232,
//       },
//       {
//         b: "teste arr 2",
//         c: 1,
//       },
//     ],
//   }
// );

module.exports = make;