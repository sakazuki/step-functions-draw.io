import { createPoint } from "./helper";

const StartPoint = function () {};
StartPoint.prototype.type = 'Start';
StartPoint.prototype.create = function (geometry) {
  var cell = createPoint(this, geometry);
  return cell;
};
StartPoint.prototype.createDefaultEdge = function () {
  return StartAtEdge.prototype.create();
};

const EndPoint = function () {};
EndPoint.prototype.type = 'End';
EndPoint.prototype.create = function () {
  var cell = createPoint(this);
  return cell;
};

export { StartPoint, EndPoint };

