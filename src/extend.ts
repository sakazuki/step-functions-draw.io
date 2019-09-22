import * as awssfUtils from "./utils";

const mxGraphCreateEdge = mxGraph.prototype.createEdge;
mxGraph.prototype.createEdge = function (parent, id, value, source, target, style) {
  if (awssfUtils.isAWSsf(source) && source.awssf.createDefaultEdge) {
    return source.awssf.createDefaultEdge(source);
  }else{
    return mxGraphCreateEdge.apply(this, arguments);
  }
};

const mxConnectionHandlerCreateEdgeState = mxConnectionHandler.prototype.createEdgeState;
mxConnectionHandler.prototype.createEdgeState = function (me) {
  var cell = this.previous.cell;
  if (awssfUtils.isAWSsf(cell) && cell.awssf.createDefaultEdge) {
    var edge = cell.awssf.createDefaultEdge(cell);
    if (!edge) return null;
    return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
  }else{
    return mxConnectionHandlerCreateEdgeState.apply(this, arguments);
  }
};

const mxConnectionHandlerInsertEdge = mxConnectionHandler.prototype.insertEdge;
mxConnectionHandler.prototype.insertEdge = function (parent, id, value, source, target, style) {
  var edge = null;
  if (!awssfUtils.isAWSsf(source)) {
    return mxConnectionHandlerInsertEdge.apply(this, arguments);
  }
  if (awssfUtils.isParallelChild(source) || awssfUtils.isParallelChild(target)) {
    if (source.parent != target.parent) return null;
  }
  if (awssfUtils.isMapChild(source) || awssfUtils.isMapChild(target)) {
    if (source.parent != target.parent) return null;
  }
  if ((source == target) && (awssfUtils.isTask(source) || awssfUtils.isParallel(source) || awssfUtils.isMap(source))) {
    edge = RetryEdge.prototype.create();
  } else if (this.edgeState) {
    edge = this.edgeState.cell;
  } else if (source.awssf && source.awssf.createDefaultEdge) {
    edge = source.awssf.createDefaultEdge(source);
  }else{
    return null; // cancel
  }
  if (edge != null) {
    edge = this.graph.addEdge(edge, parent, source, target);
    return edge;
  }else{
    return null;
  }
};


function setupGraphCreateHandler (ui) {
  const origGraphCreateHander = ui.editor.graph.createHandler;
  function awssfCreateHandler (state) {
    if (state != null && (this.getSelectionCells().length == 1) && awssfUtils.isAWSsf(state.cell) && state.cell.awssf.handler) {
      return new state.cell.awssf.handler(state);
    }
    return origGraphCreateHander.apply(this, arguments);
  }
  ui.editor.graph.createHandler = awssfCreateHandler;
}

function setupCellAdded (ui) {
  const mxGraphModelCellAdded = ui.editor.graph.getModel().cellAdded;
  function awssfCellAdded (cell) {
    if (!awssfUtils.isAWSsf(cell)) {
      return mxGraphModelCellAdded.apply(this, arguments);
    }
    var names = {};
    for (const i in this.cells) {
      const a = this.cells[i];
      if (a.isVertex() && a.getAttribute("label")) {
        var _label = a.getAttribute("label");
        if (names[_label]) {
          names[_label].push(a);
        }else{
          names[_label] = [a];
        }
      }
    }
    var label = cell.getAttribute("label");
    if (cell.isVertex() && names[label]) {
      if (!awssfUtils.isStart(cell) && !awssfUtils.isEnd(cell)) {
        var index = 2;
        var newLabel = label.replace(/(\d*)$/, index);
        while(names[newLabel]) {
          index++;
          newLabel = label.replace(/(\d*)$/, index);
        }
        cell.setAttribute("label", newLabel);
      }
    }
    awssfUtils.setupRoot();
    return mxGraphModelCellAdded.apply(this, arguments);
  }
  ui.editor.graph.getModel().cellAdded = awssfCellAdded; 
}

export function setupMisc (ui) {
  setupGraphCreateHandler(ui);
  setupCellAdded(ui);
}

