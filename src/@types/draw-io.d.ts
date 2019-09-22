
declare namespace Draw {
  function loadPlugin(plugin: Function): void
}
declare module Editor {
  const helpImage: string
}

declare let Graph
declare let EditDataDialog

declare namespace ui {
  const editor: mxEditor
  const graph: mxGraph
  const toggleScratchpad
  const actions
  const sidebar
  const menubar
  const menus
  function showDialog(elt, w, h, modal, closable, onClose?, noScroll?, transparent?, onResize?, ignoreBgClick?)
  function addListener( node, event, listener?)
}