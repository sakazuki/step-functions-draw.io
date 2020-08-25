import * as awssfUtils from "../utils";
import { registCodec, createEdge, awssfEdgeHandler } from "./helper";

const StartAtEdge = function () {};
StartAtEdge.prototype.type = 'StartAt';
StartAtEdge.prototype.create = function (label, source, target) {
  if (label == null ) label = this.type;
  var cell = createEdge(this, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;', source, target);
  return cell;
};
StartAtEdge.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!(cell.source && cell.target)) {
    res.push("edge MUST be connected");
  }
  return res;
};
StartAtEdge.prototype.expJSON = function (cell, cells) {
  if (cell.target != null) {
    var data = {
      StartAt: cells[cell.target.id].getAttribute("label")
    };
    return data;
  }else{
    return {};
  }
};
StartAtEdge.prototype.handler = awssfEdgeHandler;
registCodec('StartAtEdge', StartAtEdge);


const NextEdge = function () {};
NextEdge.prototype.type = 'Next';
NextEdge.prototype.create = function (label, source, target) {
  if (label == null ) label = this.type;
  var cell = createEdge(this, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;', source, target);
  return cell;
};
NextEdge.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!(cell.source && cell.target)) {
    res.push("edge MUST be connected");
  }
  return res;
};
NextEdge.prototype.expJSON = function (cell, cells) {
  if (cell.target != null) {
    var data = {
      Next: cells[cell.target.id].getAttribute("label")
    };
    return data;
  }else{
    return {};
  }
};
NextEdge.prototype.createHandlerImage = function () {
  var img = awssfUtils.createHandlerImage.call(this, NextEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAB30lEQVRIS72VsU4CQRRFj52ddCZU0tpo4h/YYKkUNhRCYgyJhfIFakNjoR9goiiJiY12kBBsaSDRL9A/EBtojJjLZNhlnIVdjU612Z097819d96bGw6HQ/5ozcWBv77C8zM8PcHqKqyswNLS7Iwi4b0elMvw8AB6dlcqBZubcHYGevYtL1zAYtEP9QW5vDSB3PUNXihAtTr7yO6OgwM4P598OwFXxltbycH2j/v7yROM4dI1kwmkWF+H62v4/ASd5vExCHpxAdvbsL8PNzfBe2n/8hLUYAx35bDwdBqaTchmZ8O1Y2cHrq7M3jFcUd/fA4CFDwagAKencHxsvkdlrm/ivL2F4PKxJAkvC2+1YG0NFhZgbw/q9elwMSSN7sEoc18hLbzRgG4XKhXodCCXM972ae4WdgTXcU9O/JkLvrsLtZpxkuy2uDgdfnRkJIyVueDLy3B3Z+Rpt2Fj47tbvJlP09xmrh9LJSPPxwfMz0fDJzS3Vfa5JQzXPt3efB76fT9cJ7O9aKbPXbjkub017nIvUaTPFU32CWeftBEoa0lsu+T/9Bab5U+7orVf+LSR/VxB4kgkKdRLYvVzG1k1ODw0k8gXRFABdakSTSK3kCqS5qedoZqjv5qhSZ3i2/8FknYly43Hp8kAAAAASUVORK5CYII=');
  return img;
};
NextEdge.prototype.handler = awssfEdgeHandler;
registCodec('NextEdge', NextEdge);


const RetryEdge = function () {};
RetryEdge.prototype.type = 'Retry';
RetryEdge.prototype.create = function (label, source, json, weight) {
  if (label == null ) label = this.type;
  if (!json) json = {ErrorEquals: '', InterValSeconds: 1, MaxAttempts: 3, BackoffRate: 2};
  var cell = createEdge(this, label, 'edgeStyle=orthogonalEdgeStyle;curved=1;html=1;exitX=0.5;exitY=1;entryX=1;entryY=0.5;startArrow=none;startFill=0;jettySize=auto;orthogonalLoop=1;strokeColor=#000000;strokeWidth=1;fontSize=12;', source, source);
  cell.geometry.setTerminalPoint(new mxPoint(0, cell.geometry.height), true);
  cell.geometry.setTerminalPoint(new mxPoint(cell.geometry.width, 0), false);
  // cell.setAttribute('label', '%error_equals%');
  cell.setAttribute('placeholders', 1);
  cell.setAttribute('error_equals', json.ErrorEquals || '');
  cell.setAttribute('interval_seconds', json.IntervalSeconds || '');
  cell.setAttribute('max_attempts', json.MaxAttempts || '');
  cell.setAttribute('backoff_rate', json.BackoffRate || '');
  cell.setAttribute('weight', weight || 1);
  return cell;
};
RetryEdge.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!(cell.source && cell.target)) {
    res.push("edge MUST be connected");
  }
  if ((cell.source && cell.target) && (cell.source.id != cell.target.id)) {
    res.push("retry edge target MUST be self");
  }
  if (!cell.getAttribute("error_equals")) {
    res.push("error_equals MUST be a non-empty");
  }
  if (awssfUtils.validateNumber(cell.getAttribute("interval_seconds")) == false) {
    res.push("interval_seconds MUST be a positive integer");
  }
  if (awssfUtils.validateNumber(cell.getAttribute("max_attempts")) == false) {
    res.push("max_attempts MUST be greater than or equal to 0");
  }
  if ((awssfUtils.validateNumber(cell.getAttribute("backoff_rate")) == false) && (Number(cell.getAttribute("backoff_rate")) >= 1)) {
    res.push("backoff_rate MUST be greater than or equal to 1.0");
  }
  return res;
};
RetryEdge.prototype.expJSON = function (cell, cells) {
  var errors = cell.getAttribute("error_equals");
  errors = errors ? errors.split(/,\s*/) : [];
  if (cell.target != null) {
    var data = {
      ErrorEquals: errors,
      IntervalSeconds: Number(cell.getAttribute("interval_seconds")),
      MaxAttempts: Number(cell.getAttribute("max_attempts")),
      BackoffRate: Number(cell.getAttribute("backoff_rate"))
    };
    return data;
  }else{
    return {};
  }
};
RetryEdge.prototype.createHandlerImage = function () {
  var img = awssfUtils.createHandlerImage.call(this, RetryEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACCUlEQVRIS7WVTUhUURTHf7NRN+JsUkER3UUI5kJMIoqBMNzkR6C7Elq5UReh0sIkgsCF0yJw5wdi2MYPEAyxLAhcuNBcFKLM4EJ0oU5I+FF648zzNe++d5/MM72rx7vn/M///s9XSCmlOO/EE7C8DUtbcDMfyvKgOHyui30ZMoInDqH9A0z8APl2n3AW1F6HvmqQb5/jBRfA5kkzqCnIwEMrkOHo4E8mYGg5rSdrRq2VEH3g8UuBC+O6seDAtsd4o+cFFrjoWvImJUWkBIbroCBbD3aiYH0XXn6BkW/6nWgfa9VyYIG75bDBZ9bg6VQKpKUCnt+BnQN49B5Wd/QAj8tgsPbfPws8/Bp+HqUM/cDFQpwlgS3TMLriZb/X4QCP7amkJM5zUXDBEGnO+iCkxr8rTyJN4NkZ0FwOHbdhcx8iQ7B/7C0AR2JDqvuTouezmbk7oX9OrU59NgvzcXNldd+FF/eSd+kxv1UIvfehNBeiC3jIOMNozNPV/MY1eNcARTnQNQf9i2bmmuZBqqWpFN7WwK/fJMv3Y0wPkJMJiU5XKaZb5+L2KgLtVfB1A+rH9KQa61w6tDiq13rQQSCs422GDhWgK5stNsuLTkVH+TkfbJ7nEsQ5DvwkEinscWCw8d9EbTOWVKYgAirzRWZ4oE3kZiA7VLrS3qGyR/9rhwatFB97syyXBP4Xec8Ry9TpbfEAAAAASUVORK5CYII=');
  return img;
};
RetryEdge.prototype.handler = awssfEdgeHandler;
registCodec('RetryEdge', RetryEdge);

const CatchEdge = function () {};
CatchEdge.prototype.type = 'Catch';
CatchEdge.prototype.create = function (label, source, target, json, weight) {
  if (label == null ) label = this.type;
  if (!json) json = {};
  var cell = createEdge(this, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;', source, target, json);
  // cell.setAttribute('label', '%error_equals%');
  cell.setAttribute('placeholders', 1);
  cell.setAttribute('error_equals', json.ErrorEquals || '');
  cell.setAttribute('result_path', json.ResultPath || '');
  cell.setAttribute('weight', weight || '1');
  return cell;
};
CatchEdge.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!(cell.source && cell.target)) {
    res.push("edge MUST be connected");
  }
  if (!cell.getAttribute("error_equals")) {
    res.push("error_equals MUST be a non-empty");
  }
  if (awssfUtils.validateJsonPath(cell.getAttribute("result_path")) == false) {
    res.push("result_path MUST use only supported jsonpath");
  }
  return res;
};
CatchEdge.prototype.expJSON = function (cell, cells) {
  var errors = cell.getAttribute("error_equals");
  errors = errors ? errors.split(/,\s*/) : [];
  if (cell.target != null) {
    var data = {
      ErrorEquals: errors,
      Next: cells[cell.target.id].getAttribute("label")
    };
    if (cell.getAttribute("result_path"))
      //@ts-ignore
      data.ResultPath = awssfUtils.adjustJsonPath(cell.getAttribute("result_path"));
    return data;
  }else{
    return {};
  }
};
CatchEdge.prototype.createHandlerImage = function () {
  var img = awssfUtils.createHandlerImage.call(this, CatchEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACFklEQVRIS7WVT0hUURTGf5NRbsRZBLlImHZKwRREM2Cg48YWoRNE2SIq3BSloxudTToqkUXguBSCDEFsETMtRmqlxSi2CLIg3ESDDEOhlOJmimDi+Ob5/t2Z8RXe1Xv3nfed737nu+d4CoVCgX1anj2Bb2bg+wp8+wB1p+CoH7y+ipRKg+c34XUfrCZBnu2r2gsNYWgbB3lWLDW4AL68qQZVJel4qiWyLSd48gasPKt4ZEdAIALn45ZtK7gwfn7RPbD+x5WE5QQGuOg6cdwpxekuCEbgSCMcOAh/8rCWhvl7kF22EhHtI193a2CAq+Rova8BZ9/B21HIvdfeRYLtHLy4CuufrQn81yE8tbNngI954deWEXgsCJdm4ccXmA3D723jW2gEznbDchzeDDvZD/w0gYuPRRLzah6EYB+kH8DiI3d1EGm8viJzVSHbn8CJy5C6Ax+n3YEXC6vJshBzHu/CJJzshLm77sGbh6AlVoZ5Uz80DcDiQ6csh2rgXBQ2VtWJLcxVmpcraKAHQqPwaQZSt52SWTSXz3a3yJ7ZikuPNX/rVpR7kbjm9PrhWohqvai8zyVCpDlzC2rrwVNV/hJJvNLnwiTus3rdnUdAWPdmFDdUgPatt+gs/7UrFu1nPmzpfi5JzO2glEQihfSSPfVzHURq8KpXk0qVREAFUHq4q0lkZyn3QOanPkNljv7XDHXrFEX8X1YGE8t/bBUwAAAAAElFTkSuQmCC');
  return img;
};
CatchEdge.prototype.handler = awssfEdgeHandler;
registCodec('CatchEdge', CatchEdge);

const ChoiceEdge = function () {};
ChoiceEdge.prototype.type = 'Choice';
ChoiceEdge.prototype.create = function (label, source, target, json, weight) {
  if (label == null ) label = this.type;
  if (!json) json = {};
  var cell = createEdge(this, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;', source, target);
  // cell.setAttribute('label', '%condition%');
  cell.setAttribute('placeholders', 1);
  cell.setAttribute('condition', awssfUtils.ruleToJSEP(json) || '$.foo == 1');
  cell.setAttribute('weight', weight || '1');
  return cell;
};
ChoiceEdge.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!(cell.source && cell.target)) {
    res.push("edge MUST be connected");
  }
  var condition = cell.getAttribute("condition");
  if (condition) {
    try{
      jsep(condition);
    }catch(e) {
      res.push("invalid jsep.");
    }
  }else{
    res.push("condition MUST be defined");
  }
  return res;
};
ChoiceEdge.prototype.expJSON = function (cell, cells) {
  if (cell.target != null) {
    var condition = cell.getAttribute("condition");
    var data;
    if (condition != null) {
      var tree = jsep(condition);
      data = awssfUtils.parseJSEPExpr(tree);
    }
    data.Next = cells[cell.target.id].getAttribute("label");
    return data;
  }else{
    return {};
  }
};
ChoiceEdge.prototype.createHandlerImage = function () {
  var img = awssfUtils.createHandlerImage.call(this, ChoiceEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACWUlEQVRIS7WVXW/SUBjH/12AGZDSDkkwQ40mytCxmC1z6Fx82RUXiiYz8WvMO/0AXrqPoYkandF4t+iWuSXTRMkcu1OUKbFAAWFCy1ZzaoCe9oDUl3PV5pzzO8/L/3keTtM0DV1WsdpAVlaRLSoICi4ERScEj6PbldYex4LX1F08fyNjM7MN8m1ee5x9GAq5ER8TQb47LQs8ldnG49U8E8p65ErMj0jIzeRT8EerObz9UO3JZeOhWNiL+OiA5V4LTiy+tyTZBjcvXJ8KWDzQ4SSuc/NbllCMHtmLWJhHwOdEHwc0djSkpToWkkVk8nXKEBL72cQglQMdzgrH9Iiggwnk5XoJXwp1/f90mMf3Hzu4vyxBKqvUAycPe3A1to9Wy+0Hn1BX24oM+ftxbTKAQkXF3cVvUBrtvYtRARNhL1Y2y3ixXrJYf3PmQBsuV1Rt7skWdejcsA9nhngsvi9hOVW2lYfZy4OtOuA2Plc1cyITp/w4cciDZ2t5vPtoTz3GxHILSVkzu3dp3I8ogb+2Dz8/7MOFqKB7y7R8MsJj6rgPSxvWsLgcnL6XK6tMryjLWTHvltCJY15Mj4hIpit4ulaw5IOKOZGiWS3khlGKr1JlpKVaS4o1ZRcPV3IWrfc7OdyaOUhLsVPZn43wGD/qBe92/LaICJGpc1Khd+YzlNZt6Q8AsfpGImStUAL6b72laeWfdkWj/IweM/s5ecTYDjqFiISC9JKe+nkT8msSFfRQsR4hUAKMjw3Ym0RmK8kM/SoryMoKgqIL+0XX381Qu0rpeYb+KzDh/AQ2ZmDL5ziOTgAAAABJRU5ErkJggg==');
  return img;
};
ChoiceEdge.prototype.handler = awssfEdgeHandler;
registCodec('ChoiceEdge', ChoiceEdge);

const DefaultEdge = function DefaultEdge () {};
DefaultEdge.prototype.type = 'Default';
DefaultEdge.prototype.create = function (label, source, target) {
  if (label == null ) label = this.type;
  var cell = createEdge(this, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;', source, target);
  return cell;
};
DefaultEdge.prototype.validate = function (cell, res) {
  if (!res) res = [];
  if (!(cell.source && cell.target)) {
    res.push("edge MUST be connected");
  }
  return res;
};
DefaultEdge.prototype.expJSON = function (cell, cells) {
  if (cell.target != null) {
    var data = {
      Default: cells[cell.target.id].getAttribute("label")
    };
    return data;
  }else{
    return {};
  }
};
DefaultEdge.prototype.createHandlerImage = function () {
  var img = awssfUtils.createHandlerImage.call(this, DefaultEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABsklEQVRIS9WVO0sDQRDH/9ek0YAQsEgQFCRpxCaKmuoOQRtN7aOxEVtBP0B8gCARrESwsdI+WoggHkGDoH6ABPGJdhYaEY3Fyma53L5yXoIRHLjmduY3s/PYMQghBB5SfAKeC+wLRdkXDHtZuGeGDl4qArk14NYGSm8qKNAMtJtAYg4IBKs7UuAUaKf0UBlDnZgp5kgnApxCC/v+rsxrdY0BiXnVrgKnER9qFPy6GkqrNyjDaY53Rt1UhHsAaxFoauXQBPgsAndZ4HQV+HoX3dIUTeyJNSjD5XQ48IcckF1mkJYOoHsS6BwGro9YXWSJjrAaOFKGb5tiAXVwx8BaAtoGgFwauDpQo5+yOfjrIyG7SVHJCx5LAv2zQD4DnK2r0Y9n3Dkwbo4JkQvpBfc6o674whoXm4RcbvmPPNIHWAvA/YlbD946Pg3EZ9ifmiP/KS1C5LXmfHAFiPSyqOlsyCLk3G+3+GlF2utCt3j1uTxEHy+s/c431CGiN9D2uTyhfkee16s6oVSpYW+LE0G9ryLffvxt/u49d7w2bBPJxazs0DwQiv3CDq2nW3Q22gX9L+Df4kMPyOkzB4MAAAAASUVORK5CYII=');
  return img;
};
DefaultEdge.prototype.handler = awssfEdgeHandler;
registCodec('DefaultEdge', DefaultEdge);

export { StartAtEdge, NextEdge, RetryEdge, CatchEdge, ChoiceEdge, DefaultEdge };
