import * as awssfUtils from "../utils";
import { registCodec, createState, awssfStateHandler } from "./helper";

export const WaitState = function () {};
WaitState.prototype.type = 'Wait';
WaitState.prototype.create = function (label, json) {
  if (!json) json = {};
  var style = 'shape=mxgraph.flowchart.delay;whiteSpace=wrap;gradientColor=none;html=1;';
  var cell = createState(this, label, style, json);
  var found = false;
  var options = WaitState.prototype.cst.DURATION_FORMAT;
  for(var j in options) {
    var key = awssfUtils.camelToSnake(options[j]);
    if (json[options[j]]) {
      cell.setAttribute(key, json[options[j]]);
      found = true;
    } else {
      cell.value.removeAttribute(key);
    }
  }
  if (!found) cell.setAttribute('seconds', '');
  return cell;
};
WaitState.prototype.createDefaultEdge = function (src) {
  for (var i in src.edges) {
    var edge = src.edges[i];
    if ((edge.source == src) && awssfUtils.isNext(edge))
      return null;
  }
  return NextEdge.prototype.create();
};
WaitState.prototype.cst = {
  DURATION_FORMAT: ["Seconds", "SecondsPath", "Timestamp", "TimestampPath"]
};
WaitState.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (awssfUtils.validateNumber(cell.getAttribute("seconds")) == false) {
    res.push("seconds MUST be number");
  }
  if (awssfUtils.validateTimestamp(cell.getAttribute("timestamp")) == false) {
    res.push("timestamp MUST be valid formated");
  }
  if (awssfUtils.validateJsonPath(cell.getAttribute("seconds_path")) == false) {
    res.push("second_path MUST use only supported jsonpath");
  }
  if (awssfUtils.validateJsonPath(cell.getAttribute("timestamp_path")) == false) {
    res.push("timestamp_path MUST use only supported jsonpath");
  }
  if (!(cell.getAttribute("seconds") || cell.getAttribute("timestamp") || cell.getAttribute("seconds_path") || cell.getAttribute("timestamp_path"))) {
    res.push('A Wait state MUST contain exactly one of ”Seconds”, “SecondsPath”, “Timestamp”, or “TimestampPath”');
  }
  return awssfUtils.validateCommonAttributes(cell, res, false);
};
WaitState.prototype.expJSON = function (cell, cells) {
  var data = {};
  var label = cell.getAttribute("label");
  data[label] = {
    Type: "Wait"
  };
  if (cell.getAttribute("comment"))
    data[label].Comment = cell.getAttribute("comment");
  if (cell.getAttribute("input_path"))
    data[label].InputPath = awssfUtils.adjustJsonPath(cell.getAttribute("input_path"));
  if (cell.getAttribute("output_path"))
    data[label].OutputPath = awssfUtils.adjustJsonPath(cell.getAttribute("output_path"));

  var options = this.cst.DURATION_FORMAT;
  for(var j in options) {
    var key = awssfUtils.camelToSnake(options[j]);
    if (cell.getAttribute(key)) {
      if (cell.getAttribute(key).match(/^\d+/)) {
        data[label][options[j]] = Number(cell.getAttribute(key));
      }else{
        data[label][options[j]] = cell.getAttribute(key);
      }
      break;
    }
  }
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
WaitState.prototype.buildForm = function (form, attrName, attrValue) {
  if (['label', 'comment', 'input_path', 'output_path'].indexOf(attrName) == -1) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    var select = document.createElement('select');
    var options = this.cst.DURATION_FORMAT;
    for(var j in options) {
      var option = document.createElement('option');
      mxUtils.writeln(option, options[j]);
      option.setAttribute('value', awssfUtils.camelToSnake(options[j]));
      if (attrName == awssfUtils.camelToSnake(options[j])) {
        option.setAttribute('selected', 'true');
      }
      select.appendChild(option);
    }
    td.appendChild(select);
    tr.appendChild(td);
    td = document.createElement('td');
    const input = document.createElement('textarea');
    input.setAttribute('rows', '2');
    input.style.width = '100%';
    input.value = attrValue;
    td.appendChild(input);
    tr.appendChild(td);
    form.body.appendChild(tr);
    return [select, input];
  } else if (attrName != 'placeholders') {
    const input = form.addTextarea(attrName + ':', attrValue, 2);
    input.style.width = '100%';
    return [attrName, input];
  } else{
    return null;
  }
};
WaitState.prototype.applyForm = function (value, name, text) {
  var removeLabel = false;
  if (text == null) {
    value.removeAttribute(name);
  } else {
    if (typeof(name) == 'object') {
      for (var i in this.cst.DURATION_FORMAT) {
        var n = awssfUtils.camelToSnake(this.cst.DURATION_FORMAT[i]);
        if ( n == name.value ) {
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
};
registCodec('WaitState', WaitState);
var WaitStateHandler = function (state) {
  this.custom = function () {
    this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
  };
  awssfStateHandler.apply(this, arguments);
};
WaitState.prototype.handler = WaitStateHandler;
mxUtils.extend(WaitStateHandler, awssfStateHandler);
