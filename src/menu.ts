import * as awssfUtils from "./utils";
import {awssfDeployDialog, awssfImportDialog, awssfExportDialog } from "./form/dialog";

let ui;

function editData () {
  var cell = ui.editor.graph.getSelectionCell() || ui.editor.graph.getModel().getRoot();
  if (cell != null) {
    var dlg = new EditDataDialog(ui, cell);
    ui.showDialog(dlg.container, 600, 500, true, false);
    dlg.container.parentNode.style.resize = 'both';
    dlg.init();
  }
}

function popup (title, src) {
  var dlg = new awssfExportDialog(ui, title, src);
  ui.showDialog(dlg.container, 700, 500, true, false);
  dlg.container.parentNode.style.resize = 'both';
  dlg.init();
}

function validate () {
  var checklist = {
    START_EXIST: [false, 'start MUST exist'],
    END_EXIST: [false, 'end MUST exist'],
    UNIQ_NAME: [true, {}, 'name MUST be unique.'],
    NAME_LENGTH: [true, [], 'name MUST BE less than or equal to 128 unicode characters.']
  };
  var model = ui.editor.graph.getModel();
  for(const i in model.cells) {
    const cell = model.cells[i];
    if (cell.awssf && cell.awssf.validate) {
      var res = cell.awssf.validate(cell);
      if (res.length > 0) {
        checklist[label] = [false, [], res.join("\n")];
        ui.editor.graph.setCellWarning(cell, res.join("\n"));
      }else{
        ui.editor.graph.setCellWarning(cell, null);
      }
    }
    if (!cell.isVertex()) continue;
    var label = cell.getAttribute("label");
    if (label != null && !awssfUtils.isStart(cell) && !awssfUtils.isEnd(cell)) {
      if (checklist.UNIQ_NAME[1][label] >= 1) {
        checklist.UNIQ_NAME[0] = false;
        checklist.UNIQ_NAME[1][label] += 1;
      }else{
        checklist.UNIQ_NAME[1][label] = 1;
      }
      if (label.length > 128) {
        checklist.NAME_LENGTH[0] = false;
        //@ts-ignore
        checklist.NAME_LENGTH[1].push(label);
      }
    }
    if (cell.value != null) {
      if (awssfUtils.isStart(cell)) {
        checklist.START_EXIST[0] = true;
      }
      if (awssfUtils.isEnd(cell)) {
        checklist.END_EXIST[0] = true;
      }
    }
  }
  var msg = [];
  for(const i in checklist) {
    if (checklist[i][0] == false) {
      msg.push(checklist[i][checklist[i].length - 1]);
    }
  }
  if(msg.length > 0)
    mxUtils.alert(msg.join("\n"));
}

function exportJson () {
  var data = awssfUtils.getStepFunctionDefinition();
  popup("Export as JSON", JSON.stringify(data, null, "  "));
}

function exportYaml () {
  var data = awssfUtils.getStepFunctionDefinition();
  popup("Export as YAML", jsyaml.dump(data));
}

function exportXml () {
  var encoder = new mxCodec();
  var node = encoder.encode(ui.editor.graph.getModel());
  popup("Export as XML for draw.io", mxUtils.getPrettyXml(node));
}

function importDefinition () {
  var dlg = new awssfImportDialog(ui, 'Import Definition');
  ui.showDialog(dlg.container, 700, 500, true, false);
  dlg.container.parentNode.style.resize = 'both';
  dlg.init();
}

function deploy () {
  if (!(awssfUtils.inCarlo() && awssfUtils.setupAWSconfig())) return;
  var dlg = new awssfDeployDialog(ui, 'Deploy StateMachine Definition');
  ui.showDialog(dlg.container, 800, 600, true, false);
  dlg.container.parentNode.style.resize = 'both';
  dlg.init();
}

export function setupActions (editorUi) {
  ui = editorUi;

  mxResources.parse('stepFunctions=StepFunctions');
  mxResources.parse('awssfValidate=Validate');
  mxResources.parse('awssfImport=Import...');
  mxResources.parse('awssfImportBtn=Import');
  mxResources.parse('awssfExportJSON=Export JSON');
  mxResources.parse('awssfExportYAML=Export YAML');
  mxResources.parse('awssfExport=Export');
  mxResources.parse('awssfLambda=Lambda');
  mxResources.parse('awssfDeploy=Deploy...');
  mxResources.parse('awssfDeployBtn=Deploy');
  
  editorUi.actions.addAction('editData...', editData, null, null, 'Ctrl+M');
  editorUi.actions.addAction('awssfValidate', validate);
  editorUi.actions.addAction('awssfExportJSON', exportJson);
  editorUi.actions.addAction('awssfExportYAML', exportYaml);
  editorUi.actions.addAction('awssfExport', exportXml);
  editorUi.actions.addAction('awssfImport', importDefinition);
  editorUi.actions.addAction('awssfDeploy', deploy).isEnabled = awssfUtils.isSupproted;
  
  function setMenu (_menu, parent) {
    editorUi.menus.addMenuItems(_menu,
      [
        '-',
        'awssfValidate',
        '-',
        'awssfImport',
        'awssfExportJSON',
        'awssfExportYAML',
        'awssfExport',
        '-',
        'awssfDeploy'
      ]
    );
  }
  var menu = editorUi.menubar.addMenu('StepFunctions', setMenu);
  menu.parentNode.insertBefore(menu, menu.previousSibling.previousSibling.previousSibling);

}
