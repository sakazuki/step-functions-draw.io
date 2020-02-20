import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const SucceedState = function () {};
SucceedState.prototype.type = 'Succeed';
SucceedState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'shape=mxgraph.flowchart.terminator;html=1;whiteSpace=wrap;gradientColor=none;';
  var cell = createState(this, label, style, json);
  return cell;
};
SucceedState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (cell.edges &&
    (cell.edges.filter(function (v) { return (v.source == cell) && awssfUtils.isAWSsf(v);}).length > 0)) {
    res.push("A Succeed state MUST have no outgoing edge");
  }
  return awssfUtils.validateCommonAttributes(cell, res, false);
};
SucceedState.prototype.expJSON = function (cell, cells) {
  var data = {};
  var label = cell.getAttribute("label");
  data[label] = {
    Type: "Succeed"
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = awssfUtils.adjustJsonPath(cell.getAttribute("input_path"));
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = awssfUtils.adjustJsonPath(cell.getAttribute("output_path"));
  return data;
};
registCodec('SucceedState', SucceedState);
SucceedState.prototype.handler = awssfStateHandler;
