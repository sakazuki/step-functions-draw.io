// Avoids having to bind all functions to "this"

export function setupSidebar (editorUi) {
  const sb = editorUi.sidebar;
  function addPalette (content) {
    const vertexes = [
      AWSconfig,
      StartPoint,
      EndPoint,
      TaskState,
      PassState,
      ChoiceState,
      WaitState,
      SucceedState,
      FailState,
      ParallelState,
      MapState
    ];
    for (const vertex of vertexes) {
      const cell = vertex.prototype.create();
      content.appendChild(sb.createVertexTemplateFromCells([cell], cell.geometry.width, cell.geometry.height, cell.label));
    }
  }
  // Adds custom sidebar entry
  sb.addPalette('awsStepFunctions', 'AWS Step Functions', true, addPalette);
  
  // Collapses default sidebar entry and inserts this before
  const c = sb.container;
  c.firstChild.click();
  c.insertBefore(c.lastChild, c.firstChild);
  c.insertBefore(c.lastChild, c.firstChild);

}
