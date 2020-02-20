import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const FailState = function () {};
FailState.prototype.type = 'Fail';
FailState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'shape=mxgraph.flowchart.terminator;html=1;whiteSpace=wrap;gradientColor=none;';
  var cell = createState(this, label, style, json);
  cell.setAttribute('error', json.Error || '');
  cell.setAttribute('cause', json.Cause || '');
  cell.value.removeAttribute('input_path');
  cell.value.removeAttribute('output_path');
  return cell;
};
FailState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (cell.edges &&
    (cell.edges.filter(function (v) { return (v.source == cell) && awssfUtils.isAWSsf(v);}).length > 0)) {
    res.push("A Fail state MUST have no outgoing edge");
  }
  if (!cell.getAttribute("error")) {
    res.push("error MUST have a value");
  }
  if (!cell.getAttribute("cause")) {
    res.push("cause MUST have a value");
  }
  return awssfUtils.validateCommonAttributes(cell, res, false);
};
FailState.prototype.expJSON = function (cell, cells) {
  var data = {};
  var label = cell.getAttribute("label");
  data[label] = {
    Type: "Fail",
    Error: cell.getAttribute("error"),
    Cause: cell.getAttribute("cause")
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  return data;
};
registCodec('FailState', FailState);
FailState.prototype.handler = awssfStateHandler;
