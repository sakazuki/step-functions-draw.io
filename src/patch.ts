export function refreshScratchpadData (ui) {
  var forceReloadScratchPad = function (...v) {
    console.log(">>reload scratchpad", ...v);
    ui.toggleScratchpad();
    ui.toggleScratchpad();
  };
  
  ui.addListener('clientLoaded', forceReloadScratchPad);
}
