import * as awssfUtils from "../utils";

export function setupEditData () {

  const origEditDataDialog = EditDataDialog;
  
  EditDataDialog = function (editorUi, cell) {
    if (!awssfUtils.isAWSsf(cell)) {
      return origEditDataDialog.apply(this, arguments);
    }
    var div = document.createElement('div');
    var graph = editorUi.editor ? editorUi.editor.graph : editorUi.graph;
  
    div.style.height = '100%'; //'310px';
    div.style.overflow = 'auto';
  
    var value = graph.getModel().getValue(cell);
  
    // Converts the value to an XML node
    if (!mxUtils.isNode(value)) {
      var obj = mxUtils.createXmlDocument().createElement('object');
      obj.setAttribute('label', value || '');
      value = obj;
    }
  
    // Creates the dialog contents
    var form = new mxForm('properties');
    form.table.style.width = '100%';
    form.table.style.paddingRight = '20px';
    var colgroupName = document.createElement('colgroup');
    colgroupName.width = '120';
    form.table.insertBefore(colgroupName, form.body);
    var colgroupValue = document.createElement('colgroup');
    form.table.insertBefore(colgroupValue, form.body);
  
    var attrs = [];
    if (cell.awssf.orderedAttributes) {
      cell.awssf.orderedAttributes.forEach(v => {
        attrs.push(value.attributes.getNamedItem(v));
      });
      for (const attr of value.attributes) {
        if (cell.awssf.orderedAttributes.indexOf(attr.nodeName) === -1) {
          attrs.push(attr);
        }
      }
    } else {
      attrs.push(...value.attributes);
    }
    var names = [];
    var texts = [];
    var count = 0;
  
    var addTextArea = function (index, name, value) {
      names[index] = name;
      texts[index] = form.addTextarea(names[count] + ':', value, 2);
      texts[index].style.width = '100%';
      return texts[index];
    };
  
    var addText = function (index, name, value) {
      names[index] = name;
      texts[index] = form.addText(names[count] + ':', value);
      texts[index].style.width = '100%';
      return texts[index];
    };

    var addJsonEdit = function (index, name, value, autocomplete) {
      names[index] = name;
      const div = document.createElement('div');
      div.id = "jsoneditor";
      div.className = name;
      const options = {
        mode: 'code',
        modes: ['code', 'tree'],
        statusBar: false,
        // enableTransform: false,
        // enableSort: false,
        modalAnchor: div,
        popupAnchor: div
      };
      // @ts-ignore
      if (autocomplete) options.autocomplete = autocomplete;
      const jsonEditor = {
        ed: new JSONEditor(div, options),
        set value (data) {
          try {
            if (data[0] === '{') {
              this.ed.set(JSON.parse(data));
            } else if (data.length > 0) {
              this.ed.set(data);
            }
          } catch (err) {
            this.ed.set(data);
          }
        },
        get value () {
          var data = this.ed.get();
          if (typeof data === 'object') {
            return JSON.stringify(this.ed.get());
          } else {
            return this.ed.get();
          }
        }
      };
      jsonEditor.value = value;
      texts[index] = jsonEditor;
      return form.addField(names[count] + ':', div);
    };
  
    for (var i = 0; i < attrs.length; i++) {
      var nodeName = attrs[i].nodeName;
      var nodeValue = attrs[i].nodeValue;
      if (cell.awssf.hiddenAttributes && cell.awssf.hiddenAttributes.indexOf(nodeName) >= 0) continue;
      if (nodeName == 'type') {
        var span = document.createElement('span');
        mxUtils.write(span, nodeValue);
        form.addField('type:', span);
      } else if ((typeof(AWS) === "object") && (nodeName == 'resource')) {
        const input = addText(count, nodeName, nodeValue);
        count++;
        input.setAttribute("list", "resources");
        const datalist = document.createElement('datalist');
        datalist.id = "resources";
        awssfUtils.getResourceList(function (resources) {
          for (var j in resources) {
            var opt = document.createElement('option');
            opt.value = resources[j];
            datalist.appendChild(opt);
          }
        });
        div.appendChild(datalist);
      } else if (nodeName == 'label' && (awssfUtils.isChoice(cell) || awssfUtils.isRetry(cell) || awssfUtils.isCatch(cell))) {
        const input = addText(count, nodeName, nodeValue);
        count++;
        input.setAttribute("list", "candidates");
        const datalist = document.createElement('datalist');
        datalist.id = "candidates";
        var candidates = [];
        if (attrs["error_equals"]) candidates.push("%error_equals%");
        if (attrs["condition"]) candidates.push("%condition%");
        for (var j in candidates) {
          var opt = document.createElement('option');
          opt.value = candidates[j];
          datalist.appendChild(opt);
        }
        div.appendChild(datalist);
      } else if (nodeName == 'error_equals') {
        const input = addText(count, nodeName, nodeValue);
        count++;
        input.setAttribute("list", "errors");
        const datalist = document.createElement('datalist');
        datalist.id = "errors";
        var errors = [
          "States.ALL",
          "States.Timeout",
          "States.TaskFailed",
          "States.Permissions",
          "States.ResultPathMatchFailure",
          "States.ParameterPathFailure",
          "States.BranchFailed",
          "States.NoChoiceMatched"
        ];
        for (const error of errors) {
          const opt = document.createElement('option');
          opt.value = error;
          datalist.appendChild(opt);
        }
        div.appendChild(datalist);
      } else if (cell.awssf && cell.awssf.buildForm) {
        const res = cell.awssf.buildForm(form, nodeName, nodeValue);
        if (res != null) {
          names[count] = res[0];
          texts[count] = res[1];
          count++;
        }
      } else if (nodeName == 'parameters') {
        const autocomplete = {
          applyTo:['value'],
          filter: 'start',
          trigger: 'focus',
          getOptions: function (text, path, input, editor) {
            return new Promise(function (resolve, reject) {
              if (path[0] !== "") return reject();
              if (input !== 'field') return reject();
              // @ts-ignore
              const resource = $("input[list='resources']")[0].value;
              if (!resource) return reject();
              const options = awssfUtils.awsServiceParameters[resource.replace(/\.[^.]+$/, '')];
              if (options.length === 0) return reject();
              return resolve(options);
            });
          }
        };
        addJsonEdit(count, nodeName, nodeValue, autocomplete);
        count++;
      } else if (/*nodeName != 'label' && */nodeName != 'placeholders') {
        addTextArea(count, nodeName, nodeValue);
        count++;
      }
    }
  
    div.appendChild(form.table);
  
    this.init = function () {
      if (texts.length > 0) {
        texts[0].focus();
      // } else {
      //   nameInput.focus();
      }
    };
  
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
      editorUi.hideDialog.apply(editorUi, arguments);
    });
    cancelBtn.className = 'geBtn';
  
    var applyBtn = mxUtils.button(mxResources.get('apply'), function () {
      try {
        editorUi.hideDialog.apply(editorUi, arguments);
  
        // Clones and updates the value
        value = value.cloneNode(true);
        var removeLabel = false;
  
        for (var i = 0; i < names.length; i++) {
          if (cell.awssf && cell.awssf.applyForm) {
            removeLabel = removeLabel || cell.awssf.applyForm(value, names[i], texts[i]);
          }else{
            if (texts[i] == null) {
              value.removeAttribute(names[i]);
            } else {
              value.setAttribute(names[i], texts[i].value);
              removeLabel = removeLabel || (names[i] == 'placeholder' &&
                value.getAttribute('placeholders') == '1');
            }
          }
        }
  
        // Removes label if placeholder is assigned
        if (removeLabel) {
          value.removeAttribute('label');
        }
  
        // Updates the value of the cell (undoable)
        graph.getModel().setValue(cell, value);
      } catch (e) {
        mxUtils.alert(e);
      }
    });
    applyBtn.className = 'geBtn gePrimaryBtn';
  
    var buttons = document.createElement('div');
    buttons.style.marginTop = '18px';
    buttons.style.textAlign = 'right';
  
    if (graph.getModel().isVertex(cell) || graph.getModel().isEdge(cell)) {
      var replace = document.createElement('span');
      replace.style.marginRight = '10px';
      var input = document.createElement('input');
      input.setAttribute('type', 'checkbox');
      input.style.marginRight = '6px';
  
      if (value.getAttribute('placeholders') == '1') {
        input.setAttribute('checked', 'checked');
        input.defaultChecked = true;
      }
  
      mxEvent.addListener(input, 'click', function () {
        if (value.getAttribute('placeholders') == '1') {
          value.removeAttribute('placeholders');
        } else {
          value.setAttribute('placeholders', '1');
        }
      });
  
      replace.appendChild(input);
      mxUtils.write(replace, mxResources.get('placeholders'));
  
      if (EditDataDialog.placeholderHelpLink != null) {
        var link = document.createElement('a');
        link.setAttribute('href', EditDataDialog.placeholderHelpLink);
        link.setAttribute('title', mxResources.get('help'));
        link.setAttribute('target', '_blank');
        link.style.marginLeft = '10px';
        link.style.cursor = 'help';
  
        var icon = document.createElement('img');
        icon.setAttribute('border', '0');
        icon.setAttribute('valign', 'middle');
        icon.style.marginTop = '-4px';
        icon.setAttribute('src', Editor.helpImage);
        link.appendChild(icon);
  
        replace.appendChild(link);
      }
  
      buttons.appendChild(replace);
    }
  
    if (editorUi.editor && editorUi.editor.cancelFirst) {
      buttons.appendChild(cancelBtn);
      buttons.appendChild(applyBtn);
    } else {
      buttons.appendChild(applyBtn);
      buttons.appendChild(cancelBtn);
    }
  
    div.appendChild(buttons);
    this.container = div;
  };
}
