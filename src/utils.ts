let ui;

export function init (editorUi) {
  ui = editorUi;
}
export function linkStyle (url) {
  var linkElement = document.createElement('link');
  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', url);
  document.getElementsByTagName('head')[0].appendChild(linkElement);
}

export function _is (cell, name) {
  return (cell && cell.value && cell.value.getAttribute && (cell.value.getAttribute("type") == `awssf${name}`));
}
export function isAWSsf (cell) {
  return (cell && (cell.awssf != null)) && (cell.value && cell.value.getAttribute && cell.value.getAttribute("type") && cell.value.getAttribute("type").indexOf("awssf") == 0);
}
export function isAWSconfig (cell) {
  return _is(cell, 'AWSconfig');
}
export function isStart (cell) {
  return _is(cell, 'Start');
}
export function isEnd (cell) {
  return _is(cell, 'End');
}
export function isParallelChild (cell) {
  return (cell && cell.parent && cell.parent.awssf && _is(cell.parent, "Parallel"));
}
export function isMapChild (cell) {
  return (cell && cell.parent && cell.parent.awssf && _is(cell.parent, "Map"));
}
export function isParallel (cell) {
  return _is(cell, "Parralel");
}
export function isMap (cell) {
  return _is(cell, "Map");
}
export function isTask (cell) {
  return _is(cell, "Task");
}
export function isWait (cell) {
  return _is(cell, "Wait");
}
export function isNext (cell) {
  return _is(cell, "Next");
}
export function isStartAt (cell) {
  return _is(cell, "StartAt");
}
export function isRetry (cell) {
  return _is(cell, "Retry");
}
export function isCatch (cell) {
  return _is(cell, "Catch");
}
export function isChoice (cell) {
  return _is(cell, "Choice");
}
export function isDefault (cell) {
  return _is(cell, "Default");
}
export function createHandlerImage (cls, src) {
  var img = mxUtils.createImage(src);
  img.setAttribute('title', cls.prototype.type);
  img.style.cursor = 'pointer';
  img.style.width = '16px';
  img.style.height = '16px';
  mxEvent.addGestureListeners(img,
    mxUtils.bind(this, function (evt) {
      var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
      var edge = cls.prototype.create();
      this.graph.connectionHandler.start(this.state, pt.x, pt.y, new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge)));
      this.graph.isMouseDown = true;
      this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
      mxEvent.consume(evt);
    })
  );
  return img;
}
export function validateTimestamp (val) {
  if (!val) return null;
  return !!(val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/));
}
export function validateNumber (val) {
  if (!val) return null;
  return !!(val.match(/^\d+$/));
}
export function validateJson (val) {
  if (!val) return null;
  try {
    JSON.parse(val);
    return true;
  }catch(error) {
    return false;
  }
}
export function validateJsonPath (val) {
  if (!val) return null;
  return !!(val.match(/^\$/) && !val.match(/([@,:?[\]]|\.\.)/)) || (val == "null");
}
export function validateCommonAttributes (cell, res, checkResultPath) {
  if (!res) res = [];
  if (validateJsonPath(cell.getAttribute("input_path")) == false) {
    res.push("input_path MUST use only supported jsonpath");
  }
  if (validateJsonPath(cell.getAttribute("output_path")) == false) {
    res.push("output_path MUST use only supported jsonpath");
  }
  if (checkResultPath && (validateJsonPath(cell.getAttribute("result_path")) == false)) {
    res.push("result_path MUST use only supported jsonpath or null");
  }
  return res;
}
export function snakeToCamel (p) {
  p = p.charAt(0).toLowerCase() + p.slice(1);
  return p.replace(/_./g, function (s) { return s.charAt(1).toUpperCase();});
}
export function camelToSnake (p) {
  p = snakeToCamel(p);
  return p.replace(/([A-Z])/g, function (s) { return '_' + s.charAt(0).toLowerCase();});
}
// const ops = {
//   "==": "Equals",
//   "<": "LessThan",
//   ">": "GreaterThan",
//   "<=": "LessThanEquals",
//   ">=": "GreaterThanEquals"
// };

enum ops {
  "==" = "Equals",
  "<"  = "LessThan",
  ">"  = "GreaterThan",
  "<=" = "LessThanEquals",
  ">=" = "GreaterThanEquals"
}

export function parseJSEPObject (obj, res?) {
  if (res == null)
    res = [];
  if (obj.type == 'MemberExpression') {
    if (obj.computed) {
      res.unshift('[' + parseJSEPObject(obj.property) + ']');
    }else{
      res.unshift(parseJSEPObject(obj.property));
    }
    return parseJSEPObject(obj.object, res);
  } else if (obj.type == 'Identifier') {
    res.unshift(obj.name);
    return res.reduce((prev, cur) => {
      if (cur[0] == '[') {
        return prev + cur;
      }else{
        return prev + "." + cur;
      }
    });
  } else if (obj.type == 'Literal') {
    return obj.value;
  }
}
export function parseJSEPValue (obj) {
  return obj.value;
}
export function parseJSEPExpr (obj, res?) {
  if (res == null)
    res = {};
  if (obj.operator == '&&') {
    Object.assign(res, {And: [parseJSEPExpr(obj.left), parseJSEPExpr(obj.right)]});
  } else if (obj.operator == '||') {
    Object.assign(res, {Or: [parseJSEPExpr(obj.left), parseJSEPExpr(obj.right)]});
  } else if (obj.operator == '!') {
    Object.assign(res, {Not: parseJSEPExpr(obj.argument)});
  } else if (ops[obj.operator]) {
    var vartype;
    var varname = parseJSEPObject(obj.left);
    var val = parseJSEPValue(obj.right);
    if (typeof(val) == "number") {
      vartype = "Numeric";
    } else if (typeof(val) == "string") {
      if (val.match(/^["'][\d-]+T[\d:]+Z["']$/)) {
        vartype = "Timestamp";
      } else {
        vartype = "String";
      }
    } else if (typeof(val) == "boolean") {
      vartype = "Boolean";
    }
    var tmp= {
      Variable: varname
    };
    tmp[vartype + ops[obj.operator]] = val;
    Object.assign(res, tmp);
  }
  return res;
}
export function ruleToJSEP (choice) {
  var variable = choice.Variable;
  var ops = {
    And: "&&",
    Or: "||",
    Equals: "==",
    GreaterThan: ">",
    GreaterThanEquals: ">=",
    LessThan: "<",
    LessThanEquals: "<="
  };
  for (var key in choice) {
    var value = choice[key];
    if (key.match(/^(And|Or)$/)) {
      return value.map(ch => "(" + ruleToJSEP(ch) +")").join(" " + ops[key] + " ");
    } else if (key.match(/^(Not)$/)) {
      return "!(" + ruleToJSEP(value) + ")";
    } else {
      const m = key.match(/^(Boolean|Numeric|String|Timestamp)(Equals|GreaterThan|GreaterThanEquals|LessThan|LessThanEquals)$/);
      if (m) {
        if (m[1].match(/(String|Timestamp)/i)) {
          return [variable, ops[m[2]], '"' + value + '"'].join(" ");
        } else {
          return [variable, ops[m[2]], value].join(" ");
        }
      }
    }
  }
}
export function adjustJsonPath (val) {
  return (val === "null") ? null : val;
}
export function inCarlo () {
  return (typeof __updateAWSconfig !== "undefined") &&
    (typeof __describeStateMachine !== "undefined") &&
    (typeof __listStateMachines !== "undefined") &&
    (typeof __deployStateMachine !== "undefined");
}
export function isSupproted () {
  return inCarlo();
}


export function setupRoot () {
  if (!ui.editor.graph.getModel().cells) return;
  var cell = ui.editor.graph.getModel().getRoot();
  if (cell && (cell.value == null)) {
    cell.value = mxUtils.createXmlDocument().createElement('object');
    if (cell.getAttribute("type") == null) cell.setAttribute("type", "awssfRoot");
    if (cell.getAttribute("name") == null) cell.setAttribute("name", "");
    if (cell.getAttribute("comment") == null) cell.setAttribute("comment", "");
    if (cell.getAttribute("timeout_seconds") == null) cell.setAttribute("timeout_seconds", "");
    if (cell.getAttribute("version") == null) cell.setAttribute("version", "");
    if (cell.getAttribute("role_arn") == null) cell.setAttribute("role_arn", "");
    if (cell.getAttribute("state_machine_arn") == null) cell.setAttribute("state_machine_arn", "");
    cell.awssf = {};
  }
  return;
}

export function getStepFunctionDefinition () {
  var states = {};
  var model = ui.editor.graph.getModel();
  var startat = null;
  for(var i in model.cells) {
    var cell = model.cells[i];
    if (!isAWSsf(cell)) continue;
    if (isAWSconfig(cell)) continue;
    if (isParallelChild(cell)) continue;
    if (isMapChild(cell)) continue;
    if (isStartAt(cell)) {
      startat = model.cells[cell.target.id].getAttribute("label");
    }
    if (isStart(cell) || isEnd(cell)) continue;
    if (cell.isVertex()) {
      Object.assign(states, cell.awssf.expJSON(cell, model.cells));
    }
  }
  var root = model.getRoot();
  var data = {} as StepFunctionsDefinitions;
  if (root.getAttribute("comment"))
    data.Comment = root.getAttribute("comment");
  if (startat)
    data.StartAt = startat;
  data.States = states;
  if (root.getAttribute("timeout_seconds"))
    data.TimeoutSeconds = Number(root.getAttribute("timeout_seconds"));
  if (root.getAttribute("version"))
    data.Version = root.getAttribute("version");
  return data;
}


export function setupAWSconfig () {
  var codec = new mxCodec();
  var model = ui.editor.graph.getModel();
  var node = codec.encode(model);
  var found = mxUtils.findNode(node, "type", "awssfAWSconfig");
  if (found == null) {
    //mxUtils.alert("You need to put a AWSconfig.")
    return false;
  }
  var awsconfig = codec.decode(found);
  var params = {accessKeyId: awsconfig.getAttribute('accessKeyId'), secretAccessKey: awsconfig.getAttribute('secretAccessKey'), region: awsconfig.getAttribute('region')};
  AWS.config.update(params);
  if (typeof __updateAWSconfig !== "undefined") {
    __updateAWSconfig(params);
  }
  return true;
}

export function getCallerIdentity (callback) {
  var sts = new AWS.STS({apiVersion: '2011-06-15'});
  sts.getCallerIdentity({}, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else callback(data);
  });
}

export const awsServiceParameters = {
  "arn:aws:states:::lambda:invoke" : [
    "ClientContext",
    "FunctionName",
    "InvocationType",
    "Qualifier",
    "Payload",
  ],
  "arn:aws:states:::batch:submitJob": [
    "ArrayProperties",
    "ContainerOverrides",
    "DependsOn",
    "JobDefinition",
    "JobName",
    "JobQueue",
    "Parameters",
    "RetryStrategy",
    "Timeout"
  ],
  "arn:aws:states:::dynamodb:getItem": [
    "Key",
    "TableName",
    "AttributesToGet",
    "ConsistentRead",
    "ExpressionAttributeNames",
    "ProjectionExpression",
    "ReturnConsumedCapacity",
  ],
  "arn:aws:states:::dynamodb:putItem": [
    "Item",
    "TableName",
    "ConditionalOperator",
    "ConditionExpression",
    "Expected",
    "ExpressionAttributeNames",
    "ExpressionAttributeValues",
    "ReturnConsumedCapacity",
    "ReturnItemCollectionMetrics",
    "ReturnValues"
  ],
  "arn:aws:states:::dynamodb:deleteItem": [
    "Key",
    "TableName",
    "ConditionalOperator",
    "ConditionExpression",
    "Expected",
    "ExpressionAttributeNames",
    "ExpressionAttributeValues",
    "ReturnConsumedCapacity",
    "ReturnItemCollectionMetrics",
    "ReturnValues",
  ],
  "arn:aws:states:::dynamodb:updateItem": [
    "Key",
    "TableName",
    "AttributeUpdates",
    "ConditionalOperator",
    "ConditionExpression",
    "Expected",
    "ExpressionAttributeNames",
    "ExpressionAttributeValues",
    "ReturnConsumedCapacity",
    "ReturnItemCollectionMetrics",
    "ReturnValues",
    "UpdateExpression"
  ],
  "arn:aws:states:::ecs:runTask": [
    "Cluster",
    "Group",
    "LaunchType",
    "NetworkConfiguration",
    "Overrides",
    "PlacementConstraints",
    "PlacementStrategy",
    "PlatformVersion",
    "TaskDefinition"
  ],
  "arn:aws:states:::sns:publish": [
    "Message",
    "MessageAttributes",
    "MessageStructure",
    "PhoneNumber",
    "Subject",
    "TargetArn",
    "TopicArn",
  ],
  "arn:aws:states:::sqs:sendMessage": [
    "DelaySeconds",
    "MessageAttribute",
    "MessageBody",
    "MessageDeduplicationId",
    "MessageGroupId",
    "QueueUrl"
  ],
  "arn:aws:states:::glue:startJobRun": [
    "JobName",
    "JobRunId",
    "Arguments",
    "AllocatedCapacity",
    "Timeout",
    "SecurityConfiguration",
    "NotificationProperty"
  ],
  "arn:aws:states:::states:startExecution": [
    "input",
    "name",
    "stateMachineArn"
  ]
};

export function getResourceList (callback) {
  // https://docs.aws.amazon.com/step-functions/latest/dg/connect-supported-services.html
  var funclist = [
    "arn:aws:states:::lambda:invoke",
    "arn:aws:states:::lambda:invoke.waitForTaskToken",
    "arn:aws:states:::batch:submitJob",
    "arn:aws:states:::batch:submitJob.sync",
    "arn:aws:states:::dynamodb:updateItem",
    "arn:aws:states:::dynamodb:putItem",
    "arn:aws:states:::dynamodb:getItem",
    "arn:aws:states:::dynamodb:deleteItem",
    "arn:aws:states:::ecs:runTask",
    "arn:aws:states:::ecs:runTask.sync",
    "arn:aws:states:::ecs:runTask.waitForTaskToken",
    "arn:aws:states:::sns:publish",
    "arn:aws:states:::sns:publish.waitForTaskToken",
    "arn:aws:states:::sqs:sendMessage",
    "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
    "arn:aws:states:::glue:startJobRun",
    "arn:aws:states:::glue:startJobRun.sync",
    // https://docs.aws.amazon.com/step-functions/latest/dg/connect-sagemaker.html
    "arn:aws:states:::sagemaker:createEndpoint",
    "arn:aws:states:::sagemaker:createEndpoint.sync",
    "arn:aws:states:::sagemaker:createEndpointConfig",
    "arn:aws:states:::sagemaker:createEndpointConfig.sync",
    "arn:aws:states:::sagemaker:createHyperParameterTuningJob",
    "arn:aws:states:::sagemaker:createHyperParameterTuningJob.sync",
    "arn:aws:states:::sagemaker:createLabelingJob",
    "arn:aws:states:::sagemaker:createLabelingJob.sync",
    "arn:aws:states:::sagemaker:createModel",
    "arn:aws:states:::sagemaker:createModel.sync",
    "arn:aws:states:::sagemaker:createTrainingJob",
    "arn:aws:states:::sagemaker:createTrainingJob.sync",
    "arn:aws:states:::sagemaker:createTransformJob",
    "arn:aws:states:::sagemaker:createTransformJob.sync",
    "arn:aws:states:::sagemaker:updateEndpoint",
    "arn:aws:states:::sagemaker:updateEndpoint.sync",
    // https://docs.aws.amazon.com/step-functions/latest/dg/connect-emr.html
    "arn:aws:states:::elasticmapreduce:createCluster",
    "arn:aws:states:::elasticmapreduce:createCluster.sync",
    "arn:aws:states:::elasticmapreduce:setClusterTerminationProtection",
    "arn:aws:states:::elasticmapreduce:terminateCluster",
    "arn:aws:states:::elasticmapreduce:terminateCluster.sync",
    "arn:aws:states:::elasticmapreduce:addStep.sync",
    "arn:aws:states:::elasticmapreduce:cancelStep",
    "arn:aws:states:::elasticmapreduce:modifyInstanceFleetByName",
    "arn:aws:states:::elasticmapreduce:modifyInstanceGroupByName",
    "arn:aws:states:::states:startExecution",
    "arn:aws:states:::states:startExecution.sync",
    "arn:aws:states:::states:startExecution.waitForTaskToken",
  ];
  if (!setupAWSconfig()) return callback(funclist);
  // var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
  // stepfunctions.listActivities({}, function(err, data){
  //   if (err) console.log(err, err.stack); // an error occurred
  //   else{
  //     for(var i in data.activities){
  //       var act = data.activities[i];
  //       funclist.push(func.activityArn);
  //     }
  //   };
  var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
  lambda.listFunctions({}, function (err,data) {
    if (err) console.log(err, err.stack); // an error occurred
    else{
      for(var i in data.Functions) {
        var func = data.Functions[i];
        funclist.push(func.FunctionArn);
      }
      callback(funclist);
    }
  });
  // });
}

