import * as awssfUtils from "../utils";

export const awssfImportDialog = function (editorUi, title) {
  const graph = editorUi.editor.graph;

  function recurseStates (states) {
    const res = {hash: {}, list: []};
    let cell;
    for (const name in states) {
      const body = states[name];
      if (body.Type === "Pass") {
        cell = PassState.prototype.create(name, body);
      } else if (body.Type === "Task") {
        cell = TaskState.prototype.create(name, body);
      } else if (body.Type === "Choice") {
        cell = ChoiceState.prototype.create(name, body);
      } else if (body.Type === "Wait") {
        cell = WaitState.prototype.create(name, body);
      } else if (body.Type === "Succeed") {
        cell = SucceedState.prototype.create(name, body);
      } else if (body.Type === "Fail") {
        cell = FailState.prototype.create(name, body);
      } else if (body.Type === "Parallel") {
        cell = ParallelState.prototype.create(name, body);
        for(const branch in body.Branches) {
          const _sub = recurseStates(body.Branches[branch].States);
          for(const _cell of _sub.list) cell.insert(_cell);
          Object.assign(res.hash, _sub.hash);
        }
      } else if (body.Type === "Map") {
        cell = MapState.prototype.create(name, body);
        const _sub = recurseStates(body.Iterator.States);
        for(const _cell of _sub.list) cell.insert(_cell);
        Object.assign(res.hash, _sub.hash);
      }
      res.hash[name] = cell;
      res.list.push(cell);
    }
    return res;
  }

  function recurseEdges (json, vertexes, sp, ep?) {
    var res = [];
    var edge;
    if (json.StartAt && sp) {
      edge = StartAtEdge.prototype.create();
      edge.source = sp;
      edge.target = vertexes[json.StartAt];
      res.push(edge);
    }
    for (var name in json.States) {
      var body = json.States[name];
      if (body.Default && vertexes[body.Default]) {
        edge = DefaultEdge.prototype.create('Default', vertexes[name], vertexes[body.Default]);
        res.push(edge);
      }
      if (body.Next && vertexes[body.Next]) {
        edge = NextEdge.prototype.create('Next', vertexes[name], vertexes[body.Next]);
        res.push(edge);
      }
      if (body.End || (body.Type && body.Type.match(/(Succeed|Fail)/))) {
        if (ep) {
          edge = NextEdge.prototype.create('Next', vertexes[name], ep);
          res.push(edge);
        }
      }
      if (body.Retry) {
        for (const r in body.Retry) {
          edge = RetryEdge.prototype.create('Retry', vertexes[name], body.Retry[r], body.Retry.length - Number(r));
          res.push(edge);
        }
      }
      if (body.Catch && body.Catch.length > 0) {
        for (const i in body.Catch) {
          edge = CatchEdge.prototype.create('Catch', vertexes[name], vertexes[body.Catch[i].Next], body.Catch[i], body.Catch.length - Number(i));
          res.push(edge);
        }
      }
      if (body.Choices && body.Choices.length > 0) {
        for (const i in body.Choices) {
          edge = ChoiceEdge.prototype.create('Choice', vertexes[name], vertexes[body.Choices[i].Next], body.Choices[i], body.Choices.length - Number(i));
          res.push(edge);
        }
      }
      if (body.Type === "Parallel") {
        for(const branch of body.Branches) {
          const _sp = vertexes[name].getChildAt(0);
          const tmp = recurseEdges(branch, vertexes, _sp);
          tmp.map(v => vertexes[name].insert(v));
        }
      }
      if (body.Type === "Map") {
        const _sp = vertexes[name].getChildAt(0);
        const tmp = recurseEdges(body.Iterator, vertexes, _sp);
        tmp.map(v => vertexes[name].insert(v));
      }
    }
    return res;
  }

  function parse (text) {
    var json;
    if (text[0] === '{') {
      json = JSON.parse(text.trim());
    } else {
      json = jsyaml.load(text.trim());
    }
    var root = graph.getModel().getRoot();
    root.setAttribute("comment", json.Comment || "");
    root.setAttribute("timeout_seconds", json.TimeoutSeconds || "");
    root.setAttribute("version", json.Version || "");
    var res = recurseStates(json.States);
    var inserted = res.list;
    var vertexes = res.hash;
    var sp = StartPoint.prototype.create();
    inserted.unshift(sp);
    var ep = EndPoint.prototype.create();
    inserted.push(ep);
    var tmp = recurseEdges(json, vertexes, sp, ep);
    inserted.push(...tmp);
    graph.getModel().beginUpdate();
    try {
      graph.addCells(inserted);
      graph.fireEvent(new mxEventObject('cellsInserted', 'cells', inserted));
    } finally {
      graph.getModel().endUpdate();
    }
    return inserted;
  }

  function executeLayout (cells) {
    graph.setSelectionCells(cells);
    graph.getModel().beginUpdate();
    try {
      var parallels = cells.filter(function (v) { return v.awssf.type.match(/Parallel|Map/); });
      var parallelLayout = new mxCompactTreeLayout(graph, false);
      parallelLayout.edgeRouting = false;
      parallelLayout.levelDistance = 30;
      parallelLayout.groupPadding = 30;
      for (var p in parallels) {
        parallelLayout.execute(parallels[p], parallels[p].getChildAt(0));
      }
      var layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_NORTH);
      layout.intraCellSpacing = 40;
      layout.interRankCellSpacing = 40;
      layout.interHierarchySpacing = 40;
      layout.parallelEdgeSpacing = 10;
      layout.execute(graph.getDefaultParent(), [cells[0]]);
    } finally {
      // New API for animating graph layout results asynchronously
      var morph = new mxMorphing(graph);
      morph.addListener(mxEvent.DONE, mxUtils.bind(this, function () {
        graph.getModel().endUpdate();
      }));
      morph.startAnimation();
    }
  }

  var div = document.createElement('div');
  var h3 = document.createElement('h2');
  mxUtils.write(h3, title);
  h3.style.marginTop = '0px';
  h3.style.marginBottom = '24px';
  div.appendChild(h3);
  var span = document.createElement('span');
  mxUtils.write(span, 'Paste statemachine definition JSON or YAML');
  div.appendChild(span);

  var form = new mxForm('properties');
  form.table.style.width = '100%';
  form.table.style.paddingRight = '20px';
  var defaultValue = '';
  var textarea = form.addTextarea('', defaultValue, 25);
  textarea.style.width = '100%';
  textarea.style.marginBottom = '16px';
  div.appendChild(form.table);

  var form2 = new mxForm('properties');
  form2.table.style.width = '100%';
  form2.table.style.paddingRight = '20px';
  var colgroupName = document.createElement('colgroup');
  colgroupName.width = '120';
  form2.table.insertBefore(colgroupName, form2.body);
  var colgroupValue = document.createElement('colgroup');
  form2.table.insertBefore(colgroupValue, form2.body);

  var select = document.createElement('select');
  form2.addField('StateMachine:', select);
  if (awssfUtils.inCarlo() && awssfUtils.setupAWSconfig()) {
    __listStateMachines().then(function (data) {
      for (var j in data.stateMachines) {
        var option = document.createElement('option');
        mxUtils.writeln(option, data.stateMachines[j].name);
        option.setAttribute('value', data.stateMachines[j].stateMachineArn);
        select.appendChild(option);
      }
    });
    mxEvent.addListener(select, 'change', function () {
      __describeStateMachine(select.value).then(function (newData) {
        if (textarea.value.length == 0 || textarea.value == defaultValue) {
          defaultValue = newData.definition;
          textarea.value = defaultValue;
        }
      });
    });
  } else {
    var option = document.createElement('option');
    mxUtils.writeln(option, 'Select a StateMachine...');
    select.appendChild(option);
    select.disabled = true;
  }
  div.appendChild(form2.table);
  var buttons = document.createElement('div');
  buttons.style.marginTop = '18px';
  buttons.style.textAlign = 'right';
  this.init = function () {
    textarea.focus();
  };
  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    if (textarea.value == defaultValue) {
      editorUi.hideDialog();
    } else {
      editorUi.confirm(mxResources.get('areYouSure'), function () {
        editorUi.hideDialog();
      });
    }
  });

  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
  }

  var okBtn = mxUtils.button(mxResources.get('awssfImportBtn'), function () {
    try {
      var cells = parse(textarea.value);
      editorUi.hideDialog();
      executeLayout(cells);
    }catch(err) {
      alert(err);
    }
  });
  buttons.appendChild(okBtn);

  okBtn.className = 'geBtn gePrimaryBtn';

  if (!editorUi.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
  }
  div.appendChild(buttons);
  this.container = div;
};

export const awssfDeployDialog = function (editorUi, title) {
  var graph = editorUi.editor.graph;
  var params = {
    definition: JSON.stringify(awssfUtils.getStepFunctionDefinition(), null, "  "),
    name: graph.getModel().cells[0].getAttribute("name") || "",
    roleArn: graph.getModel().cells[0].getAttribute("role_arn") || "",
    stateMachineArn: graph.getModel().cells[0].getAttribute("state_machine_arn") || ""
  };

  var div = document.createElement('div');

  var h3 = document.createElement('h2');
  mxUtils.write(h3, title);
  h3.style.marginTop = '0px';
  h3.style.marginBottom = '24px';
  div.appendChild(h3);

  var form = new mxForm('properties');
  form.table.style.width = '100%';
  form.table.style.paddingRight = '20px';
  var colgroupName = document.createElement('colgroup');
  colgroupName.width = '120';
  form.table.insertBefore(colgroupName, form.body);
  var colgroupValue = document.createElement('colgroup');
  form.table.insertBefore(colgroupValue, form.body);

  var select = document.createElement('select');
  var defaultOption = document.createElement('option');
  mxUtils.writeln(defaultOption, 'Create a new statemachine');
  defaultOption.setAttribute('selected', 'true');
  select.appendChild(defaultOption);
  defaultOption.setAttribute('value', '__CREATE__');
  __listStateMachines().then(function (data) {
    for (var j in data.stateMachines) {
      var option = document.createElement('option');
      mxUtils.writeln(option, data.stateMachines[j].name);
      option.setAttribute('value', data.stateMachines[j].stateMachineArn);
      if (params.stateMachineArn == data.stateMachines[j].stateMachineArn) {
        option.setAttribute('selected', 'true');
      }
      select.appendChild(option);
    }
  });
  form.addField('StateMachine:', select);

  mxEvent.addListener(select, 'change', function () {
    __describeStateMachine(select.value).then(function (data) {
      if (textarea.value.length == 0 || textarea.value == defaultValue) {
        arnInput.value = data.stateMachineArn;
        nameInput.value = data.name;
        roleInput.value = data.roleArn;
      }
    });
  });

  var arnInput = form.addText('StaeMachineArn:', params.stateMachineArn);
  arnInput.style.width = '100%';

  var nameInput = form.addText('Name:', params.name);
  nameInput.style.width = '100%';

  var roleInput = form.addText('Role:', params.roleArn);
  roleInput.style.width = '100%';

  var defaultValue = params.definition;
  var textarea = form.addTextarea('Definition:', defaultValue, 30);
  textarea.style.width = '100%';

  div.appendChild(form.table);
  var buttons = document.createElement('div');
  buttons.style.marginTop = '18px';
  buttons.style.textAlign = 'right';

  this.init = function () {
    nameInput.focus();
  };
  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    if (textarea.value == defaultValue) {
      editorUi.hideDialog();
    } else {
      editorUi.confirm(mxResources.get('areYouSure'), function () {
        editorUi.hideDialog();
      });
    }
  });

  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
  }

  var okBtn = mxUtils.button(mxResources.get('awssfDeployBtn'), function () {
    var params = {
      name: nameInput.value,
      definition: textarea.value,
      roleArn: roleInput.value
    };
    if (select.value !== '__CREATE__') {
      //@ts-ignore
      params.stateMachineArn = arnInput.value;
      delete params.name;
      if (!params.roleArn) delete params.roleArn;
      if (!params.definition) delete params.definition;
    }
    __deployStateMachine(params).then(() => {
      editorUi.hideDialog();
    }).catch(err => {
      alert(err.message);
    });
  });
  buttons.appendChild(okBtn);

  okBtn.className = 'geBtn gePrimaryBtn';

  if (!editorUi.editor.cancelFirst) {
    buttons.appendChild(cancelBtn);
  }
  div.appendChild(buttons);
  this.container = div;
};

export const awssfExportDialog = function (editorUi, title, value) {
  var div = document.createElement('div');

  var h3 = document.createElement('h2');
  mxUtils.write(h3, title);
  h3.style.marginTop = '0px';
  h3.style.marginBottom = '24px';
  div.appendChild(h3);
  var form = new mxForm('properties');
  form.table.style.width = '100%';
  form.table.style.paddingRight = '20px';
  var textarea = form.addTextarea('', value, 25);
  textarea.style.width = '100%';
  textarea.style.marginBottom = '16px';
  textarea.readOnly = true;
  div.appendChild(form.table);
  var buttons = document.createElement('div');
  buttons.style.marginTop = '18px';
  buttons.style.textAlign = 'right';
  this.init = function () {
    textarea.focus();
    textarea.scrollTop = 0;
  };
  var copyBtn = mxUtils.button(mxResources.get('copy'), function () {
    const range = document.createRange();
    range.selectNode(textarea);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    range.detach();
  });
  copyBtn.className = 'geBtn gePrimaryBtn';
  buttons.appendChild(copyBtn);

  var cancelBtn = mxUtils.button(mxResources.get('close'), function () {
    editorUi.hideDialog();
  });
  cancelBtn.className = 'geBtn';
  buttons.appendChild(cancelBtn);
  div.appendChild(buttons);
  this.container = div;
};
