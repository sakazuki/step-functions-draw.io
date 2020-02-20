import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const PassState = function () {};
PassState.prototype.type = 'Pass';
PassState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'shape=mxgraph.flowchart.process;whiteSpace=wrap;gradientColor=none;html=1;';
  var cell = createState(this, label, style, json);
  cell.setAttribute('parameters', JSON.stringify(json.Parameters) || '');
  cell.value.setAttribute('result', json.Result || '');
  cell.value.setAttribute('result_path', json.ResultPath || '');
  return cell;
};
PassState.prototype.createDefaultEdge = function (src) {
  for (var i in src.edges) {
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return null;
  }
  return NextEdge.prototype.create();
};
PassState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (awssfUtils.validateJson(cell.getAttribute("parameters")) == false) {
    res.push("parameters MUST be valid JSON");
  }
  return awssfUtils.validateCommonAttributes(cell, res, true);
};
PassState.prototype.expJSON = function (cell, cells) {
  var data = {};
  var label = cell.getAttribute("label");
  data[label] = {
    Type: "Pass"
  };
  if (cell.getAttribute("parameters"))
    data[label].Parameters = JSON.parse(cell.getAttribute("parameters"));
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = awssfUtils.adjustJsonPath(cell.getAttribute("input_path"));
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = awssfUtils.adjustJsonPath(cell.getAttribute("output_path"));
  if (cell.getAttribute("result_path"))
    data[label].ResultPath = awssfUtils.adjustJsonPath(cell.getAttribute("result_path"));
  if (cell.getAttribute("result"))
    data[label].Result = cell.getAttribute("result");
  var existNextEdge = false;
  for(var i in cell.edges) {
    var edge = cell.edges[i];
    if (edge.source != cell) continue;
    if (awssfUtils.isNext(edge)) {
      existNextEdge = true;
      Object.assign(data[label], edge.awssf.expJSON(edge, cells));
    }
  }
  if (existNextEdge == false || data[label].Next == 'End') {
    delete data[label]['Next'];
    data[label]["End"] = true;
  }
  return data;
};
registCodec('PassState', PassState);
var PassStateHandler = function (state) {
  this.custom = function () {
    this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
  };
  awssfStateHandler.apply(this, arguments);
};
PassState.prototype.handler = PassStateHandler;
mxUtils.extend(PassStateHandler, awssfStateHandler);
