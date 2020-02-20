import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const TaskState = function () {};
TaskState.prototype.type = 'Task';
TaskState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'shape=stencil(rZVNb4MwDIZ/DdcqkI2P48S6Y1Wph51TMCMqTVDC2m2/fiEBdUCyAavExa+xH78BjIdTWZIavAAxcgYPP3tBsBeQQ0EZ5EreC56BlEpWQWluCJEJryZMYhMSWUPWGO1CBCXHCkxGNoKf4ErzputAWQmCNm0Wbz30pO5pL5xmnDHVhHImB5kfedWMUKZq0YdphjaPBvPZxSaqFeEMDYiBerO508LLaow/D3NYihl66aF/YV4XYvx1mO3iQ0PBiIT8mazdUk8WWBLPhB2Ww/r3foWz5cc4gc13ZoPhVCmujw2nR5Kd3gR/Z7l1RJ0R7cfuem2tC2K0PojIJP3qpgw3kR+FcYSihzhIEuy7hnaMhtOCC/hl5oJWldlDroOvSbueJok+feYXuPmNLH5tbfvqSu1TV3XoLteWHYOp3X0/P4n/L0Oj8js70jWT56tV8/vSwjc=);whiteSpace=wrap;gradientColor=none;html=1;';
  var cell = createState(this, label, style, json);
  cell.setAttribute('resource', json.Resource || '');
  cell.setAttribute('timeout_seconds', json.TimeoutSeconds || 60);
  cell.setAttribute('heartbeat_seconds', json.HeartbeatSeconds || '');
  return cell;
};
TaskState.prototype.createDefaultEdge = function (src) {
  for (var i in src.edges) {
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return CatchEdge.prototype.create();
  }
  return NextEdge.prototype.create();
};
TaskState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!cell.getAttribute("resource") || !cell.getAttribute("resource").match(/^arn:[^:]+:(states|lambda):[^:]*:[^:]*:[^:]+:.+/)) {
    res.push("resource MUST be a URI that uniquely identifies the specific task to execute");
  }
  if (awssfUtils.validateJson(cell.getAttribute("parameters")) == false) {
    res.push("parameters MUST be valid JSON");
  }
  if (awssfUtils.validateNumber(cell.getAttribute("timeout_seconds")) == false) {
    res.push("timeout_seconds MUST be number");
  }
  if (awssfUtils.validateNumber(cell.getAttribute("heartbeat_seconds")) == false) {
    res.push("heartbeat_seconds MUST be number");
  }else{
    if (Number(cell.getAttribute("heartbeat_seconds")) >= Number(cell.getAttribute("timeout_seconds"))) {
      res.push("heartbeat_seconds MUST be smaller than timeout_seconds");
    }
  }
  return awssfUtils.validateCommonAttributes(cell, res, true);
};
TaskState.prototype.orderedAttributes = [
  "label", "type",
  "resource", "parameters",
  "input_path", "output_path", "result_path",
  "timeout_seconds", "heartbeat_seconds", "comment"
];
TaskState.prototype.expJSON = function (cell, cells) {
  var data = {};
  var label = cell.getAttribute("label");
  data[label] = {
    Type: "Task",
    Resource: cell.getAttribute("resource")
  };
  if (cell.getAttribute("parameters")) {
    var value = cell.getAttribute("parameters");
    if (value) {
      if (value[0] === "{") {
        if (value !== "{}")
          data[label].Parameters = JSON.parse(value);
      } else {
        data[label].Parameters = value;
      }
    }
  }
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = awssfUtils.adjustJsonPath(cell.getAttribute("input_path"));
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = awssfUtils.adjustJsonPath(cell.getAttribute("output_path"));
  if (cell.getAttribute("result_path"))
    data[label].ResultPath = awssfUtils.adjustJsonPath(cell.getAttribute("result_path"));
  if (cell.getAttribute("timeout_seconds"))
    data[label].TimeoutSeconds = Number(cell.getAttribute("timeout_seconds"));
  if (cell.getAttribute("heartbeat_seconds"))
    data[label].HeartbeatSeconds = Number(cell.getAttribute("heartbeat_seconds"));

  var existNextEdge = false;
  if (cell.edges) {
    var sortedEdges = cell.edges.sort(function (a, b) {
      if (Number(a.getAttribute("weight")) > Number(b.getAttribute("weight"))) return -1;
      if (Number(a.getAttribute("weight")) < Number(b.getAttribute("weight"))) return 1;
      return 0;
    });
    for(var i in sortedEdges) {
      var edge = sortedEdges[i];
      if (edge.source != cell) continue;
      if (edge.awssf && edge.awssf.expJSON) {
        if (awssfUtils.isRetry(edge)) {
          if (!data[label]["Retry"]) data[label]["Retry"] = [];
          data[label]["Retry"].push(edge.awssf.expJSON(edge, cells));
        } else if (awssfUtils.isCatch(edge)) {
          if (!data[label]["Catch"]) data[label]["Catch"] = [];
          data[label]["Catch"].push(edge.awssf.expJSON(edge, cells));
        }else if (awssfUtils.isNext(edge)) {
          existNextEdge = true;
          Object.assign(data[label], edge.awssf.expJSON(edge, cells));
        }
      }
    }
  }
  if (existNextEdge == false || data[label].Next == 'End') {
    delete data[label]['Next'];
    data[label]["End"] = true;
  }
  return data;
};
registCodec('TaskState', TaskState);
var TaskStateHandler = function (state) {
  this.custom = function () {
    this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
    this.domNode.appendChild(CatchEdge.prototype.createHandlerImage.apply(this, arguments));
    this.domNode.appendChild(RetryEdge.prototype.createHandlerImage.apply(this, arguments));
  };
  awssfStateHandler.apply(this, arguments);
};
TaskState.prototype.handler = TaskStateHandler;
mxUtils.extend(TaskStateHandler, awssfStateHandler);