import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const ChoiceState = function () {};
ChoiceState.prototype.type = 'Choice';
ChoiceState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'shape=stencil(rZZNT4QwEIZ/DddNodmgR8Pi0YsHzl12VpqFlrS46r+3UIl8FNOhJhzgHWaezvBSiGimK9ZClBDBGojoKUqSE5RccynMqdGZbqHsbOTOFGfnGmxEd0re4INfusqGuahA8a6P0jwiT+ae/qBZKYUwRUxNPYtM4qYY48Lkkk9bjBzio+V8/Qj2qjWIBjpQM/V39S9FMUjPCBIl+0ho0L6O0Jh0Xz85GvSwr6EcT1qYIfYjvYabwZsUaAZfTqgZfDnBZvAG4UkkXfjukBz9aAX6ZVqAfDn/0FPqy8J74jHZO8AcO8B43wDxplj35DvA3DVAmhll68NFszMrb29KvouLc4kt6z+Kq8AYbuQdJiNy7aKu1sf0motJunMT9k+Pydzjx0D+WA+xgtAC6AbKWmrYspfRV49vUDeeOc2uUsEfZrjyurY/S06TrbIH1f6XDcI3);whiteSpace=wrap;html=1;gradientColor=none;dashed=1';
  var cell = createState(this, label, style, json);
  cell.setAttribute('choices', '');
  cell.setAttribute('default', '');
  return cell;
};
ChoiceState.prototype.hiddenAttributes = ['choices', 'default'];
ChoiceState.prototype.createDefaultEdge = function () {
  return ChoiceEdge.prototype.create();
};
ChoiceState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!cell.edges ||
    (cell.edges.filter(function (v) { return (v.source == cell) && awssfUtils.isChoice(v);}).length == 0)) {
    res.push("A Choice state MUST have more than one choice edge");
  }
  return awssfUtils.validateCommonAttributes(cell, res, false);
};
ChoiceState.prototype.expJSON = function (cell, cells) {
  var data = {};
  var label = cell.getAttribute("label");
  data[label] = {
    Type: "Choice",
    Choices: []
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = awssfUtils.adjustJsonPath(cell.getAttribute("input_path"));
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = awssfUtils.adjustJsonPath(cell.getAttribute("output_path"));
  if (cell.edges) {
    var sortedEdges = cell.edges.sort(function (a, b) {
      if (Number(a.getAttribute("weight")) > Number(b.getAttribute("weight"))) return -1;
      if (Number(a.getAttribute("weight")) < Number(b.getAttribute("weight"))) return 1;
      return 0;
    });
    for(var i in sortedEdges) {
      var edge = sortedEdges[i];
      if (edge.source != cell) continue;
      if (awssfUtils.isChoice(edge)) {
        data[label].Choices.push(edge.awssf.expJSON(edge, cells));
      } else if (awssfUtils.isDefault(edge)) {
        Object.assign(data[label], edge.awssf.expJSON(edge, cells));
      }
    }
  }
  return data;
};
registCodec('ChoiceState', ChoiceState);
var ChoiceStateHandler = function (state) {
  this.custom = function () {
    this.domNode.appendChild(ChoiceEdge.prototype.createHandlerImage.apply(this, arguments));
    this.domNode.appendChild(DefaultEdge.prototype.createHandlerImage.apply(this, arguments));
  };
  awssfStateHandler.apply(this, arguments);
};
ChoiceState.prototype.handler = ChoiceStateHandler;
mxUtils.extend(ChoiceStateHandler, awssfStateHandler);
