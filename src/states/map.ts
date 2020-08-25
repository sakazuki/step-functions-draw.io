import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const MapState = function () {};
MapState.prototype.type = 'Map';
MapState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'swimlane;whiteSpace=wrap;html=1;dashed=1;gradientColor=none;shape=awssf.layered;dx=10;container=1;recursiveResize=0';
  var cell = createState(this, label, style, json);
  var pt = cell.getGeometry();
  cell.setGeometry(new mxGeometry(pt.x, pt.y, 300, 200));
  cell.setAttribute('items_path', json.ItemsPath || '');
  cell.setAttribute('max_concurrency', json.MaxConcurrency || '');
  cell.setAttribute('iterator', '');
  var sp = StartPoint.prototype.create(new mxGeometry((cell.geometry.width - 30)/2, 40, 30, 30));
  cell.insert(sp);
  return cell;
};
MapState.prototype.hiddenAttributes = ['iterator'];
MapState.prototype.createDefaultEdge = function (src) {
  for (var i in src.edges) {
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return CatchEdge.prototype.create();
  }
  return NextEdge.prototype.create();
};
MapState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (awssfUtils.validateJson(cell.getAttribute("parameters")) == false) {
    res.push("parameters MUST be valid JSON");
  }
  return awssfUtils.validateCommonAttributes(cell, res, true);
};
MapState.prototype.expJSON = function (cell, cells) {
  const data = {};
  const label = cell.getAttribute("label");
  data[label] = {
    Type: "Map",
    Iterator: {}
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
  if (cell.getAttribute("items_path"))
    data[label].ItemsPath = awssfUtils.adjustJsonPath(cell.getAttribute("items_path"));
  if (cell.getAttribute("max_concurrency"))
    data[label].MaxConcurrency = Number(cell.getAttribute("max_concurrency"));

  let start;
  for(const i in cell.children) {
    const child = cell.children[i];
    if (!awssfUtils.isStart(child)) continue;
    for(const j in child.edges) {
      const edge = child.edges[j];
      if (edge.target == child) continue;
      if (awssfUtils.isStartAt(edge)) {
        start= cells[edge.target.id];
      }
    }
  }

  function traceAll (state, res) {
    res.push(state);
    for(const j in state.edges) {
      const edge = state.edges[j];
      if (edge.target == state) continue;
      traceAll(cells[edge.target.id], res);
    }
    return res;
  }
  const branch = [];
  traceAll(start, branch);
  const states = {};
  for(const child of branch) {
    if (child.value == null || typeof(child.value) != "object") continue;
    if (!awssfUtils.isAWSsf(child)) continue;
    if (awssfUtils.isStart(child) || awssfUtils.isEnd(cell)) continue;
    if (child.isVertex()) {
      if (awssfUtils.isMap(child)) continue;
      if (child.awssf &&  child.awssf.expJSON) {
        Object.assign(states, child.awssf.expJSON(child, cells));
      }
    }
  }
  data[label].Iterator = {
    StartAt: start.getAttribute("label"),
    States: states
  };
  let existNextEdge = false;
  if (cell.edges) {
    var sortedEdges = cell.edges.sort(function (a, b) {
      if (Number(a.getAttribute("weight")) > Number(b.getAttribute("weight"))) return -1;
      if (Number(a.getAttribute("weight")) < Number(b.getAttribute("weight"))) return 1;
      return 0;
    });
    for(const i in sortedEdges) {
      const edge = sortedEdges[i];
      if (edge.source != cell) continue;
      if (edge.awssf.expJSON) {
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

registCodec('MapState', MapState);

var MapStateHandler = function (state) {
  this.custom = function () {
    this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
    this.domNode.appendChild(CatchEdge.prototype.createHandlerImage.apply(this, arguments));
    this.domNode.appendChild(RetryEdge.prototype.createHandlerImage.apply(this, arguments));
  };
  awssfStateHandler.apply(this, arguments);
};
MapState.prototype.handler = MapStateHandler;
mxUtils.extend(MapStateHandler, awssfStateHandler);
