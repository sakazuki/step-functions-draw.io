var ui;
var graph;

export function init (editorUi) {
  ui = editorUi;
  graph = editorUi.editor ? editorUi.editor.graph : editorUi.graph;
}

export function registCodec (name, func) {
  var codec = new mxObjectCodec(new func());
  codec.encode = function (enc, obj) {
    try{
      var data = enc.document.createElement(name);
    }catch(e) {
      console.log("encode error", e);
    }
    return data;
  };
  codec.decode = function (dec, node, into) {
    return new func();
  };
  mxCodecRegistry.register(codec);
}

function createSettingsIcon () {
  var img = mxUtils.createImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACpklEQVRIS7VVMU9TURg9nWiZoF0k1MQmlKCREhhowUHaScpWdYHoINUORoKTiT+AhMnE6IDigraL2g10amGhxaFGMJHQJiWxBJcWJl6Zas4H9/leH4VKwl2a13vv+c73nfN911ar1Wq4oGVrBpzxq9VDnYLd3gKbzXYmpabAs2s5bBWKCAwOIPstJ7/dXs/5wNMrGfh6e+BytgvA4pcU3J0d6PNdRWp5FZpWxdhoSPbKlT2sb2wieHPIEszC/H08iQNNQ6m0i1DwBhwOu4BPP3kgwUo7u+CZ4MiwBMlkc3C52tDqcODeRMQUwAROVvlCEbHohFz8mFyUw2SpsuA3A/AsAblHAnPzcXi7PAiNDOsBTOBMce5tAk+nJuWCceUL2/qnt+uKaY9EXrx8h9jDcRMJS1nIqFLZx51IWAB+rP+SsjB11p2sy+V9YUwNuD4ll+B0tplY838LuHLG/YnbOnA9I5WhCrAQ/4zuLg8C/gFrzenjjZ+bKO38QWYtp4s3M/vakqq6rQI8f/ZYHPNmPoE+3zW4Oy+h93qP9IEwV+Ixutfrkbpt5YtIr6yKuI0W60z29DwD5PNF6Ye7kTHRTAf/Xdo1NQbB6Rzl55MCUAs6xNhQvHfZ3WEGpyhkTSecm3lhW9jTDDpz1pxdRifQHUrA/6k5LUz30FHsbr3mxpTr3bL0NYVHUbN/lYDhW0d2PNUtRvDGPm+XWlKbcnnP5POmwE/rUAqlVv1EpNtmZl9hemqycYcezZZtxKLjMlsoMld4NGiZLenljIj2b7YkxAwNZwuBmKKmHUrqAX8/WtVUPGZF0Rc+JBEaGcKBVkV27TtcrnY4HC1gVxvXiY8FM6BQzcxzBmPJjIxVgKZfIpaLs4Nu8g/2n/8lqu/GC31DGw6XMzb+An4I4cvYKbPGAAAAAElFTkSuQmCC');
  img.setAttribute('title', 'Settings');
  img.style.cursor = 'pointer';
  img.style.width = '16px';
  img.style.height = '16px';
  return img;
}

export const awssfStateHandler = function (state) {
  mxVertexHandler.apply(this, arguments);
};
awssfStateHandler.prototype = new mxVertexHandler();
awssfStateHandler.prototype.constructor = awssfStateHandler;
awssfStateHandler.prototype.domNode = null;
awssfStateHandler.prototype.init = function () {
  mxVertexHandler.prototype.init.apply(this, arguments);
  this.domNode = document.createElement('div');
  this.domNode.style.position = 'absolute';
  this.domNode.style.whiteSpace = 'nowrap';
  if (this.custom) this.custom.apply(this, arguments);
  var img = createSettingsIcon();
  mxEvent.addGestureListeners(img,
    mxUtils.bind(this, function (evt) { mxEvent.consume(evt);})
  );
  mxEvent.addListener(img, 'click',
    mxUtils.bind(this, function (evt) {
      ui.actions.get('editData').funct();
      mxEvent.consume(evt);
    })
  );
  this.domNode.appendChild(img);
  this.graph.container.appendChild(this.domNode);
  this.redrawTools();
};
awssfStateHandler.prototype.redraw = function () {
  mxVertexHandler.prototype.redraw.apply(this);
  this.redrawTools();
};
awssfStateHandler.prototype.redrawTools = function () {
  if (this.state != null && this.domNode != null) {
    var dy = (mxClient.IS_VML && document.compatMode == 'CSS1Compat') ? 20 : 4;
    this.domNode.style.left = (this.state.x + this.state.width - this.domNode.children.length * 14) + 'px';
    this.domNode.style.top = (this.state.y + this.state.height + dy) + 'px';
  }
};
awssfStateHandler.prototype.destroy = function (sender, me) {
  mxVertexHandler.prototype.destroy.apply(this, arguments);
  if (this.domNode != null) {
    this.domNode.parentNode.removeChild(this.domNode);
    this.domNode = null;
  }
};

export const awssfEdgeHandler = function (state) {
  mxEdgeHandler.apply(this, arguments);
};
awssfEdgeHandler.prototype = new mxEdgeHandler();
awssfEdgeHandler.prototype.constructor = awssfEdgeHandler;
awssfEdgeHandler.prototype.domNode = null;
awssfEdgeHandler.prototype.init = function () {
  mxEdgeHandler.prototype.init.apply(this, arguments);
  this.domNode = document.createElement('div');
  this.domNode.style.position = 'absolute';
  this.domNode.style.whiteSpace = 'nowrap';
  if (this.custom) this.custom.apply(this, arguments);
  var img = createSettingsIcon();
  mxEvent.addGestureListeners(img,
    mxUtils.bind(this, function (evt) { mxEvent.consume(evt);})
  );
  mxEvent.addListener(img, 'click',
    mxUtils.bind(this, function (evt) {
      ui.actions.get('editData').funct();
      mxEvent.consume(evt);
    })
  );
  this.domNode.appendChild(img);
  this.graph.container.appendChild(this.domNode);
  this.redrawTools();
};
awssfEdgeHandler.prototype.redraw = function () {
  mxEdgeHandler.prototype.redraw.apply(this);
  this.redrawTools();
};
awssfEdgeHandler.prototype.redrawTools = function () {
  if (this.state != null && this.domNode != null) {
    var dy = (mxClient.IS_VML && document.compatMode == 'CSS1Compat') ? 20 : 4;
    this.domNode.style.left = (this.labelShape.bounds.x + this.labelShape.bounds.width) + 'px';
    this.domNode.style.top = (this.labelShape.bounds.y) + 'px';
  }
};
awssfEdgeHandler.prototype.destroy = function (sender, me) {
  mxEdgeHandler.prototype.destroy.apply(this, arguments);
  if (this.domNode != null) {
    this.domNode.parentNode.removeChild(this.domNode);
    this.domNode = null;
  }
};

export function createState (awssf, name, style, json?) {
  var label = name || awssf.type;
  if (!style) style = 'rounded=1;whiteSpace=wrap;html=1;gradientColor=none;dashed=1';
  if (!json) json = {};
  var geometry = new mxGeometry(0, 0, 80, 40);
  var cell = new mxCell(label, geometry, style);
  cell.vertex = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', label);
  cell.setAttribute('type', 'awssf' + awssf.type);
  cell.setAttribute('comment', json.Comment || '');
  if (!awssf.type.match(/Fail/)) {
    cell.setAttribute('input_path', json.InputPath || '');
    cell.setAttribute('output_path', json.OutputPath || '');
  }
  if (awssf.type.match(/Pass|Task|Parallel|Map/)) {
    cell.setAttribute('parameters', JSON.stringify(json.Parameters) || '');
    cell.setAttribute('result_path', json.ResultPath || '');
  }
  cell.awssf = awssf;
  return cell;
}

export function createPoint (awssf, geometry?) {
  var label = awssf.type;
  if (geometry == null) {
    geometry = new mxGeometry(0, 0, 40, 40);
  }
  var cell = new mxCell(label, geometry,'ellipse;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;');
  cell.vertex = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', label);
  cell.setAttribute('type', 'awssf' + label);
  cell.awssf = awssf;
  return cell;
}

export function createEdge (awssf, label, style, source, target, json?) {
  var cell = new mxCell(label, new mxGeometry(0, 0, 60, 60), style);
  cell.geometry.setTerminalPoint(new mxPoint(0, 0), true);
  cell.geometry.setTerminalPoint(new mxPoint(cell.geometry.width, cell.geometry.height), false);
  cell.geometry.relative = true;
  cell.edge = true;
  cell.value = mxUtils.createXmlDocument().createElement('object');
  cell.setAttribute('label', label);
  cell.setAttribute('type', 'awssf' + awssf.type);
  cell.awssf = awssf;
  if (source && target) {
    cell.source = source;
    cell.target = target;
  }
  return cell;
}
