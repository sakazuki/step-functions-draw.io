declare function mxscript(uri: string)
declare class mxEditor {
  constructor()
  graph: mxGraph

}
declare namespace mxUtils {
  function write(parent, text): void
  function writeln(parent, text): void
  function button(label, funct, doc?): any
  function alert(message: string): void
  function bind(scope, funct): void
  function isNode(value, nodeName?, attributeName?, attributeValue?): boolean
  function createXmlDocument(): any
  function createImage(src: string)
  function convertPoint(container, x, y)
  function findNode( node, attr, value)
  function getPrettyXml(node)
  function extend(ctor, superCtor)
  function getValue(array, key, defaultValue)
}

declare namespace mxEvent {
  function addGestureListeners( node, startListener, moveListener?, endListener? )
  function getClientX( e )
  function getClientY( e )
  function isMouseEvent( evt )
  function consume( evt, preventDefault?, stopPropagation?)
  function addListener( node, event, listener)
  const DONE
}
declare class mxCellState {
  constructor(view, cell, style)
}
declare class mxConnectionHandler {
  createEdgeState(me)
  insertEdge(parent, id, value, source, target, style)
}
declare class mxGraph {
  createEdge(parent, id, value, source, target, style)
  getSelectionCell()
  getModel()
  setCellWarning(cell, warning, img?, isSelect?)
  createHandler(state)
  isMouseInsertPoint()
  getInsertPoint()
  getFreeInsertPoint()
}
  
declare class mxObjectCodec extends mxCodec {
  constructor(instance)
}
declare class mxVertexHandler {
  init()
  redraw()
  destroy(sender?, me?)
  redrawTools: Function
  domNode: any
}
declare class mxEdgeHandler {
  init()
  redraw()
  destroy(sender?, me?)
  redrawTools: Function
  domNode: any
}
declare class mxCell {
  constructor(value?, geometry?, style?)
  vertex: boolean
  edge: boolean
  source: any
  target: any
  value: any
  geometry: any
  setAttribute(name, value)
  getGeometry()
  setGeometry(geometry)
  insert(child, index?)
}
declare class mxGeometry {
  constructor (x, y, width, height)
}
declare class mxPoint {
  constructor(width, height)
}
declare namespace mxResources {
  function add(basename, lan, callback?)
  function get(key, params?: any[], defaultValue?)
  function parse(text)
}
declare class mxEventObject {
  constructor(name, ...args)
}
declare class mxHierarchicalLayout {
  constructor(graph, orientation, deterministic?)
  intraCellSpacing: number
  interRankCellSpacing: number
  interHierarchySpacing: number
  parallelEdgeSpacing: number
  execute(parent, root?)
}
declare namespace mxConstants {
  const DIRECTION_NORTH: number
}
declare namespace mxMorphing {}
declare class mxForm {
  constructor(name)
  table: any
  body: any
  addField(name, input): any
  addTextarea(name, value, rows): any
  addText(name, value, type?): any
}
declare namespace mxCodecRegistry {
  function register(codec)
}
declare class mxCodec {
  constructor()
  encode(enc, obj?)
  decode(dec, node?, into?)
}
declare namespace mxClient {
  const IS_VML
}
declare class mxCompactTreeLayout {
  constructor(graph, horizontal, invert?)
  edgeRouting: boolean
  levelDistance: number
  groupPadding: number
  groupPaddingTop: number
  groupPaddingBottom: number
  execute(parent, root?)
    
}
declare class mxMorphing extends mxAnimation{
  constructor(graph, steps?, ease?, delay?)
}
declare class mxAnimation {
  startAnimation()
  addListener(event, listener)
}
declare class mxSwimlane {
  isHorizontal: boolean | Function
  paintVertexShape: Function
}
declare module mxCellRenderer {
  function registerShape(key, shape)
}
