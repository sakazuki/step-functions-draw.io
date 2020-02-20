import { registCodec, createPoint } from "./helper";

const StartPoint = function () {};
StartPoint.prototype.type = 'Start';
StartPoint.prototype.create = function (geometry) {
  var cell = createPoint(this, geometry);
  return cell;
};
StartPoint.prototype.createDefaultEdge = function () {
  return StartAtEdge.prototype.create();
};
registCodec('StartPoint', StartPoint);

const EndPoint = function () {};
EndPoint.prototype.type = 'End';
EndPoint.prototype.create = function () {
  var cell = createPoint(this);
  return cell;
};
registCodec('EndPoint', EndPoint);

export { StartPoint, EndPoint };

