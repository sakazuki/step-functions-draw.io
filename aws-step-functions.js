awssfUtils = {
  isAWSsf: function(cell){
    return (cell && cell.value && cell.value.getAttribute("type") && cell.value.getAttribute("type").indexOf("awssf") == 0) && (cell.awssf != null);
  },
  isAWSconfig: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfAWSconfig"));
  },
  isStart: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfStart"));
  },
  isEnd: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfEnd"));
  },
  isParallelChild: function(cell){
    return (cell && cell.parent && cell.parent.value && (cell.parent.value.getAttribute("type") == "awssfParallel"));
  },
  isParallel: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfParralel"));
  },
  isTask: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfTask"));
  },
  isWait: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfWait"));
  },
  isNext: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfNext"));
  },
  isStartAt: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfStartAt"));
  },
  isRetry: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfRetry"));
  },
  isCatch: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfCatch"));
  },
  isChoice: function(cell){
    return (cell && cell.value && (cell.value.getAttribute("type") == "awssfChoice"));
  }
}

function registCodec(func){
  var codec = new mxObjectCodec(new func());
  codec.encode = function(enc, obj){
    try{
      var data = enc.document.createElement(func.name);
    }catch(e){

    }
    return data
  };
  codec.decode = function(dec, node, into){
    return new func();
  };
  mxCodecRegistry.register(codec);
}

function createPoint(awssf, state, geometry){
  var label = state.prototype.type;
  if (geometry == null) geometry = new mxGeometry(0, 0, 40, 40); 
  var cell = new mxCell(label, geometry,'ellipse;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;');
  cell.vertex = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', label);
  cell.setAttribute('type', 'awssf' + label);
  cell.awssf = awssf;
  return cell;
}

StartPoint = function(){};
StartPoint.prototype.type = 'Start';
StartPoint.prototype.create = function(geometry){
  var cell = createPoint(this, StartPoint, geometry);
  return cell;
}
StartPoint.prototype.create_default_edge = function(){
  return NextEdge.prototype.create("StartAt");
}

EndPoint = function(){};
EndPoint.prototype.type = 'End';
EndPoint.prototype.create = function(){
  var cell = createPoint(this, EndPoint);
  return cell;
}

function createAWSconfig(){
  var cell = new mxCell('AWSconfig', new mxGeometry(0, 0, 70, 46), 'dashed=0;html=1;shape=mxgraph.aws2.non-service_specific.cloud;strokeColor=none;');
  cell.vertex = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', '');  
  cell.setAttribute('type', 'awssfAWSconfig');  
  cell.setAttribute('accessKeyId', '');
  cell.setAttribute('secretAccessKey', '');
  cell.setAttribute('region', '');
  cell.awssf = {};
  return cell;
}

function createState(awssf, state){
  var label = state.prototype.type;  
  var cell = new mxCell(label, new mxGeometry(0, 0, 80, 40),'rounded=1;whiteSpace=wrap;html=1;gradientColor=none;dashed=1');
  cell.vertex = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', label);
  cell.setAttribute('type', 'awssf' + label);
  cell.setAttribute('comment', '');
  cell.setAttribute('input_path', '');
  cell.setAttribute('output_path', '');
  cell.awssf = awssf;
  return cell;
}

PassState = function(){};
PassState.prototype.type = 'Pass';
PassState.prototype.create = function(){
  var cell = createState(this, PassState);
  cell.value.setAttribute('result', '');
  cell.value.setAttribute('result_path', '');
  return cell;
}
PassState.prototype.create_default_edge = function(src){
  for (var i in src.edges){
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return null;
  }
  return NextEdge.prototype.create();
}
PassState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Pass",
    Resource: cell.getAttribute("resource")
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = cell.getAttribute("input_path");
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = cell.getAttribute("output_path");
  if (cell.getAttribute("result_path"))
    data[label].ResultPath = cell.getAttribute("result_path");
  if (cell.getAttribute("result"))
    data[label].Result = cell.getAttribute("result");
  var exist_outgoing_edge = false;
  for(var i in cell.edges){
    var edge = cell.edges[i];
    if (edge.source != cell) continue;
    exist_outgoing_edge = true;
    if (edge.awssf.toJSON){
      Object.assign(data[label], edge.awssf.toJSON(edge, cells)) 
    }
  }
  if (exist_outgoing_edge == false || data[label].Next == 'End'){
    delete data[label]['Next'];
    data[label]["End"] = true;
  }
  return data;
};
registCodec(PassState);

TaskState = function(){};
TaskState.prototype.type = 'Task';
TaskState.prototype.create = function(){
  var cell = createState(this, TaskState);
  cell.setAttribute('resource', 'arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME');
  cell.setAttribute('timeout_seconds', 60);
  cell.setAttribute('heartbeat_seconds', '');
  cell.setAttribute('result_path', '');
  return cell;
}
TaskState.prototype.create_default_edge = function(src){
  for (var i in src.edges){
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return CatchEdge.prototype.create();
  }  
  return NextEdge.prototype.create();
}
TaskState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Task",
    Resource: cell.getAttribute("resource")
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = cell.getAttribute("input_path");
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = cell.getAttribute("output_path");
  if (cell.getAttribute("result_path"))
    data[label].ResultPath = cell.getAttribute("result_path");
  if (cell.getAttribute("timeout_seconds"))
    data[label].TimeoutSeconds = Number(cell.getAttribute("timeout_seconds"));
  if (cell.getAttribute("heartbeat_seconds"))
    data[label].HeartbeatSeconds = Number(cell.getAttribute("heartbeat_seconds"));

  var exist_outgoing_edge = false;
  for(var i in cell.edges){
    var edge = cell.edges[i];
    if (edge.source != cell) continue;
    exist_outgoing_edge = true;
    if (edge.awssf && edge.awssf.toJSON){
      if (awssfUtils.isRetry(edge)){
        if (!data[label]["Retry"]) data[label]["Retry"] = [];
        data[label]["Retry"].push(edge.awssf.toJSON(edge, cells));
      }
      else if (awssfUtils.isCatch(edge)){
        if (!data[label]["Catch"]) data[label]["Catch"] = [];
        data[label]["Catch"].push(edge.awssf.toJSON(edge, cells));
      }else{
        Object.assign(data[label], edge.awssf.toJSON(edge, cells)) 
      }
    }
  }
  if (exist_outgoing_edge == false || data[label].Next == 'End'){
    delete data[label]['Next'];
    data[label]["End"] = true;
  }
  return data;
};
registCodec(TaskState);

ChoiceState = function(){};
ChoiceState.prototype.type = 'Choice';
ChoiceState.prototype.create = function(){
  var cell = createState(this, ChoiceState);
  cell.setAttribute('choices', '');
  cell.setAttribute('default', '');
  return cell;
}
ChoiceState.prototype.create_default_edge = function(){
  return ChoiceEdge.prototype.create();
}
ChoiceState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Choice",
    Comment: cell.getAttribute("comment"),
    Choices: []
  };
  if (cell.getAttribute("input_path"))
    data[label].InputPath = cell.getAttribute("input_path");
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = cell.getAttribute("output_path");

  for(var i in cell.edges){
    var edge = cell.edges[i];
    if (edge.source != cell) continue;      
    if (awssfUtils.isChoice(edge)){
      if (edge.awssf.toJSON)
        data[label].Choices.push(edge.awssf.toJSON(edge, cells))
    }
    else if (awssfUtils.isNext(edge)){
      data[label].Default = cells[edge.target.id].getAttribute("label");
    }
  }
  return data;
};
registCodec(ChoiceState);

WaitState = function(){};
WaitState.prototype.type = 'Wait';
WaitState.prototype.create = function(){
  var cell = createState(this, WaitState);  
  cell.setAttribute('seconds', '');
  return cell; 
}
WaitState.prototype.create_default_edge = function(src){
  for (var i in src.edges){
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return null;
  }
  return NextEdge.prototype.create();
}
WaitState.prototype.cst = {
  DURATION_FORMAT: ["Seconds", "SecondsPath", "Timestamp", "TimestampPath"]
};
WaitState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Wait"
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = cell.getAttribute("input_path");
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = cell.getAttribute("output_path");

  var options = this.cst.DURATION_FORMAT;
  for(var j in options){
    var key = options[j].toLowerCase();
    if (cell.getAttribute(key)){
      if (cell.getAttribute(key).match(/^\d+/)){
        data[label][options[j]] = Number(cell.getAttribute(key));
      }else{
        data[label][options[j]] = cell.getAttribute(key);
      }
      break;
    }
  }
  var exist_outgoing_edge = false;
  for(var i in cell.edges){
    var edge = cell.edges[i];
    if (edge.source != cell) continue;
    exist_outgoing_edge = true;
    if (edge.awssf.toJSON){
      Object.assign(data[label], edge.awssf.toJSON(edge, cells)) 
    }
  }
  if (exist_outgoing_edge == false || data[label].Next == 'End'){
    delete data[label]['Next'];
    data[label]["End"] = true;
  }
  return data;
};
WaitState.prototype.buildForm = function(form, attrName, attrValue){
  if (['label', 'comment', 'input_path', 'output_path'].indexOf(attrName) == -1){
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    var select = document.createElement('select');
    var options = this.cst.DURATION_FORMAT;
    for(var j=0; j < options.length; j++){
      var option = document.createElement('option');
      mxUtils.writeln(option, options[j]);
      option.setAttribute('value', options[j].toLowerCase());
      if (attrName == options[j].toLowerCase()){
        option.setAttribute('selected', true);
      }
      select.appendChild(option);
    }
    td.appendChild(select);
    tr.appendChild(td);
    td = document.createElement('td');
    var input = document.createElement('textarea');
    input.setAttribute('rows', 2);
    input.style.width = '100%';
    input.value = attrValue;
    td.appendChild(input);
    tr.appendChild(td);
    form.body.appendChild(tr);
    return [select, input];
  }
  else if (attrName != 'label' && attrName != 'placeholders')
  {
    return [attrName, form.addTextarea(attrName + ':', attrValue, 2)];
  }
  else{
    return null;
  }
}
WaitState.prototype.applyForm = function(value, name, text){
  var removeLabel = false;
  if (text == null)
  {
    value.removeAttribute(name);
  }
  else
  {
    if (typeof(name) == 'object'){
      for (var i = 0; i < this.cst.DURATION_FORMAT.length; i++){
        var n = this.cst.DURATION_FORMAT[i].toLowerCase();
        if ( n == name.value ){
          value.setAttribute(name.value, text.value);
        }else{
          value.removeAttribute(n);
        }
      }
    }else{
      value.setAttribute(name, text.value);
    }
    removeLabel = removeLabel || (name == 'placeholder' &&
      value.getAttribute('placeholders') == '1');
  }
  return removeLabel;
}
registCodec(WaitState);


SucceedState = function(){};
SucceedState.prototype.type = 'Succeed';
SucceedState.prototype.create = function(){
  var cell = createState(this, SucceedState);
  return cell;
};
SucceedState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Succeed"
  }
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = cell.getAttribute("input_path");
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = cell.getAttribute("output_path");
  return data;
};
registCodec(SucceedState);

FailState = function(){};
FailState.prototype.type = 'Fail';
FailState.prototype.create = function(){
  var cell = createState(this, FailState);
  cell.setAttribute('error', '');
  cell.setAttribute('cause', '');
  cell.value.removeAttribute('input_path');
  cell.value.removeAttribute('output_path');  
  return cell;  
};
FailState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Fail",
    Error: cell.getAttribute("error"),
    Cause: cell.getAttribute("cause")
  }
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  return data;
};
registCodec(FailState);

ParallelState = function(){};
ParallelState.prototype.type = 'Parallel';
ParallelState.prototype.create = function(){
  var cell = createState(this, ParallelState);
  cell.setStyle('swimlane;whiteSpace=wrap;html=1;dashed=1;gradientColor=none;');
  cell.setGeometry(new mxGeometry(0, 0, 480, 200));
  cell.setAttribute('result_path', '');
  cell.setAttribute('branches', '');
  var sp = StartPoint.prototype.create(new mxGeometry((cell.geometry.width - 30)/2, 40, 30, 30));
  cell.insert(sp);
  var task1 = TaskState.prototype.create();
  task1.setGeometry(new mxGeometry(80, 80, task1.geometry.width, task1.geometry.height));
  cell.insert(task1);
  var edge1 = StartAtEdge.prototype.create();
  sp.insertEdge(edge1, true);
  task1.insertEdge(edge1, false);
  cell.insert(edge1);  
  var task2 = TaskState.prototype.create();
  task2.setGeometry(new mxGeometry(320, 80, task2.geometry.width, task2.geometry.height));
  cell.insert(task2);
  var edge2 = StartAtEdge.prototype.create();
  sp.insertEdge(edge2, true);
  task2.insertEdge(edge2, false);
  cell.insert(edge2);  
  return cell;
};
ParallelState.prototype.create_default_edge = function(src){
  for (var i in src.edges){
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return CatchEdge.prototype.create();
  }
  return NextEdge.prototype.create();
}
ParallelState.prototype.toJSON = function(cell, cells){
  var data = {};
  var label = cell.getAttribute("label"); 
  data[label] = {
    Type: "Parallel",
    Branches: [],
    Resource: cell.getAttribute("resource")
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = cell.getAttribute("input_path");
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = cell.getAttribute("output_path");
  if (cell.getAttribute("result_path"))
    data[label].ResultPath = cell.getAttribute("result_path");
  
  var startat = [];
  for(var i in cell.children){
    var child = cell.children[i];
    if (!awssfUtils.isStart(child)) continue;
    for(var j in child.edges){
      var edge = child.edges[j];
      if (edge.target == child) continue;
      if (awssfUtils.isStartAt(edge)){
        startat.push(cells[edge.target.id]);
      }
    }      
  }

  function traceAll(state, res){
    res.push(state);
    for(var j in state.edges){
      var edge = state.edges[j];
      if (edge.target == state) continue;
      traceAll(cells[edge.target.id], res);
    }
    return res;
  }
  for(var i in startat){
    var branch = [];
    var start = startat[i];
    traceAll(start, branch);
    var states = {};
    for(var i in branch){
      var child = branch[i];
      if (child.value == null || typeof(child.value) != "object") continue;
      if (!awssfUtils.isAWSsf(child)) continue;
      if (awssfUtils.isStart(child) || awssfUtils.isEnd(cell)) continue;
      if (child.isVertex()){
        if (awssfUtils.isParallel(child)) continue;
        if (child.awssf &&  child.awssf.toJSON){
          Object.assign(states, child.awssf.toJSON(child, cells));
        }
      }
    }
    data[label].Branches.push({
      StartAt: start.getAttribute("label"),
      States: states
    });
  }
  var exist_outgoing_edge = false;
  for(var i in cell.edges){
    var edge = cell.edges[i];
    if (edge.source != cell) continue;
    exist_outgoing_edge = true;
    if (edge.awssf.toJSON){
      if (awssfUtils.isRetry(edge)){
        if (!data[label]["Retry"]) data[label]["Retry"] = [];
        data[label]["Retry"].push(edge.awssf.toJSON(edge, cells));
      }
      else if (awssfUtils.isCatch(edge)){
        if (!data[label]["Catch"]) data[label]["Catch"] = [];
        data[label]["Catch"].push(edge.awssf.toJSON(edge, cells));
      }else{
        Object.assign(data[label], edge.awssf.toJSON(edge, cells)) 
      }
    }
  }
  if (exist_outgoing_edge == false || data[label].Next == 'End'){
    delete data[label]['Next'];
    data[label]["End"] = true;
  }
  return data;

};
registCodec(ParallelState);

function createEdge(awssf, edge, label, style){
  var cell = new mxCell(label, new mxGeometry(0, 0, 60, 60), style);
  cell.geometry.setTerminalPoint(new mxPoint(0, 0), true);
  cell.geometry.setTerminalPoint(new mxPoint(cell.geometry.width, cell.geometry.height), false);
  cell.geometry.relative = true;
  cell.edge = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', label);
  cell.setAttribute('type', 'awssf' + label);
  cell.awssf = awssf;  
  return cell;
}

StartAtEdge = function(){};
StartAtEdge.prototype.type = 'StartAt';
StartAtEdge.prototype.create = function(label){
  if (label == null ) label = this.type;
  var cell = createEdge(this, StartAtEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');
  return cell;
};
StartAtEdge.prototype.toJSON = function(cell, cells){
  if (cell.target != null){
    var data = {
      StartAt: cells[cell.target.id].getAttribute("label")
    }
    return data;
  }else{
    return {};
  }
};
registCodec(StartAtEdge);


NextEdge = function(){};
NextEdge.prototype.type = 'Next';
NextEdge.prototype.create = function(label){
  if (label == null ) label = this.type;  
  var cell = createEdge(this, NextEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');
  return cell;
};
NextEdge.prototype.toJSON = function(cell, cells){
  if (cell.target != null){
    var data = {
      Next: cells[cell.target.id].getAttribute("label")
    }
    return data;
  }else{
    return {};
  }
};
registCodec(NextEdge);


RetryEdge = function(){};
RetryEdge.prototype.type = 'Retry';
RetryEdge.prototype.create = function(label){
  if (label == null ) label = this.type;
  var cell = createEdge(this, RetryEdge, label, 'edgeStyle=orthogonalEdgeStyle;curved=1;html=1;exitX=0.5;exitY=1;entryX=1;entryY=0.5;startArrow=none;startFill=0;jettySize=auto;orthogonalLoop=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');  
  cell.geometry.setTerminalPoint(new mxPoint(0, cell.geometry.height), true);
  cell.geometry.setTerminalPoint(new mxPoint(cell.geometry.width, 0), false);
  cell.setAttribute('error_equals', '');
  cell.setAttribute('interval_seconds', 1);
  cell.setAttribute('max_attempts', 3);
  cell.setAttribute('backoff_rate', 2);
  return cell;
};
RetryEdge.prototype.toJSON = function(cell, cells){
  var tmp = cells[cell.target.id];
  if (cell.target != null){
    var data = {
      ErrorEquals: [cell.getAttribute("error_equals")],
      IntervalSeconds: cell.getAttribute("interval_seconds"),
      MaxAttempts: cell.getAttribute("max_attempts"),
      BackoffRate: cell.getAttribute("backoff_rate")
    }
    return data;
  }else{
    return {};
  }
};
registCodec(RetryEdge);

CatchEdge = function(){};
CatchEdge.prototype.type = 'Catch';
CatchEdge.prototype.create = function(label){
  if (label == null ) label = this.type;
  var cell = createEdge(this, CatchEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');    
  cell.setAttribute('error_equals', '');
  return cell;
};
CatchEdge.prototype.toJSON = function(cell, cells){
  var tmp = cells[cell.target.id];
  if (cell.target != null){
    var data = {
      ErrorEquals: [cell.getAttribute("error_equals")],
      Next: cells[cell.target.id].getAttribute("label")
    }
    return data;
  }else{
    return {};
  }
};
registCodec(CatchEdge);

ChoiceEdge = function(){};
ChoiceEdge.prototype.type = 'Choice';
ChoiceEdge.prototype.create = function(label){
  if (label == null ) label = this.type;
  var cell = createEdge(this, ChoiceEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');     
  cell.setAttribute('label', '%condition%');
  cell.setAttribute('placeholders', 1);  
  cell.setAttribute('condition', '$.dummy == 1');
  return cell;
};
ChoiceEdge.prototype.toJSON = function(cell, cells){
  var ops = {
    "==": "Equals",
    "<": "LessThan",
    ">": "GreaterThan",
    "<=": "LessThanEquals",
    ">=": "GreatherThanEquals"
  };
  function parseJSEPObject(obj, res){
    if (res == null)
      res = [];
    if (obj.type == 'MemberExpression'){
      res.unshift(obj.property.name);
      return parseJSEPObject(obj.object, res);
    }
    else if (obj.type == 'Identifier'){
      res.unshift(obj.name);
      return res.join(".");      
    }
  }
  function parseJSEValue(obj){
    return obj.value;
  }
  function parseJSEPExpr(obj, res){
    if (res == null)
      res = {};
    if (obj.operator == '&&'){
      Object.assign(res, {And: [parseJSEPExpr(obj.left), parseJSEPExpr(obj.right)]});
    }
    else if (obj.operator == '||'){
      Object.assign(res, {Or: [parseJSEPExpr(obj.left), parseJSEPExpr(obj.right)]});
    }
    else if (obj.operator == '!'){
      Object.assign(res, {Not: parseJSEPExpr(obj.argument)});
    }
    else if (ops[obj.operator]){
      var vartype;
      var varname = parseJSEPObject(obj.left);
      var val = parseJSEValue(obj.right);
      if (typeof(val) == "number") {
        vartype = "Numeric";
      }
      else if (typeof(val) == "string"){
        if (val.match(/^["'][\d\-]+T[\d:]+Z["']$/)){
          vartype = "Timestamp";
        } else {
          vartype = "String";
        }
      }
      else if (typeof(val) == "boolean"){
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
  if (cell.target != null){
    var condition = cell.getAttribute("condition");
    var data;
    if (condition != null){
      var tree = jsep(condition);
      data = parseJSEPExpr(tree);
    }
    data.Next = cells[cell.target.id].getAttribute("label");
    return data;
  }else{
    return {};
  }
};
registCodec(ChoiceEdge);

//mxscript("https://sdk.amazonaws.com/js/aws-sdk-2.9.0.min.js");
mxscript("https://github.com/soney/jsep/raw/master/build/jsep.min.js");
//mxscript("https://localhost:8000/js/aws-sdk-2.9.0.js");
//mxscript("https://localhost:8000/js/jsep.min.js");

Draw.loadPlugin(function(ui) {

	// Avoids having to bind all functions to "this"
	var sb = ui.sidebar;

  // Adds custom sidebar entry
  sb.addPalette('awsStepFunctions', 'AWS Step Functions', true, function(content) {
    
    // var cell = createAWSconfig();
    // content.appendChild(sb.createVertexTemplateFromCells([cell], cell.geometry.width, cell.geometry.height, cell.label));
    var verticies = [StartPoint, EndPoint, TaskState, PassState, ChoiceState, WaitState, SucceedState, FailState, ParallelState];
    for (var i in verticies){
      var cell = verticies[i].prototype.create();
      content.appendChild(sb.createVertexTemplateFromCells([cell], cell.geometry.width, cell.geometry.height, cell.label));
    }
    var edges = [NextEdge, ChoiceEdge, RetryEdge, CatchEdge];
    for (var i in edges){
      var cell = edges[i].prototype.create();
      content.appendChild(sb.createEdgeTemplateFromCells([cell], cell.geometry.width, cell.geometry.height, cell.label, true, false));
    }
  });

  // Collapses default sidebar entry and inserts this before
  var c = ui.sidebar.container;
  c.firstChild.click();
  c.insertBefore(c.lastChild, c.firstChild);
  c.insertBefore(c.lastChild, c.firstChild);

  mxGraphCreateEdge = mxGraph.prototype.createEdge;
  mxGraph.prototype.createEdge = function(parent, id, value, source, target, style)
  {
    if (awssfUtils.isAWSsf(source) && source.awssf.create_default_edge){
      return source.awssf.create_default_edge(source);
    }else{
      return mxGraphCreateEdge.apply(this, arguments);
    }
  };

  mxConnectionHandlerInsertEdge = mxConnectionHandler.prototype.insertEdge;
  mxConnectionHandler.prototype.insertEdge = function(parent, id, value, source, target, style)
  {
    var edge = null;
    if (!awssfUtils.isAWSsf(source)) {
      return mxConnectionHandlerInsertEdge.apply(this, arguments);
    }
    if (awssfUtils.isParallelChild(source) || awssfUtils.isParallelChild(target)){
      if (source.parent != target.parent) return null;
    }
    if ((source == target) && (awssfUtils.isTask(source) || awssfUtils.isParallel(source))){
      edge = RetryEdge.prototype.create();
    } else if (source.awssf && source.awssf.create_default_edge){
      edge = source.awssf.create_default_edge(source);
    }else{
      return null; // cancel
    }
    if (edge != null){
      edge = this.graph.addEdge(edge, parent, source, target);
      return edge;
    }else{
      return null;
    }
  };

  mxGraphModelCellAdded = ui.editor.graph.getModel().cellAdded;
  ui.editor.graph.getModel().cellAdded = function(cell){
    if (!awssfUtils.isAWSsf(cell)){
      return mxGraphModelCellAdded.apply(this, arguments);
    }
    var names = {};
    for (var i in this.cells){
      var a = this.cells[i];
      if (a.isVertex() && a.getAttribute("type")){
        var type = a.getAttribute("type");
        if (names[type]){
          names[type].push(a);
        }else{
          names[type] = [a];
        }
      }
    }
    var type = cell.getAttribute("type");
    if (cell.isVertex() && names[type]){
      if (type == "awssfStart"){
        // var found_same_parent = false;
        // for(var i in names[type]){
        //   if (cell.parent.id == names[type][i].parent.id){
        //     found_same_parent = true;
        //     break;
        //   }
        // }
      }else{
        cell.setAttribute("label", cell.getAttribute("label").replace(/(\d*)$/, (names[type].length + 1)));
      }
    }
    setupRoot();
    return mxGraphModelCellAdded.apply(this, arguments);
  };

  origEditDataDialog = EditDataDialog;
  EditDataDialog = function(ui, cell){
    if (!awssfUtils.isAWSsf(cell)){
      return origEditDataDialog.apply(this, arguments);
    }
    var div = document.createElement('div');
    var graph = ui.editor.graph;

    div.style.height = '310px';
    div.style.overflow = 'auto';
    
    var value = graph.getModel().getValue(cell);
    
    // Converts the value to an XML node
    if (!mxUtils.isNode(value))
    {
      var obj = mxUtils.createXmlDocument().createElement('object');
      obj.setAttribute('label', value || '');
      value = obj;
    }

    // Creates the dialog contents
    var form = new mxForm('properties');
    form.table.style.width = '100%';
    form.table.style.paddingRight = '20px';

    var attrs = value.attributes;
    var names = [];
    var texts = [];
    var count = 0;
    
    var addTextArea = function(index, name, value)
    {
      names[index] = name;
      texts[index] = form.addTextarea(names[count] + ':', value, 2);
      texts[index].style.width = '100%';
      
    };

    for (var i = 0; i < attrs.length; i++)
    {
      if (attrs[i].nodeName == 'type') {
        var span = document.createElement('span');
        mxUtils.write(span, attrs[i].nodeValue);
        form.addField('type:', span);
      }
      else if (awssfUtils.isWait(cell)){
        var res = cell.awssf.buildForm(form, attrs[i].nodeName, attrs[i].nodeValue);
        if (res != null){
          names[count] = res[0];
          texts[count] = res[1];
          count++;
        }
      }
      else if (awssfUtils.isChoice(cell) && attrs[i].nodeName == 'Xcondition'){
        var choices = document.createElement('div');

        var nameInput = document.createElement('input');
        nameInput.setAttribute('placeholder', 'variable');
        nameInput.setAttribute('type', 'text');
        nameInput.setAttribute('size', (mxClient.IS_QUIRKS) ? '9' : '11');
        nameInput.style.marginLeft = '2px';
        choices.appendChild(nameInput);

        var operator = document.createElement('select');
        var operators = ["StringEquals","StringLessThan","StringGreaterThan","StringLessThanEquals","StringGreaterThanEquals",
                        "NumericEquals","NumericLessThan","NumericGreaterThan","NumericLessThanEquals","NumericGreaterThanEquals",
                        "BooleanEquals",
                        "TimestampEquals","TimestampLessThan","TimestampGreaterThan","TimestampLessThanEquals","TimestampGreaterThanEquals",
                        "And","Or","Not"];
        for(var j in operators){
          var option = document.createElement('option');
          mxUtils.writeln(option, operators[j]);
          option.setAttribute('value', operators[j]);
          if (attrs[i].nodeValue == operators[j]){
            option.setAttribute('selected', true);
          }
          operator.appendChild(option);
        }
        choices.appendChild(operator);

        var valInput = document.createElement('input');
        valInput.setAttribute('placeholder', 'value');
        valInput.setAttribute('type', 'text');
        valInput.setAttribute('size', (mxClient.IS_QUIRKS) ? '9' : '11');
        valInput.style.marginLeft = '2px';
        choices.appendChild(valInput);

        form.addField('condition', choices);
      }
      else if (attrs[i].nodeName != 'label' && attrs[i].nodeName != 'placeholders')
      {
        addTextArea(count, attrs[i].nodeName, attrs[i].nodeValue);
        count++;
      }
    }
    
    div.appendChild(form.table);

    this.init = function()
    {
      if (texts.length > 0)
      {
        texts[0].focus();
      }
      else
      {
        nameInput.focus();
      }
    };
    
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
      ui.hideDialog.apply(ui, arguments);
    });
    cancelBtn.className = 'geBtn';
    
    var applyBtn = mxUtils.button(mxResources.get('apply'), function()
    {
      try
      {
        ui.hideDialog.apply(ui, arguments);
        
        // Clones and updates the value
        value = value.cloneNode(true);
        var removeLabel = false;
        
        for (var i = 0; i < names.length; i++)
        {
          if (cell.awssf && cell.awssf.applyForm){
            removeLabel = removeLabel || cell.awssf.applyForm(value, names[i], texts[i]);
          }else{
            if (texts[i] == null)
            {
              value.removeAttribute(names[i]);
            }
            else
            {
              value.setAttribute(names[i], texts[i].value);
              removeLabel = removeLabel || (names[i] == 'placeholder' &&
                value.getAttribute('placeholders') == '1');
            }
          }
        }
        
        // Removes label if placeholder is assigned
        if (removeLabel)
        {
          value.removeAttribute('label');
        }
        
        // Updates the value of the cell (undoable)
        graph.getModel().setValue(cell, value);
      }
      catch (e)
      {
        mxUtils.alert(e);
      }
    });
    applyBtn.className = 'geBtn gePrimaryBtn';
    
    var buttons = document.createElement('div');
    buttons.style.marginTop = '18px';
    buttons.style.textAlign = 'right';
    
    if (ui.editor.graph.getModel().isVertex(cell) || ui.editor.graph.getModel().isEdge(cell))
    {
      var replace = document.createElement('span');
      replace.style.marginRight = '10px';
      var input = document.createElement('input');
      input.setAttribute('type', 'checkbox');
      input.style.marginRight = '6px';
      
      if (value.getAttribute('placeholders') == '1')
      {
        input.setAttribute('checked', 'checked');
        input.defaultChecked = true;
      }
    
      mxEvent.addListener(input, 'click', function()
      {
        if (value.getAttribute('placeholders') == '1')
        {
          value.removeAttribute('placeholders');
        }
        else
        {
          value.setAttribute('placeholders', '1');
        }
      });
      
      replace.appendChild(input);
      mxUtils.write(replace, mxResources.get('placeholders'));
      
      if (EditDataDialog.placeholderHelpLink != null)
      {
        var link = document.createElement('a');
        link.setAttribute('href', EditDataDialog.placeholderHelpLink);
        link.setAttribute('title', mxResources.get('help'));
        link.setAttribute('target', '_blank');
        link.style.marginLeft = '10px';
        link.style.cursor = 'help';
        
        var icon = document.createElement('img');
        icon.setAttribute('border', '0');
        icon.setAttribute('valign', 'middle');
        icon.style.marginTop = '-4px';
        icon.setAttribute('src', Editor.helpImage);
        link.appendChild(icon);
        
        replace.appendChild(link);
      }
      
      buttons.appendChild(replace);
    }
    
    if (ui.editor.cancelFirst)
    {
      buttons.appendChild(cancelBtn);
      buttons.appendChild(applyBtn);
    }
    else
    {
      buttons.appendChild(applyBtn);
      buttons.appendChild(cancelBtn);
    }

    div.appendChild(buttons);
    this.container = div;    
  }

	mxResources.parse('stepFunctions=StepFunctions');
	mxResources.parse('awssfValidate=Validate');
	mxResources.parse('awssfExportJSON=Export JSON');
	mxResources.parse('awssfExport=Export');
	mxResources.parse('awssfLambda=Lambda');
  mxResources.parse('awssfDeploy=Deploy');
  mxResources.parse('awssfInvoke=Invoke');

  ui.actions.addAction('awssfValidate', function()
  {
    var checklist = {
      START_EXIST: [false, 'start MUST exist'],
      END_EXIST: [false, 'end MUST exist'],
      UNIQ_NAME: [true, {}, 'name MUST be unique.']
    };
    var model = ui.editor.graph.getModel();
    for(var i in model.cells){
      var cell = model.cells[i];
      if (!cell.isVertex()) continue;
      var label = cell.getAttribute("label");
      if (label != null){
        if (checklist.UNIQ_NAME[1][label] >= 1){
          checklist.UNIQ_NAME[0] = false;
          checklist.UNIQ_NAME[1][label] += 1;
        }else{
          checklist.UNIQ_NAME[1][label] = 1;
        }
      }
      if (cell.value != null){
        if (awssfUtils.isStart(cell)){
          checklist.START_EXIST[0] = true;
        }
        if (awssfUtils.isEnd(cell)){
          checklist.END_EXIST[0] = true;
        }
     }
    }
    var msg = [];
    for(var i in checklist){
      if (checklist[i][0] == false){
        msg.push(checklist[i][checklist[i].length - 1]);
      }
    }
    if(msg.length > 0)
      mxUtils.popup(msg.join("\n"), true);
  });

  function setupRoot(){
    var cell = ui.editor.graph.getModel().cells[0];
    if (cell.value == null){
      cell.value = mxUtils.createXmlDocument().createElement('object');    
      if (cell.getAttribute("name") == null) cell.setAttribute("name", "");
      if (cell.getAttribute("comment") == null) cell.setAttribute("comment", "");
      if (cell.getAttribute("timeout_seconds") == null) cell.setAttribute("timeout_seconds", "");
      if (cell.getAttribute("version") == null) cell.setAttribute("version", "");
    }
    return;
  }

  function getStepFunctionDefinition(){
    var states = {};
    var model = ui.editor.graph.getModel();
    var startat = null;
    for(var i in model.cells){
      var cell = model.cells[i];
      if (!awssfUtils.isAWSsf(cell)) continue;
      if (awssfUtils.isAWSconfig(cell)) continue;
      if (awssfUtils.isParallelChild(cell)) continue;
      if (awssfUtils.isStartAt(cell)){
        startat = model.cells[cell.target.id].getAttribute("label");
      };
      if (awssfUtils.isStart(cell) || awssfUtils.isEnd(cell)) continue;
      if (cell.isVertex()){
        Object.assign(states, cell.awssf.toJSON(cell, model.cells));
      }
    }
    var root = model.cells[0];
    var data = {
      StartAt: startat,
      States: states
    }
    if (root.getAttribute("comment"))
      data.Comment = root.getAttribute("comment");
    if (root.getAttribute("version"))
      data.Version = root.getAttribute("version");
    if (root.getAttribute("timeout_seconds"))
      data.TimeoutSeconds = Number(root.getAttribute("timeout_seconds"));
    return data;
  }

  ui.actions.addAction('awssfExportJSON', function()
  {
    var data = getStepFunctionDefinition();
    mxUtils.popup(JSON.stringify(data, null, "  "));
  });

  ui.actions.addAction('awssfExport', function()
  {
    var encoder = new mxCodec();
    var node = encoder.encode(ui.editor.graph.getModel());
    mxUtils.popup(mxUtils.getPrettyXml(node), true);
  });

  function setupAWSconfig(){
    var codec = new mxCodec();
    var model = ui.editor.graph.getModel();
    var node = codec.encode(model);
    var found = mxUtils.findNode(node, "type", "awssfAWSconfig");
    if (found == null){
      mxUtils.alert("You need to put a AWSconfig.")
      return false;
    }
    var awsconfig = codec.decode(found);
    AWS.config.update({accessKeyId: awsconfig.getAttribute('accessKeyId'), secretAccessKey: awsconfig.getAttribute('secretAccessKey'), region: awsconfig.getAttribute('region')});
    return true;
  }

  function getCallerIdentity(callback){
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    sts.getCallerIdentity({}, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else callback(data); 
    });    
  }

  ui.actions.addAction('awssfLambda', function()
  {
    if (!setupAWSconfig()) return;
    var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
    var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
    var funclist = [];
    stepfunctions.listActivities({}, function(err, data){
      if (err) console.log(err, err.stack); // an error occurred
      else{
        for(var i in data.activities){
          var act = data.activities[i];
          funclist.push(func.activityArn);
        }
      };
      lambda.listFunctions({}, function(err,data){
        if (err) console.log(err, err.stack); // an error occurred
        else{
          for(var i in data.Functions){
            var func = data.Functions[i];
            funclist.push(func.FunctionArn);
          }
          mxUtils.popup(funclist.join("\n"), true);
        }
      });
    });
  });

  ui.actions.addAction('awssfDeploy', function()
  {
    if (!setupAWSconfig()) return;
    var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
    //var data = {Account: "700831962594"};
    getCallerIdentity(function(data){
      var params = {
        definition: JSON.stringify(getStepFunctionDefinition()),
        name: ui.editor.graph.getModel().cells[0].getAttribute("name"),
        roleArn: 'arn:aws:iam::' + data.Account + ':role/service-role/StatesExecutionRole-us-west-2'
      }; 
      stepfunctions.createStateMachine(params, function(err, data) {
        if (data) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });    
    });
  });

  ui.actions.addAction('awssfInvoke', function()
  {
    if (!setupAWSconfig()) return;
    var iam = new AWS.IAM({apiVersion: '2010-05-08'});
    var params = { RoleName: "arn:aws:iam::700831962594:role/service-role/StatesExecutionRole-us-west-2"};
    iam.getRole(params, function(err, data){
      if (err) console.log(err, err.stack); // an error occurred
      else{
        console.log(data);      
        var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
        var funclist = [];
        stepfunctions.listActivities({}, function(err, data){
          if (err) console.log(err, err.stack); // an error occurred
          else{
            for(var i in data.activities){
              var act = data.activities[i];
              funclist.push(func.activityArn);
            }
          };
          mxUtils.popup(funclist.join("\n"), true);
        });
      }
    });
  });  

	var menu = ui.menubar.addMenu('StepFunctions', function(menu, parent)
	{
		ui.menus.addMenuItems(menu, ['-', /*'awssfValidate', */ 'awssfExportJSON', 'awssfExport' /*, '-', 'awssfLambda', 'awssfDeploy', 'awssfInvoke'*/]);
	});
	
	// Inserts voice menu before help menu
	var menu = menu.parentNode.insertBefore(menu, menu.previousSibling.previousSibling.previousSibling);


});
