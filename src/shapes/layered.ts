export const LayeredShape = function () {};
LayeredShape.prototype = new mxSwimlane(); //mxActor();
LayeredShape.prototype.constructor = LayeredShape;
LayeredShape.prototype.isHorizontal = function () {return false;};
LayeredShape.prototype.paintVertexShape = function (c, x, y, w, h) {
  c.translate(x, y);
  var dx = Math.max(0, Math.min(w, parseFloat(mxUtils.getValue(this.style, 'dx', this.dx))));
  dx = Math.min(w * 0.5, h * 0.5, dx);
  
  c.begin();
  c.moveTo(w - dx * 0.5, dx);
  c.lineTo(w, dx);
  c.lineTo(w, h);
  c.lineTo(dx, h);
  c.lineTo(dx, h - dx * 0.5);
  c.lineTo(w - dx * 0.5, h - dx * 0.5);
  c.close();
  c.fillAndStroke();
  
  c.begin();
  c.moveTo(w - dx, dx * 0.5);
  c.lineTo(w - dx * 0.5, dx * 0.5);
  c.lineTo(w - dx * 0.5, h - dx * 0.5);
  c.lineTo(dx * 0.5, h - dx * 0.5);
  c.lineTo(dx * 0.5, h - dx);
  c.lineTo(w - dx, h - dx);
  c.close();
  c.fillAndStroke();
  
  c.begin();
  c.moveTo(0, 0);
  c.lineTo(w - dx, 0);
  c.lineTo(w - dx, h - dx);
  c.lineTo(0, h - dx);
  c.close();
  c.stroke();

  c.begin();
  c.moveTo(0, this.startSize);
  c.lineTo(w - dx, this.startSize);
  c.stroke();
};

mxCellRenderer.registerShape('awssf.layered', LayeredShape);
Graph.handleFactory['awssf.layered'] = function (state) {
  var handles = [];
  handles.push(...Graph.handleFactory['swimlane'](state));
  // handles.push(...Graph.handleFactory['mxgraph.basic.layered_rect'](state));
  return handles;
};
