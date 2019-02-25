mxscript("https://cdn.rawgit.com/soney/jsep/b8baab7b/build/jsep.min.js");
mxscript("https://cdn.rawgit.com/nodeca/js-yaml/9c1894e2/dist/js-yaml.min.js");
mxscript("https://sdk.amazonaws.com/js/aws-sdk-2.9.0.min.js");
// mxscript("https://rawgit.com/soney/jsep/master/build/jsep.min.js");
//mxscript("https://localhost:8000/js/aws-sdk-2.9.0.js");
//mxscript("https://localhost:8000/js/jsep.min.js");

Draw.loadPlugin(function(ui) {
  awssfUtils = {
    isAWSsf: function(cell){
      return (cell && (cell.awssf != null)) && (cell.value && cell.value.getAttribute("type") && cell.value.getAttribute("type").indexOf("awssf") == 0);
    },
    isAWSconfig: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfAWSconfig"));
    },
    isStart: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfStart"));
    },
    isEnd: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfEnd"));
    },
    isParallelChild: function(cell){
      return (cell && cell.parent && cell.parent.awssf && cell.parent.value && (cell.parent.value.getAttribute("type") == "awssfParallel"));
    },
    isParallel: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfParralel"));
    },
    isTask: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfTask"));
    },
    isWait: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfWait"));
    },
    isNext: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfNext"));
    },
    isStartAt: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfStartAt"));
    },
    isRetry: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfRetry"));
    },
    isCatch: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfCatch"));
    },
    isChoice: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfChoice"));
    },
    isDefault: function(cell){
      return (cell && cell.value && (cell.value.getAttribute("type") == "awssfDefault"));
    },
    createHandlerImage: function (cls, src){
      var img = mxUtils.createImage(src);
      img.setAttribute('title', cls.prototype.type);
      img.style.cursor = 'pointer';
      img.style.width = '16px';
      img.style.height = '16px';
      mxEvent.addGestureListeners(img,
        mxUtils.bind(this, function(evt){
          var pt = mxUtils.convertPoint(this.graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
          var edge = cls.prototype.create();
          this.graph.connectionHandler.start(this.state, pt.x, pt.y, new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge)));
          this.graph.isMouseDown = true;
          this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
          mxEvent.consume(evt);
        })
      );
      return img;
    },
    validateTimestamp: function(val){
      if (!val) return null;
      return !!(val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/))
    },
    validateNumber: function(val){
      if (!val) return null;
      return !!(val.match(/^\d+$/))
    },
    validateJsonPath: function(val){
      if (!val) return null;
      return !!(val.match(/^\$/) && !val.match(/([@,:?\[\]]|\.\.)/)) || (val == "null")
    },
    validateCommonAttributes: function(cell, res, check_result_path){
      if (!res) res = [];
      if (awssfUtils.validateJsonPath(cell.getAttribute("input_path")) == false){
        res.push("input_path MUST use only supported jsonpath");
      }
      if (awssfUtils.validateJsonPath(cell.getAttribute("output_path")) == false){
        res.push("output_path MUST use only supported jsonpath");
      }
      if (check_result_path && (awssfUtils.validateJsonPath(cell.getAttribute("result_path")) == false)){
        res.push("result_path MUST use only supported jsonpath or null");
      }
      return res;
    },
    snakeToCamel: function(p){
      p = p.charAt(0).toLowerCase() + p.slice(1);
      return p.replace(/_./g, function(s) { return s.charAt(1).toUpperCase();});
    },
    camelToSnake: function(p){
      p = awssfUtils.snakeToCamel(p);
      return p.replace(/([A-Z])/g, function(s) { return '_' + s.charAt(0).toLowerCase();});
    },
    ops: {
      "==": "Equals",
      "<": "LessThan",
      ">": "GreaterThan",
      "<=": "LessThanEquals",
      ">=": "GreaterThanEquals"
    },
    parseJSEPObject: function (obj, res){
      if (res == null)
        res = [];
      if (obj.type == 'MemberExpression'){
        if (obj.computed){
          res.unshift('[' + this.parseJSEPObject(obj.property) + ']')
        }else{
          res.unshift(this.parseJSEPObject(obj.property))
        }
        return this.parseJSEPObject(obj.object, res);
      }
      else if (obj.type == 'Identifier'){
        res.unshift(obj.name);
        return res.reduce((prev, cur) => {
          if (cur[0] == '[') {
              return prev + cur
          }else{
              return prev + "." + cur
          }
        })
      }
      else if (obj.type == 'Literal') {
        return obj.value;
      }
    },
    parseJSEPValue: function (obj){
      return obj.value;
    },
    parseJSEPExpr: function (obj, res){
      if (res == null)
        res = {};
      if (obj.operator == '&&'){
        Object.assign(res, {And: [this.parseJSEPExpr(obj.left), this.parseJSEPExpr(obj.right)]});
      }
      else if (obj.operator == '||'){
        Object.assign(res, {Or: [this.parseJSEPExpr(obj.left), this.parseJSEPExpr(obj.right)]});
      }
      else if (obj.operator == '!'){
        Object.assign(res, {Not: this.parseJSEPExpr(obj.argument)});
      }
      else if (this.ops[obj.operator]){
        var vartype;
        var varname = this.parseJSEPObject(obj.left);
        var val = this.parseJSEPValue(obj.right);
        if (typeof(val) == "number") {
          vartype = "Numeric";
        }
        else if (typeof(val) == "string"){
          if (val.match(/^["'][\d\-]+T[\d:]+Z["']$/)){
            vartype = "Timestamp";
          } else {
            vartype = "String";
          }
        }
        else if (typeof(val) == "boolean"){
          vartype = "Boolean";
        }
        var tmp= {
          Variable: varname
        };
        tmp[vartype + this.ops[obj.operator]] = val;
        Object.assign(res, tmp);        
      }
      return res;
    }
  }

  function registCodec(func){
    var codec = new mxObjectCodec(new func());
    codec.encode = function(enc, obj){
      try{
        var data = enc.document.createElement(func.name);
      }catch(e){

      }
      return data
    };
    codec.decode = function(dec, node, into){
      return new func();
    };
    mxCodecRegistry.register(codec);
  }

  function createPoint(awssf, state, geometry){
    var label = state.prototype.type;
    if (geometry == null) geometry = new mxGeometry(0, 0, 40, 40); 
    var cell = new mxCell(label, geometry,'ellipse;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;');
    cell.vertex = true;
    cell.value = mxUtils.createXmlDocument().createElement('object');
    cell.setAttribute('label', label);
    cell.setAttribute('type', 'awssf' + label);
    cell.awssf = awssf;
    return cell;
  }

  function createSettingsIcon(){
    var img = mxUtils.createImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACpklEQVRIS7VVMU9TURg9nWiZoF0k1MQmlKCREhhowUHaScpWdYHoINUORoKTiT+AhMnE6IDigraL2g10amGhxaFGMJHQJiWxBJcWJl6Zas4H9/leH4VKwl2a13vv+c73nfN911ar1Wq4oGVrBpzxq9VDnYLd3gKbzXYmpabAs2s5bBWKCAwOIPstJ7/dXs/5wNMrGfh6e+BytgvA4pcU3J0d6PNdRWp5FZpWxdhoSPbKlT2sb2wieHPIEszC/H08iQNNQ6m0i1DwBhwOu4BPP3kgwUo7u+CZ4MiwBMlkc3C52tDqcODeRMQUwAROVvlCEbHohFz8mFyUw2SpsuA3A/AsAblHAnPzcXi7PAiNDOsBTOBMce5tAk+nJuWCceUL2/qnt+uKaY9EXrx8h9jDcRMJS1nIqFLZx51IWAB+rP+SsjB11p2sy+V9YUwNuD4ll+B0tplY838LuHLG/YnbOnA9I5WhCrAQ/4zuLg8C/gFrzenjjZ+bKO38QWYtp4s3M/vakqq6rQI8f/ZYHPNmPoE+3zW4Oy+h93qP9IEwV+Ixutfrkbpt5YtIr6yKuI0W60z29DwD5PNF6Ye7kTHRTAf/Xdo1NQbB6Rzl55MCUAs6xNhQvHfZ3WEGpyhkTSecm3lhW9jTDDpz1pxdRifQHUrA/6k5LUz30FHsbr3mxpTr3bL0NYVHUbN/lYDhW0d2PNUtRvDGPm+XWlKbcnnP5POmwE/rUAqlVv1EpNtmZl9hemqycYcezZZtxKLjMlsoMld4NGiZLenljIj2b7YkxAwNZwuBmKKmHUrqAX8/WtVUPGZF0Rc+JBEaGcKBVkV27TtcrnY4HC1gVxvXiY8FM6BQzcxzBmPJjIxVgKZfIpaLs4Nu8g/2n/8lqu/GC31DGw6XMzb+An4I4cvYKbPGAAAAAElFTkSuQmCC');
    img.setAttribute('title', 'Settings');
    img.style.cursor = 'pointer';
    img.style.width = '16px';
    img.style.height = '16px';
    return img;
  }

  awssfStateHandler = function(state){
    mxVertexHandler.apply(this, arguments);
  }
  awssfStateHandler.prototype = new mxVertexHandler();
  awssfStateHandler.prototype.constructor = awssfStateHandler;
  awssfStateHandler.prototype.domNode = null;
  awssfStateHandler.prototype.init = function(){
    mxVertexHandler.prototype.init.apply(this, arguments);
    this.domNode = document.createElement('div');
    this.domNode.style.position = 'absolute';
    this.domNode.style.whiteSpace = 'nowrap';
    if (this.custom) this.custom.apply(this, arguments);
    var img = createSettingsIcon();
    mxEvent.addGestureListeners(img,
      mxUtils.bind(this, function(evt){ mxEvent.consume(evt);})
    );
    mxEvent.addListener(img, 'click',
      mxUtils.bind(this, function(evt){
        ui.actions.get('editData').funct();
        mxEvent.consume(evt);
      })
    );
    this.domNode.appendChild(img);
    this.graph.container.appendChild(this.domNode);
    this.redrawTools();
  };
  awssfStateHandler.prototype.redraw = function()
  {
    mxVertexHandler.prototype.redraw.apply(this);
    this.redrawTools();
  };
  awssfStateHandler.prototype.redrawTools = function()
  {
    if (this.state != null && this.domNode != null)
    {
      var dy = (mxClient.IS_VML && document.compatMode == 'CSS1Compat') ? 20 : 4;
      this.domNode.style.left = (this.state.x + this.state.width - this.domNode.children.length * 14) + 'px';
      this.domNode.style.top = (this.state.y + this.state.height + dy) + 'px';
    }
  };
  awssfStateHandler.prototype.destroy = function(sender, me)
  {
    mxVertexHandler.prototype.destroy.apply(this, arguments);
    if (this.domNode != null)
    {
      this.domNode.parentNode.removeChild(this.domNode);
      this.domNode = null;
    }
  };

  awssfEdgeHandler = function(state){
    mxEdgeHandler.apply(this, arguments);
  }
  awssfEdgeHandler.prototype = new mxEdgeHandler();
  awssfEdgeHandler.prototype.constructor = awssfEdgeHandler;
  awssfEdgeHandler.prototype.domNode = null;
  awssfEdgeHandler.prototype.init = function(){
    mxEdgeHandler.prototype.init.apply(this, arguments);
    this.domNode = document.createElement('div');
    this.domNode.style.position = 'absolute';
    this.domNode.style.whiteSpace = 'nowrap';
    if (this.custom) this.custom.apply(this, arguments);
    var img = createSettingsIcon();
    mxEvent.addGestureListeners(img,
      mxUtils.bind(this, function(evt){ mxEvent.consume(evt);})
    );
    mxEvent.addListener(img, 'click',
      mxUtils.bind(this, function(evt){
        ui.actions.get('editData').funct();
        mxEvent.consume(evt);
      })
    );
    this.domNode.appendChild(img);
    this.graph.container.appendChild(this.domNode);
    this.redrawTools();
  };
  awssfEdgeHandler.prototype.redraw = function()
  {
    mxEdgeHandler.prototype.redraw.apply(this);
    this.redrawTools();
  };
  awssfEdgeHandler.prototype.redrawTools = function()
  {
    if (this.state != null && this.domNode != null)
    {
      var dy = (mxClient.IS_VML && document.compatMode == 'CSS1Compat') ? 20 : 4;
      this.domNode.style.left = (this.labelShape.bounds.x + this.labelShape.bounds.width) + 'px';
      this.domNode.style.top = (this.labelShape.bounds.y) + 'px';
    }
  };
  awssfEdgeHandler.prototype.destroy = function(sender, me)
  {
    mxEdgeHandler.prototype.destroy.apply(this, arguments);
    if (this.domNode != null)
    {
      this.domNode.parentNode.removeChild(this.domNode);
      this.domNode = null;
    }
  };



  StartPoint = function(){};
  StartPoint.prototype.type = 'Start';
  StartPoint.prototype.create = function(geometry){
    var cell = createPoint(this, StartPoint, geometry);
    return cell;
  }
  StartPoint.prototype.create_default_edge = function(){
    return StartAtEdge.prototype.create();
  }

  EndPoint = function(){};
  EndPoint.prototype.type = 'End';
  EndPoint.prototype.create = function(){
    var cell = createPoint(this, EndPoint);
    return cell;
  }

  function createAWSconfig(awsf){
    var cell = new mxCell('AWSconfig', new mxGeometry(0, 0, 70, 46), 'dashed=0;html=1;shape=mxgraph.aws2.non-service_specific.cloud;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;');
    cell.vertex = true;
    cell.value = mxUtils.createXmlDocument().createElement('object');
    cell.setAttribute('label', 'config');  
    cell.setAttribute('type', 'awssfAWSconfig');  
    cell.setAttribute('accessKeyId', '');
    cell.setAttribute('secretAccessKey', '');
    cell.setAttribute('region', '');
    cell.awssf = awsf;
    return cell;
  }

  AWSconfig = function(){};
  AWSconfig.prototype.create = function(){
    return createAWSconfig(this);
  }
  AWSconfig.prototype.handler = awssfStateHandler;
  registCodec(AWSconfig);

  function createState(awssf, state, style){
    var label = state.prototype.type;
    if (!style) style = 'rounded=1;whiteSpace=wrap;html=1;gradientColor=none;dashed=1';
    var cell = new mxCell(label, new mxGeometry(0, 0, 80, 40), style);
    cell.vertex = true;
    cell.value = mxUtils.createXmlDocument().createElement('object');
    cell.setAttribute('label', label);
    cell.setAttribute('type', 'awssf' + label);
    cell.setAttribute('comment', '');
    cell.setAttribute('input_path', '');
    cell.setAttribute('output_path', '');
    cell.awssf = awssf;
    return cell;
  }

  PassState = function(){};
  PassState.prototype.type = 'Pass';
  PassState.prototype.create = function(){
    var cell = createState(this, PassState, 'shape=mxgraph.flowchart.process;whiteSpace=wrap;gradientColor=none;html=1;');
    cell.value.setAttribute('result', '');
    cell.value.setAttribute('result_path', '');
    return cell;
  }
  PassState.prototype.create_default_edge = function(src){
    for (var i in src.edges){
      var edge = src.edges[i];
      if ((edge.source == src) && awssfUtils.isNext(edge))
        return null;
    }
    return NextEdge.prototype.create();
  }
  PassState.prototype.validate = function(cell, res){
    return awssfUtils.validateCommonAttributes(cell, res, true);
  }
  PassState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Pass"
    };
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    if (cell.getAttribute("input_path"))
      data[label].InputPath = cell.getAttribute("input_path");
    if (cell.getAttribute("output_path"))
      data[label].OutputPath = cell.getAttribute("output_path");
    if (cell.getAttribute("result_path"))
      data[label].ResultPath = cell.getAttribute("result_path");
    if (cell.getAttribute("result"))
      data[label].Result = cell.getAttribute("result");
    var exist_next_edge = false;
    for(var i in cell.edges){
      var edge = cell.edges[i];
      if (edge.source != cell) continue;
      if (awssfUtils.isNext(edge)){
        exist_next_edge = true;
        Object.assign(data[label], edge.awssf.expJSON(edge, cells)) 
      }
    }
    if (exist_next_edge == false || data[label].Next == 'End'){
      delete data[label]['Next'];
      data[label]["End"] = true;
    }
    return data;
  };
  registCodec(PassState);
  PassStateHandler = function(state){
    this.custom = function(){
      this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
    };
    awssfStateHandler.apply(this, arguments);
  }
  PassState.prototype.handler = PassStateHandler;
  mxUtils.extend(PassStateHandler, awssfStateHandler);

  TaskState = function(){};
  TaskState.prototype.type = 'Task';
  TaskState.prototype.create = function(){
    var cell = createState(this, TaskState, 'shape=stencil(rZVNb4MwDIZ/DdcqkI2P48S6Y1Wph51TMCMqTVDC2m2/fiEBdUCyAavExa+xH78BjIdTWZIavAAxcgYPP3tBsBeQQ0EZ5EreC56BlEpWQWluCJEJryZMYhMSWUPWGO1CBCXHCkxGNoKf4ErzputAWQmCNm0Wbz30pO5pL5xmnDHVhHImB5kfedWMUKZq0YdphjaPBvPZxSaqFeEMDYiBerO508LLaow/D3NYihl66aF/YV4XYvx1mO3iQ0PBiIT8mazdUk8WWBLPhB2Ww/r3foWz5cc4gc13ZoPhVCmujw2nR5Kd3gR/Z7l1RJ0R7cfuem2tC2K0PojIJP3qpgw3kR+FcYSihzhIEuy7hnaMhtOCC/hl5oJWldlDroOvSbueJok+feYXuPmNLH5tbfvqSu1TV3XoLteWHYOp3X0/P4n/L0Oj8js70jWT56tV8/vSwjc=);whiteSpace=wrap;gradientColor=none;html=1;');
    cell.setAttribute('resource', '');
    cell.setAttribute('timeout_seconds', 60);
    cell.setAttribute('heartbeat_seconds', '');
    cell.setAttribute('result_path', '');
    return cell;
  }
  TaskState.prototype.create_default_edge = function(src){
    for (var i in src.edges){
      var edge = src.edges[i];
      if ((edge.source == src) && awssfUtils.isNext(edge))
        return CatchEdge.prototype.create();
    }  
    return NextEdge.prototype.create();
  }
  TaskState.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!cell.getAttribute("resource") || !cell.getAttribute("resource").match(/^arn:[^:]+:(states|lambda):[^:]*:[^:]*:[^:]+:.+/)){
      res.push("resource MUST be a URI that uniquely identifies the specific task to execute");
    }
    if (awssfUtils.validateNumber(cell.getAttribute("timeout_seconds")) == false){
      res.push("timeout_seconds MUST be number");
    }
    if (awssfUtils.validateNumber(cell.getAttribute("heartbeat_seconds")) == false){
      res.push("heartbeat_seconds MUST be number");
    }else{
      if (Number(cell.getAttribute("heartbeat_seconds")) >= Number(cell.getAttribute("timeout_seconds"))){
        res.push("heartbeat_seconds MUST be smaller than timeout_seconds")
      }
    }
    return awssfUtils.validateCommonAttributes(cell, res, true);
  };
  TaskState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Task",
      Resource: cell.getAttribute("resource")
    };
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    if (cell.getAttribute("input_path"))
      data[label].InputPath = cell.getAttribute("input_path");
    if (cell.getAttribute("output_path"))
      data[label].OutputPath = cell.getAttribute("output_path");
    if (cell.getAttribute("result_path"))
      data[label].ResultPath = cell.getAttribute("result_path");
    if (cell.getAttribute("timeout_seconds"))
      data[label].TimeoutSeconds = Number(cell.getAttribute("timeout_seconds"));
    if (cell.getAttribute("heartbeat_seconds"))
      data[label].HeartbeatSeconds = Number(cell.getAttribute("heartbeat_seconds"));

    var exist_next_edge = false;
    if (cell.edges){
      var sorted_edges = cell.edges.sort(function(a, b){
        if (Number(a.getAttribute("weight")) > Number(b.getAttribute("weight"))) return -1;
        if (Number(a.getAttribute("weight")) < Number(b.getAttribute("weight"))) return 1;
        return 0;
      });    
      for(var i in sorted_edges){
        var edge = sorted_edges[i];
        if (edge.source != cell) continue;
        if (edge.awssf && edge.awssf.expJSON){
          if (awssfUtils.isRetry(edge)){
            if (!data[label]["Retry"]) data[label]["Retry"] = [];
            data[label]["Retry"].push(edge.awssf.expJSON(edge, cells));
          }
          else if (awssfUtils.isCatch(edge)){
            if (!data[label]["Catch"]) data[label]["Catch"] = [];
            data[label]["Catch"].push(edge.awssf.expJSON(edge, cells));
          }else if (awssfUtils.isNext(edge)){
            exist_next_edge = true;
            Object.assign(data[label], edge.awssf.expJSON(edge, cells)) 
          }
        }
      }
    }
    if (exist_next_edge == false || data[label].Next == 'End'){
      delete data[label]['Next'];
      data[label]["End"] = true;
    }
    return data;
  };
  registCodec(TaskState);
  TaskStateHandler = function(state){
    this.custom = function(){
      this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
      this.domNode.appendChild(CatchEdge.prototype.createHandlerImage.apply(this, arguments));
      this.domNode.appendChild(RetryEdge.prototype.createHandlerImage.apply(this, arguments));
    };
    awssfStateHandler.apply(this, arguments);
  }
  TaskState.prototype.handler = TaskStateHandler;
  mxUtils.extend(TaskStateHandler, awssfStateHandler);


  ChoiceState = function(){};
  ChoiceState.prototype.type = 'Choice';
  ChoiceState.prototype.create = function(){
    var cell = createState(this, ChoiceState, 'shape=stencil(rZZNT4QwEIZ/DddNodmgR8Pi0YsHzl12VpqFlrS46r+3UIl8FNOhJhzgHWaezvBSiGimK9ZClBDBGojoKUqSE5RccynMqdGZbqHsbOTOFGfnGmxEd0re4INfusqGuahA8a6P0jwiT+ae/qBZKYUwRUxNPYtM4qYY48Lkkk9bjBzio+V8/Qj2qjWIBjpQM/V39S9FMUjPCBIl+0ho0L6O0Jh0Xz85GvSwr6EcT1qYIfYjvYabwZsUaAZfTqgZfDnBZvAG4UkkXfjukBz9aAX6ZVqAfDn/0FPqy8J74jHZO8AcO8B43wDxplj35DvA3DVAmhll68NFszMrb29KvouLc4kt6z+Kq8AYbuQdJiNy7aKu1sf0motJunMT9k+Pydzjx0D+WA+xgtAC6AbKWmrYspfRV49vUDeeOc2uUsEfZrjyurY/S06TrbIH1f6XDcI3);whiteSpace=wrap;html=1;gradientColor=none;dashed=1');
    cell.setAttribute('choices', '');
    cell.setAttribute('default', '');
    return cell;
  }
  ChoiceState.prototype.hiddenAttributes = ['choices', 'default'];
  ChoiceState.prototype.create_default_edge = function(){
    return ChoiceEdge.prototype.create();
  }
  ChoiceState.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!cell.edges ||
      (cell.edges.filter(function(v){ return (v.source == cell) && awssfUtils.isChoice(v)}).length == 0)){
      res.push("A Choice state MUST have more than one choice edge")
    }
    return awssfUtils.validateCommonAttributes(cell, res, false);
  };
  ChoiceState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Choice",
      Choices: []
    };
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    if (cell.getAttribute("input_path"))
      data[label].InputPath = cell.getAttribute("input_path");
    if (cell.getAttribute("output_path"))
      data[label].OutputPath = cell.getAttribute("output_path");
    if (cell.edges){
      var sorted_edges = cell.edges.sort(function(a, b){
        if (Number(a.getAttribute("weight")) > Number(b.getAttribute("weight"))) return -1;
        if (Number(a.getAttribute("weight")) < Number(b.getAttribute("weight"))) return 1;
        return 0;
      });
      for(var i in sorted_edges){
        var edge = sorted_edges[i];
        if (edge.source != cell) continue;
        if (awssfUtils.isChoice(edge)){
          data[label].Choices.push(edge.awssf.expJSON(edge, cells))
        }
        else if (awssfUtils.isDefault(edge)){
          Object.assign(data[label], edge.awssf.expJSON(edge, cells));
        }
      }
    }
    return data;
  };
  registCodec(ChoiceState);
  ChoiceStateHandler = function(state){
    this.custom = function(){
      this.domNode.appendChild(ChoiceEdge.prototype.createHandlerImage.apply(this, arguments));
      this.domNode.appendChild(DefaultEdge.prototype.createHandlerImage.apply(this, arguments));
    };
    awssfStateHandler.apply(this, arguments);
  }
  ChoiceState.prototype.handler = ChoiceStateHandler;
  mxUtils.extend(ChoiceStateHandler, awssfStateHandler);

  WaitState = function(){};
  WaitState.prototype.type = 'Wait';
  WaitState.prototype.create = function(){
    var cell = createState(this, WaitState, 'shape=mxgraph.flowchart.delay;whiteSpace=wrap;gradientColor=none;html=1;');  
    cell.setAttribute('seconds', '');
    return cell; 
  }
  WaitState.prototype.create_default_edge = function(src){
    for (var i in src.edges){
      var edge = src.edges[i];
      if ((edge.source == src) && awssfUtils.isNext(edge))
        return null;
    }
    return NextEdge.prototype.create();
  }
  WaitState.prototype.cst = {
    DURATION_FORMAT: ["Seconds", "SecondsPath", "Timestamp", "TimestampPath"]
  };
  WaitState.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (awssfUtils.validateNumber(cell.getAttribute("seconds")) == false){
      res.push("seconds MUST be number");
    }
    if (awssfUtils.validateTimestamp(cell.getAttribute("timestamp")) == false){
      res.push("timestamp MUST be valid formated");
    }
    if (awssfUtils.validateJsonPath(cell.getAttribute("seconds_path")) == false){
      res.push("second_path MUST use only supported jsonpath");
    }
    if (awssfUtils.validateJsonPath(cell.getAttribute("timestamp_path")) == false){
      res.push("timestamp_path MUST use only supported jsonpath");
    }
    if (!(cell.getAttribute("seconds") || cell.getAttribute("timestamp") || cell.getAttribute("seconds_path") || cell.getAttribute("timestamp_path"))){
      res.push('A Wait state MUST contain exactly one of ”Seconds”, “SecondsPath”, “Timestamp”, or “TimestampPath”');
    }
    return awssfUtils.validateCommonAttributes(cell, res, false);
  };
  WaitState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Wait"
    };
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    if (cell.getAttribute("input_path"))
      data[label].InputPath = cell.getAttribute("input_path");
    if (cell.getAttribute("output_path"))
      data[label].OutputPath = cell.getAttribute("output_path");

    var options = this.cst.DURATION_FORMAT;
    for(var j in options){
      var key = awssfUtils.camelToSnake(options[j]);
      if (cell.getAttribute(key)){
        if (cell.getAttribute(key).match(/^\d+/)){
          data[label][options[j]] = Number(cell.getAttribute(key));
        }else{
          data[label][options[j]] = cell.getAttribute(key);
        }
        break;
      }
    }
    var exist_next_edge = false;
    for(var i in cell.edges){
      var edge = cell.edges[i];
      if (edge.source != cell) continue;
      if (awssfUtils.isNext(edge)){
        exist_next_edge = true;
        Object.assign(data[label], edge.awssf.expJSON(edge, cells)) 
      }
    }
    if (exist_next_edge == false || data[label].Next == 'End'){
      delete data[label]['Next'];
      data[label]["End"] = true;
    }
    return data;
  };
  WaitState.prototype.buildForm = function(form, attrName, attrValue){
    if (['label', 'comment', 'input_path', 'output_path'].indexOf(attrName) == -1){
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      var select = document.createElement('select');
      var options = this.cst.DURATION_FORMAT;
      for(var j in options){
        var option = document.createElement('option');
        mxUtils.writeln(option, options[j]);
        option.setAttribute('value', awssfUtils.camelToSnake(options[j]));
        if (attrName == awssfUtils.camelToSnake(options[j])){
          option.setAttribute('selected', true);
        }
        select.appendChild(option);
      }
      td.appendChild(select);
      tr.appendChild(td);
      td = document.createElement('td');
      var input = document.createElement('textarea');
      input.setAttribute('rows', 2);
      input.style.width = '100%';
      input.value = attrValue;
      td.appendChild(input);
      tr.appendChild(td);
      form.body.appendChild(tr);
      return [select, input];
    }
    else if (attrName != 'placeholders')
    {
      var input = form.addTextarea(attrName + ':', attrValue, 2);
      input.style.width = '100%';
      return [attrName, input];
    }
    else{
      return null;
    }
  }
  WaitState.prototype.applyForm = function(value, name, text){
    var removeLabel = false;
    if (text == null)
    {
      value.removeAttribute(name);
    }
    else
    {
      if (typeof(name) == 'object'){
        for (var i in this.cst.DURATION_FORMAT){
          var n = awssfUtils.camelToSnake(this.cst.DURATION_FORMAT[i]);
          if ( n == name.value ){
            value.setAttribute(name.value, text.value);
          }else{
            value.removeAttribute(n);
          }
        }
      }else{
        value.setAttribute(name, text.value);
      }
      removeLabel = removeLabel || (name == 'placeholder' &&
        value.getAttribute('placeholders') == '1');
    }
    return removeLabel;
  }
  registCodec(WaitState);
  WaitStateHandler = function(state){
    this.custom = function(){
      this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
    };
    awssfStateHandler.apply(this, arguments);
  }
  WaitState.prototype.handler = WaitStateHandler;
  mxUtils.extend(WaitStateHandler, awssfStateHandler);


  SucceedState = function(){};
  SucceedState.prototype.type = 'Succeed';
  SucceedState.prototype.create = function(){
    var cell = createState(this, SucceedState, 'shape=mxgraph.flowchart.terminator;html=1;whiteSpace=wrap;gradientColor=none;');
    return cell;
  };
  SucceedState.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (cell.edges &&
      (cell.edges.filter(function(v){ return (v.source == cell) && awssfUtils.isAWSsf(v)}).length > 0)){
      res.push("A Succeed state MUST have no outgoing edge")
    }
    return awssfUtils.validateCommonAttributes(cell, res, false);
  };  
  SucceedState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Succeed"
    }
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    if (cell.getAttribute("input_path"))
      data[label].InputPath = cell.getAttribute("input_path");
    if (cell.getAttribute("output_path"))
      data[label].OutputPath = cell.getAttribute("output_path");
    return data;
  };
  registCodec(SucceedState);
  SucceedState.prototype.handler = awssfStateHandler;

  FailState = function(){};
  FailState.prototype.type = 'Fail';
  FailState.prototype.create = function(){
    var cell = createState(this, FailState, 'shape=mxgraph.flowchart.terminator;html=1;whiteSpace=wrap;gradientColor=none;');
    cell.setAttribute('error', '');
    cell.setAttribute('cause', '');
    cell.value.removeAttribute('input_path');
    cell.value.removeAttribute('output_path');  
    return cell;  
  };
  FailState.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (cell.edges &&
      (cell.edges.filter(function(v){ return (v.source == cell) && awssfUtils.isAWSsf(v)}).length > 0)){
      res.push("A Fail state MUST have no outgoing edge")
    }
    if (!cell.getAttribute("error")){
      res.push("error MUST have a value");
    }
    if (!cell.getAttribute("cause")){
      res.push("cause MUST have a value");
    }
    return awssfUtils.validateCommonAttributes(cell, res, false);
  };
  FailState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Fail",
      Error: cell.getAttribute("error"),
      Cause: cell.getAttribute("cause")
    }
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    return data;
  };
  registCodec(FailState);
  FailState.prototype.handler = awssfStateHandler;

  ParallelState = function(){};
  ParallelState.prototype.type = 'Parallel';
  ParallelState.prototype.create = function(){
    var cell = createState(this, ParallelState);
    cell.setStyle('swimlane;whiteSpace=wrap;html=1;dashed=1;gradientColor=none;');
    cell.setGeometry(new mxGeometry(0, 0, 480, 200));
    cell.setAttribute('result_path', '');
    cell.setAttribute('branches', '');
    var sp = StartPoint.prototype.create(new mxGeometry((cell.geometry.width - 30)/2, 40, 30, 30));
    cell.insert(sp);
    var task1 = TaskState.prototype.create();
    task1.setGeometry(new mxGeometry(80, 80, task1.geometry.width, task1.geometry.height));
    cell.insert(task1);
    var edge1 = StartAtEdge.prototype.create();
    sp.insertEdge(edge1, true);
    task1.insertEdge(edge1, false);
    cell.insert(edge1);  
    var task2 = TaskState.prototype.create();
    task2.setGeometry(new mxGeometry(320, 80, task2.geometry.width, task2.geometry.height));
    cell.insert(task2);
    var edge2 = StartAtEdge.prototype.create();
    sp.insertEdge(edge2, true);
    task2.insertEdge(edge2, false);
    cell.insert(edge2);  
    return cell;
  };
  ParallelState.prototype.hiddenAttributes = ['branches'];
  ParallelState.prototype.create_default_edge = function(src){
    for (var i in src.edges){
      var edge = src.edges[i];
      if ((edge.source == src) && awssfUtils.isNext(edge))
        return CatchEdge.prototype.create();
    }
    return NextEdge.prototype.create();
  }
  ParallelState.prototype.validate = function(cell, res){
    return awssfUtils.validateCommonAttributes(cell, res, true);
  };
  ParallelState.prototype.expJSON = function(cell, cells){
    var data = {};
    var label = cell.getAttribute("label"); 
    data[label] = {
      Type: "Parallel",
      Branches: []
    };
    if (cell.getAttribute("comment"))
      data[label].Comment = cell.getAttribute("comment");
    if (cell.getAttribute("input_path"))
      data[label].InputPath = cell.getAttribute("input_path");
    if (cell.getAttribute("output_path"))
      data[label].OutputPath = cell.getAttribute("output_path");
    if (cell.getAttribute("result_path"))
      data[label].ResultPath = cell.getAttribute("result_path");
    
    var startat = [];
    for(var i in cell.children){
      var child = cell.children[i];
      if (!awssfUtils.isStart(child)) continue;
      for(var j in child.edges){
        var edge = child.edges[j];
        if (edge.target == child) continue;
        if (awssfUtils.isStartAt(edge)){
          startat.push(cells[edge.target.id]);
        }
      }      
    }

    function traceAll(state, res){
      res.push(state);
      for(var j in state.edges){
        var edge = state.edges[j];
        if (edge.target == state) continue;
        traceAll(cells[edge.target.id], res);
      }
      return res;
    }
    for(var i in startat){
      var branch = [];
      var start = startat[i];
      traceAll(start, branch);
      var states = {};
      for(var i in branch){
        var child = branch[i];
        if (child.value == null || typeof(child.value) != "object") continue;
        if (!awssfUtils.isAWSsf(child)) continue;
        if (awssfUtils.isStart(child) || awssfUtils.isEnd(cell)) continue;
        if (child.isVertex()){
          if (awssfUtils.isParallel(child)) continue;
          if (child.awssf &&  child.awssf.expJSON){
            Object.assign(states, child.awssf.expJSON(child, cells));
          }
        }
      }
      data[label].Branches.push({
        StartAt: start.getAttribute("label"),
        States: states
      });
    }
    var exist_next_edge = false;
    if (cell.edges){
      var sorted_edges = cell.edges.sort(function(a, b){
        if (Number(a.getAttribute("weight")) > Number(b.getAttribute("weight"))) return -1;
        if (Number(a.getAttribute("weight")) < Number(b.getAttribute("weight"))) return 1;
        return 0;
      });
      for(var i in sorted_edges){
        var edge = sorted_edges[i];
        if (edge.source != cell) continue;
        if (edge.awssf.expJSON){
          if (awssfUtils.isRetry(edge)){
            if (!data[label]["Retry"]) data[label]["Retry"] = [];
            data[label]["Retry"].push(edge.awssf.expJSON(edge, cells));
          }
          else if (awssfUtils.isCatch(edge)){
            if (!data[label]["Catch"]) data[label]["Catch"] = [];
            data[label]["Catch"].push(edge.awssf.expJSON(edge, cells));
          }else if (awssfUtils.isNext(edge)){
            exist_next_edge = true;
            Object.assign(data[label], edge.awssf.expJSON(edge, cells));
          }
        }
      }
    }
    if (exist_next_edge == false || data[label].Next == 'End'){
      delete data[label]['Next'];
      data[label]["End"] = true;
    }
    return data;

  };
  registCodec(ParallelState);
  ParallelStateHandler = function(state){
    this.custom = function(){
      this.domNode.appendChild(NextEdge.prototype.createHandlerImage.apply(this, arguments));
      this.domNode.appendChild(CatchEdge.prototype.createHandlerImage.apply(this, arguments));
      this.domNode.appendChild(RetryEdge.prototype.createHandlerImage.apply(this, arguments));  
    };
    awssfStateHandler.apply(this, arguments);
  }
  ParallelState.prototype.handler = ParallelStateHandler;
  mxUtils.extend(ParallelStateHandler, awssfStateHandler);

  function createEdge(awssf, edge, label, style){
    var cell = new mxCell(label, new mxGeometry(0, 0, 60, 60), style);
    cell.geometry.setTerminalPoint(new mxPoint(0, 0), true);
    cell.geometry.setTerminalPoint(new mxPoint(cell.geometry.width, cell.geometry.height), false);
    cell.geometry.relative = true;
    cell.edge = true;
    cell.value = mxUtils.createXmlDocument().createElement('object');
    cell.setAttribute('label', label);
    cell.setAttribute('type', 'awssf' + label);
    cell.awssf = awssf;  
    return cell;
  }

  StartAtEdge = function(){};
  StartAtEdge.prototype.type = 'StartAt';
  StartAtEdge.prototype.create = function(label){
    if (label == null ) label = this.type;
    var cell = createEdge(this, StartAtEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');
    return cell;
  };
  StartAtEdge.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!(cell.source && cell.target)){
      res.push("edge MUST be connected");
    }
    return res;
  };
  StartAtEdge.prototype.expJSON = function(cell, cells){
    if (cell.target != null){
      var data = {
        StartAt: cells[cell.target.id].getAttribute("label")
      }
      return data;
    }else{
      return {};
    }
  };
  StartAtEdge.prototype.handler = awssfEdgeHandler;
  registCodec(StartAtEdge);


  NextEdge = function(){};
  NextEdge.prototype.type = 'Next';
  NextEdge.prototype.create = function(label){
    if (label == null ) label = this.type;  
    var cell = createEdge(this, NextEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');
    return cell;
  };
  NextEdge.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!(cell.source && cell.target)){
      res.push("edge MUST be connected");
    }
    return res;
  };
  NextEdge.prototype.expJSON = function(cell, cells){
    if (cell.target != null){
      var data = {
        Next: cells[cell.target.id].getAttribute("label")
      }
      return data;
    }else{
      return {};
    }
  };
  NextEdge.prototype.createHandlerImage = function(){
    var img = awssfUtils.createHandlerImage.call(this, NextEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAB30lEQVRIS72VsU4CQRRFj52ddCZU0tpo4h/YYKkUNhRCYgyJhfIFakNjoR9goiiJiY12kBBsaSDRL9A/EBtojJjLZNhlnIVdjU612Z097819d96bGw6HQ/5ozcWBv77C8zM8PcHqKqyswNLS7Iwi4b0elMvw8AB6dlcqBZubcHYGevYtL1zAYtEP9QW5vDSB3PUNXihAtTr7yO6OgwM4P598OwFXxltbycH2j/v7yROM4dI1kwmkWF+H62v4/ASd5vExCHpxAdvbsL8PNzfBe2n/8hLUYAx35bDwdBqaTchmZ8O1Y2cHrq7M3jFcUd/fA4CFDwagAKencHxsvkdlrm/ivL2F4PKxJAkvC2+1YG0NFhZgbw/q9elwMSSN7sEoc18hLbzRgG4XKhXodCCXM972ae4WdgTXcU9O/JkLvrsLtZpxkuy2uDgdfnRkJIyVueDLy3B3Z+Rpt2Fj47tbvJlP09xmrh9LJSPPxwfMz0fDJzS3Vfa5JQzXPt3efB76fT9cJ7O9aKbPXbjkub017nIvUaTPFU32CWeftBEoa0lsu+T/9Bab5U+7orVf+LSR/VxB4kgkKdRLYvVzG1k1ODw0k8gXRFABdakSTSK3kCqS5qedoZqjv5qhSZ3i2/8FknYly43Hp8kAAAAASUVORK5CYII=');
    return img;
  };
  NextEdge.prototype.handler = awssfEdgeHandler;
  registCodec(NextEdge);


  RetryEdge = function(){};
  RetryEdge.prototype.type = 'Retry';
  RetryEdge.prototype.create = function(label){
    if (label == null ) label = this.type;
    var cell = createEdge(this, RetryEdge, label, 'edgeStyle=orthogonalEdgeStyle;curved=1;html=1;exitX=0.5;exitY=1;entryX=1;entryY=0.5;startArrow=none;startFill=0;jettySize=auto;orthogonalLoop=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');  
    cell.geometry.setTerminalPoint(new mxPoint(0, cell.geometry.height), true);
    cell.geometry.setTerminalPoint(new mxPoint(cell.geometry.width, 0), false);
    // cell.setAttribute('label', '%error_equals%');
    cell.setAttribute('placeholders', 1);
    cell.setAttribute('error_equals', '');
    cell.setAttribute('interval_seconds', 1);
    cell.setAttribute('max_attempts', 3);
    cell.setAttribute('backoff_rate', 2);
    cell.setAttribute('weight', 1);
    return cell;
  };
  RetryEdge.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!(cell.source && cell.target)){
      res.push("edge MUST be connected");
    }
    if ((cell.source && cell.target) && (cell.source.id != cell.target.id)){
      res.push("retry edge target MUST be self");
    }
    if (awssfUtils.validateNumber(cell.getAttribute("interval_seconds")) == false){
      res.push("interval_seconds MUST be a positive integer");
    }
    if (awssfUtils.validateNumber(cell.getAttribute("max_attempts")) == false){
      res.push("max_attempts MUST be greater than or equal to 0");
    }
    if ((awssfUtils.validateNumber(cell.getAttribute("backoff_rate")) == false) && (Number(cell.getAttribute("backoff_rate")) >= 1)){
      res.push("backoff_rate MUST be greater than or equal to 1.0");
    }
    return res;
  };
  RetryEdge.prototype.expJSON = function(cell, cells){
    var errors = cell.getAttribute("error_equals");
    errors = errors ? errors.split(/,\s*/) : [];
    if (cell.target != null){
      var data = {
        ErrorEquals: errors,
        IntervalSeconds: Number(cell.getAttribute("interval_seconds")),
        MaxAttempts: Number(cell.getAttribute("max_attempts")),
        BackoffRate: Number(cell.getAttribute("backoff_rate"))
      }
      return data;
    }else{
      return {};
    }
  };
  RetryEdge.prototype.createHandlerImage = function(){
    var img = awssfUtils.createHandlerImage.call(this, RetryEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACCUlEQVRIS7WVTUhUURTHf7NRN+JsUkER3UUI5kJMIoqBMNzkR6C7Elq5UReh0sIkgsCF0yJw5wdi2MYPEAyxLAhcuNBcFKLM4EJ0oU5I+FF648zzNe++d5/MM72rx7vn/M///s9XSCmlOO/EE7C8DUtbcDMfyvKgOHyui30ZMoInDqH9A0z8APl2n3AW1F6HvmqQb5/jBRfA5kkzqCnIwEMrkOHo4E8mYGg5rSdrRq2VEH3g8UuBC+O6seDAtsd4o+cFFrjoWvImJUWkBIbroCBbD3aiYH0XXn6BkW/6nWgfa9VyYIG75bDBZ9bg6VQKpKUCnt+BnQN49B5Wd/QAj8tgsPbfPws8/Bp+HqUM/cDFQpwlgS3TMLriZb/X4QCP7amkJM5zUXDBEGnO+iCkxr8rTyJN4NkZ0FwOHbdhcx8iQ7B/7C0AR2JDqvuTouezmbk7oX9OrU59NgvzcXNldd+FF/eSd+kxv1UIvfehNBeiC3jIOMNozNPV/MY1eNcARTnQNQf9i2bmmuZBqqWpFN7WwK/fJMv3Y0wPkJMJiU5XKaZb5+L2KgLtVfB1A+rH9KQa61w6tDiq13rQQSCs422GDhWgK5stNsuLTkVH+TkfbJ7nEsQ5DvwkEinscWCw8d9EbTOWVKYgAirzRWZ4oE3kZiA7VLrS3qGyR/9rhwatFB97syyXBP4Xec8Ry9TpbfEAAAAASUVORK5CYII=');
    return img;
  };
  RetryEdge.prototype.handler = awssfEdgeHandler;
  registCodec(RetryEdge);

  CatchEdge = function(){};
  CatchEdge.prototype.type = 'Catch';
  CatchEdge.prototype.create = function(label){
    if (label == null ) label = this.type;
    var cell = createEdge(this, CatchEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');    
    // cell.setAttribute('label', '%error_equals%');
    cell.setAttribute('placeholders', 1);
    cell.setAttribute('error_equals', '');
    cell.setAttribute('result_path', '');
    cell.setAttribute('weight', '1');
    return cell;
  };
  CatchEdge.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!(cell.source && cell.target)){
      res.push("edge MUST be connected");
    }
    if (awssfUtils.validateJsonPath(cell.getAttribute("result_path")) == false){
      res.push("result_path MUST use only supported jsonpath");
    }
    return res;
  };
  CatchEdge.prototype.expJSON = function(cell, cells){
    var errors = cell.getAttribute("error_equals");
    errors = errors ? errors.split(/,\s*/) : [];    
    if (cell.target != null){
      var data = {
        ErrorEquals: errors,
        Next: cells[cell.target.id].getAttribute("label")
      }
      return data;
    }else{
      return {};
    }
  };
  CatchEdge.prototype.createHandlerImage = function(){ 
      var img = awssfUtils.createHandlerImage.call(this, CatchEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACFklEQVRIS7WVT0hUURTGf5NRbsRZBLlImHZKwRREM2Cg48YWoRNE2SIq3BSloxudTToqkUXguBSCDEFsETMtRmqlxSi2CLIg3ESDDEOhlOJmimDi+Ob5/t2Z8RXe1Xv3nfed737nu+d4CoVCgX1anj2Bb2bg+wp8+wB1p+CoH7y+ipRKg+c34XUfrCZBnu2r2gsNYWgbB3lWLDW4AL68qQZVJel4qiWyLSd48gasPKt4ZEdAIALn45ZtK7gwfn7RPbD+x5WE5QQGuOg6cdwpxekuCEbgSCMcOAh/8rCWhvl7kF22EhHtI193a2CAq+Rova8BZ9/B21HIvdfeRYLtHLy4CuufrQn81yE8tbNngI954deWEXgsCJdm4ccXmA3D723jW2gEznbDchzeDDvZD/w0gYuPRRLzah6EYB+kH8DiI3d1EGm8viJzVSHbn8CJy5C6Ax+n3YEXC6vJshBzHu/CJJzshLm77sGbh6AlVoZ5Uz80DcDiQ6csh2rgXBQ2VtWJLcxVmpcraKAHQqPwaQZSt52SWTSXz3a3yJ7ZikuPNX/rVpR7kbjm9PrhWohqvai8zyVCpDlzC2rrwVNV/hJJvNLnwiTus3rdnUdAWPdmFDdUgPatt+gs/7UrFu1nPmzpfi5JzO2glEQihfSSPfVzHURq8KpXk0qVREAFUHq4q0lkZyn3QOanPkNljv7XDHXrFEX8X1YGE8t/bBUwAAAAAElFTkSuQmCC');
    return img;
  };
  CatchEdge.prototype.handler = awssfEdgeHandler;
  registCodec(CatchEdge);

  ChoiceEdge = function(){};
  ChoiceEdge.prototype.type = 'Choice';
  ChoiceEdge.prototype.create = function(label){
    if (label == null ) label = this.type;
    var cell = createEdge(this, ChoiceEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');     
    // cell.setAttribute('label', '%condition%');
    cell.setAttribute('placeholders', 1);  
    cell.setAttribute('condition', '$.foo == 1');
    cell.setAttribute('weight', '1');    
    return cell;
  };
  ChoiceEdge.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!(cell.source && cell.target)){
      res.push("edge MUST be connected");
    }
    var condition = cell.getAttribute("condition");
    if (condition){
      try{
        var tree = jsep(condition);
      }catch(e){
        res.push("invalid jsep.");
      }
    }else{
      res.push("condition MUST be defined")
    }
    return res;
  };
  ChoiceEdge.prototype.expJSON = function(cell, cells){
    if (cell.target != null){
      var condition = cell.getAttribute("condition");
      var data;
      if (condition != null){
        var tree = jsep(condition);
        data = awssfUtils.parseJSEPExpr(tree);
      }
      data.Next = cells[cell.target.id].getAttribute("label");
      return data;
    }else{
      return {};
    }
  };
  ChoiceEdge.prototype.createHandlerImage = function(){ 
    var img = awssfUtils.createHandlerImage.call(this, ChoiceEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAACWUlEQVRIS7WVXW/SUBjH/12AGZDSDkkwQ40mytCxmC1z6Fx82RUXiiYz8WvMO/0AXrqPoYkandF4t+iWuSXTRMkcu1OUKbFAAWFCy1ZzaoCe9oDUl3PV5pzzO8/L/3keTtM0DV1WsdpAVlaRLSoICi4ERScEj6PbldYex4LX1F08fyNjM7MN8m1ee5x9GAq5ER8TQb47LQs8ldnG49U8E8p65ErMj0jIzeRT8EerObz9UO3JZeOhWNiL+OiA5V4LTiy+tyTZBjcvXJ8KWDzQ4SSuc/NbllCMHtmLWJhHwOdEHwc0djSkpToWkkVk8nXKEBL72cQglQMdzgrH9Iiggwnk5XoJXwp1/f90mMf3Hzu4vyxBKqvUAycPe3A1to9Wy+0Hn1BX24oM+ftxbTKAQkXF3cVvUBrtvYtRARNhL1Y2y3ixXrJYf3PmQBsuV1Rt7skWdejcsA9nhngsvi9hOVW2lYfZy4OtOuA2Plc1cyITp/w4cciDZ2t5vPtoTz3GxHILSVkzu3dp3I8ogb+2Dz8/7MOFqKB7y7R8MsJj6rgPSxvWsLgcnL6XK6tMryjLWTHvltCJY15Mj4hIpit4ulaw5IOKOZGiWS3khlGKr1JlpKVaS4o1ZRcPV3IWrfc7OdyaOUhLsVPZn43wGD/qBe92/LaICJGpc1Khd+YzlNZt6Q8AsfpGImStUAL6b72laeWfdkWj/IweM/s5ecTYDjqFiISC9JKe+nkT8msSFfRQsR4hUAKMjw3Ym0RmK8kM/SoryMoKgqIL+0XX381Qu0rpeYb+KzDh/AQ2ZmDL5ziOTgAAAABJRU5ErkJggg==');
    return img;
  };
  ChoiceEdge.prototype.handler = awssfEdgeHandler;
  registCodec(ChoiceEdge);

  DefaultEdge = function DefaultEdge(){};
  DefaultEdge.prototype.type = 'Default';  
  DefaultEdge.prototype.create = function(label){
    if (label == null ) label = this.type;  
    var cell = createEdge(this, DefaultEdge, label, 'endArrow=classic;html=1;strokeColor=#000000;strokeWidth=1;fontSize=12;');
    return cell;
  };
  DefaultEdge.prototype.validate = function(cell, res){
    if (!res) res = [];
    if (!(cell.source && cell.target)){
      res.push("edge MUST be connected");
    }
    return res;
  };
  DefaultEdge.prototype.expJSON = function(cell, cells){
    if (cell.target != null){
      var data = {
        Default: cells[cell.target.id].getAttribute("label")
      }
      return data;
    }else{
      return {};
    }
  };
  DefaultEdge.prototype.createHandlerImage = function(){
    var img = awssfUtils.createHandlerImage.call(this, DefaultEdge, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABsklEQVRIS9WVO0sDQRDH/9ek0YAQsEgQFCRpxCaKmuoOQRtN7aOxEVtBP0B8gCARrESwsdI+WoggHkGDoH6ABPGJdhYaEY3Fyma53L5yXoIRHLjmduY3s/PYMQghBB5SfAKeC+wLRdkXDHtZuGeGDl4qArk14NYGSm8qKNAMtJtAYg4IBKs7UuAUaKf0UBlDnZgp5kgnApxCC/v+rsxrdY0BiXnVrgKnER9qFPy6GkqrNyjDaY53Rt1UhHsAaxFoauXQBPgsAndZ4HQV+HoX3dIUTeyJNSjD5XQ48IcckF1mkJYOoHsS6BwGro9YXWSJjrAaOFKGb5tiAXVwx8BaAtoGgFwauDpQo5+yOfjrIyG7SVHJCx5LAv2zQD4DnK2r0Y9n3Dkwbo4JkQvpBfc6o674whoXm4RcbvmPPNIHWAvA/YlbD946Pg3EZ9ifmiP/KS1C5LXmfHAFiPSyqOlsyCLk3G+3+GlF2utCt3j1uTxEHy+s/c431CGiN9D2uTyhfkee16s6oVSpYW+LE0G9ryLffvxt/u49d7w2bBPJxazs0DwQiv3CDq2nW3Q22gX9L+Df4kMPyOkzB4MAAAAASUVORK5CYII=');
    return img;
  };
  DefaultEdge.prototype.handler = awssfEdgeHandler;
  registCodec(DefaultEdge);

  // Avoids having to bind all functions to "this"
  var sb = ui.sidebar;

  // Adds custom sidebar entry
  sb.addPalette('awsStepFunctions', 'AWS Step Functions', true, function(content) {
    var verticies = [AWSconfig, StartPoint, EndPoint, TaskState, PassState, ChoiceState, WaitState, SucceedState, FailState, ParallelState];
    for (var i in verticies){
      var cell = verticies[i].prototype.create();
      content.appendChild(sb.createVertexTemplateFromCells([cell], cell.geometry.width, cell.geometry.height, cell.label));
    }
  });

  // Collapses default sidebar entry and inserts this before
  var c = ui.sidebar.container;
  c.firstChild.click();
  c.insertBefore(c.lastChild, c.firstChild);
  c.insertBefore(c.lastChild, c.firstChild);

  mxGraphCreateEdge = mxGraph.prototype.createEdge;
  mxGraph.prototype.createEdge = function(parent, id, value, source, target, style)
  {
    if (awssfUtils.isAWSsf(source) && source.awssf.create_default_edge){
      return source.awssf.create_default_edge(source);
    }else{
      return mxGraphCreateEdge.apply(this, arguments);
    }
  };

  origGraphCreateHander = ui.editor.graph.createHandler;
  ui.editor.graph.createHandler = function(state)
  {
    if (state != null && (this.getSelectionCells().length == 1) && awssfUtils.isAWSsf(state.cell) && state.cell.awssf.handler)
    {
      return new state.cell.awssf.handler(state);
    }
    return origGraphCreateHander.apply(this, arguments);
  };

  mxConnectionHandlerCreateEdgeState = mxConnectionHandler.prototype.createEdgeState;
  mxConnectionHandler.prototype.createEdgeState = function(me){
    var cell = this.previous.cell;
    if (awssfUtils.isAWSsf(cell) && cell.awssf.create_default_edge){
      var edge = cell.awssf.create_default_edge(cell);
      if (!edge) return null
      return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge))
    }else{
      return mxConnectionHandlerCreateEdgeState.apply(this, arguments);
    }
  };

  mxConnectionHandlerInsertEdge = mxConnectionHandler.prototype.insertEdge;
  mxConnectionHandler.prototype.insertEdge = function(parent, id, value, source, target, style)
  {
    var edge = null;
    if (!awssfUtils.isAWSsf(source)) {
      return mxConnectionHandlerInsertEdge.apply(this, arguments);
    }
    if (awssfUtils.isParallelChild(source) || awssfUtils.isParallelChild(target)){
      if (source.parent != target.parent) return null;
    }
    if ((source == target) && (awssfUtils.isTask(source) || awssfUtils.isParallel(source))){
      edge = RetryEdge.prototype.create();
    } else if (this.edgeState) {
      edge = this.edgeState.cell;
    } else if (source.awssf && source.awssf.create_default_edge){
      edge = source.awssf.create_default_edge(source);
    }else{
      return null; // cancel
    }
    if (edge != null){
      edge = this.graph.addEdge(edge, parent, source, target);
      return edge;
    }else{
      return null;
    }
  };

  mxGraphModelCellAdded = ui.editor.graph.getModel().cellAdded;
  ui.editor.graph.getModel().cellAdded = function(cell){
    if (!awssfUtils.isAWSsf(cell)){
      return mxGraphModelCellAdded.apply(this, arguments);
    }
    var names = {};
    for (var i in this.cells){
      var a = this.cells[i];
      if (a.isVertex() && a.getAttribute("label")){
        var label = a.getAttribute("label");
        if (names[label]){
          names[label].push(a);
        }else{
          names[label] = [a];
        }
      }
    }
    var label = cell.getAttribute("label");
    if (cell.isVertex() && names[label]){
      if (!awssfUtils.isStart(cell) && !awssfUtils.isEnd(cell)){
        var index = 2;
        var new_label = label.replace(/(\d*)$/, index);
        while(names[new_label]){
          index++;
          new_label = label.replace(/(\d*)$/, index);
        }
        cell.setAttribute("label", new_label);
      }
    }
    setupRoot();
    return mxGraphModelCellAdded.apply(this, arguments);
  };

  origEditDataDialog = EditDataDialog;
  EditDataDialog = function(ui, cell){
    if (!awssfUtils.isAWSsf(cell)){
      return origEditDataDialog.apply(this, arguments);
    }
    var div = document.createElement('div');
    var graph = ui.editor ? ui.editor.graph : ui.graph;

    div.style.height = '100%'; //'310px';
    div.style.overflow = 'auto';
    
    var value = graph.getModel().getValue(cell);
    
    // Converts the value to an XML node
    if (!mxUtils.isNode(value))
    {
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
    
    var attrs = value.attributes;
    var names = [];
    var texts = [];
    var count = 0;
    
    var addTextArea = function(index, name, value)
    {
      names[index] = name;
      texts[index] = form.addTextarea(names[count] + ':', value, 2);
      texts[index].style.width = '100%';
      return texts[index];
    };

    var addText = function(index, name, value)
    {
      names[index] = name;
      texts[index] = form.addText(names[count] + ':', value);
      texts[index].style.width = '100%';
      return texts[index];
    };

    for (var i = 0; i < attrs.length; i++)
    {
      var nodeName = attrs[i].nodeName;
      var nodeValue = attrs[i].nodeValue;
      if (cell.awssf.hiddenAttributes && cell.awssf.hiddenAttributes.indexOf(nodeName) >= 0) continue;
      if (nodeName == 'type') {
        var span = document.createElement('span');
        mxUtils.write(span, nodeValue);
        form.addField('type:', span);
      }
      else if ((typeof(AWS) === "object") && (nodeName == 'resource')){
        var input = addText(count, nodeName, nodeValue);
        count++;
        input.setAttribute("list", "resources");
        var datalist = document.createElement('datalist');
        datalist.id = "resources";
        getResourceList(function(resources){
          for (var j in resources){
            var opt = document.createElement('option');
            opt.value = resources[j];
            datalist.appendChild(opt);
          };
        });
        div.appendChild(datalist);
      }
      else if (nodeName == 'label' && (awssfUtils.isChoice(cell) || awssfUtils.isRetry(cell) || awssfUtils.isCatch(cell))){
        var input = addText(count, nodeName, nodeValue);
        count++;
        input.setAttribute("list", "candidates");
        var datalist = document.createElement('datalist');
        datalist.id = "candidates";
        var candidates = [];
        if (attrs["error_equals"]) candidates.push("%error_equals%");
        if (attrs["condition"]) candidates.push("%condition%");
        for (var j in candidates){
          var opt = document.createElement('option');
          opt.value = candidates[j];
          datalist.appendChild(opt);
        };
        div.appendChild(datalist);
      }
      else if (nodeName == 'error_equals'){
        var input = addText(count, nodeName, nodeValue);
        count++;
        input.setAttribute("list", "errors");
        var datalist = document.createElement('datalist');
        datalist.id = "errors";
        var errors = [
          "States.ALL", "States.Timeout", "States.TaskFailed", "States.Permissions",
          "States.ResultPathMatchFailure", "States.BranchFailed", "States.NoChoiceMatched"
        ];
        for (var j in errors){
          var opt = document.createElement('option');
          opt.value = errors[j];
          datalist.appendChild(opt);
        };
        div.appendChild(datalist);
      }
      else if (cell.awssf && cell.awssf.buildForm){
        var res = cell.awssf.buildForm(form, nodeName, nodeValue);
        if (res != null){
          names[count] = res[0];
          texts[count] = res[1];
          count++;
        }
      }
      else if (/*nodeName != 'label' && */nodeName != 'placeholders')
      {
        addTextArea(count, nodeName, nodeValue);
        count++;
      }
    }
    
    div.appendChild(form.table);

    this.init = function()
    {
      if (texts.length > 0)
      {
        texts[0].focus();
      }
      else
      {
        nameInput.focus();
      }
    };
    
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
      ui.hideDialog.apply(ui, arguments);
    });
    cancelBtn.className = 'geBtn';
    
    var applyBtn = mxUtils.button(mxResources.get('apply'), function()
    {
      try
      {
        ui.hideDialog.apply(ui, arguments);
        
        // Clones and updates the value
        value = value.cloneNode(true);
        var removeLabel = false;
        
        for (var i = 0; i < names.length; i++)
        {
          if (cell.awssf && cell.awssf.applyForm){
            removeLabel = removeLabel || cell.awssf.applyForm(value, names[i], texts[i]);
          }else{
            if (texts[i] == null)
            {
              value.removeAttribute(names[i]);
            }
            else
            {
              value.setAttribute(names[i], texts[i].value);
              removeLabel = removeLabel || (names[i] == 'placeholder' &&
                value.getAttribute('placeholders') == '1');
            }
          }
        }
        
        // Removes label if placeholder is assigned
        if (removeLabel)
        {
          value.removeAttribute('label');
        }
        
        // Updates the value of the cell (undoable)
        graph.getModel().setValue(cell, value);
      }
      catch (e)
      {
        mxUtils.alert(e);
      }
    });
    applyBtn.className = 'geBtn gePrimaryBtn';
    
    var buttons = document.createElement('div');
    buttons.style.marginTop = '18px';
    buttons.style.textAlign = 'right';
    
    if (graph.getModel().isVertex(cell) || graph.getModel().isEdge(cell))
    {
      var replace = document.createElement('span');
      replace.style.marginRight = '10px';
      var input = document.createElement('input');
      input.setAttribute('type', 'checkbox');
      input.style.marginRight = '6px';
      
      if (value.getAttribute('placeholders') == '1')
      {
        input.setAttribute('checked', 'checked');
        input.defaultChecked = true;
      }
    
      mxEvent.addListener(input, 'click', function()
      {
        if (value.getAttribute('placeholders') == '1')
        {
          value.removeAttribute('placeholders');
        }
        else
        {
          value.setAttribute('placeholders', '1');
        }
      });
      
      replace.appendChild(input);
      mxUtils.write(replace, mxResources.get('placeholders'));
      
      if (EditDataDialog.placeholderHelpLink != null)
      {
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
    
    if (ui.editor && ui.editor.cancelFirst)
    {
      buttons.appendChild(cancelBtn);
      buttons.appendChild(applyBtn);
    }
    else
    {
      buttons.appendChild(applyBtn);
      buttons.appendChild(cancelBtn);
    }

    div.appendChild(buttons);
    this.container = div;    
  }

	mxResources.parse('stepFunctions=StepFunctions');
	mxResources.parse('awssfValidate=Validate');
	mxResources.parse('awssfExportJSON=Export JSON');
	mxResources.parse('awssfExportYAML=Export YAML');
	mxResources.parse('awssfExport=Export');
	mxResources.parse('awssfLambda=Lambda');
  mxResources.parse('awssfDeploy=Deploy(CORS not supported)');
  mxResources.parse('awssfInvoke=Invoke(CORS not supported)');

  //override editData...
	ui.actions.addAction('editData...', function()
	{
		var cell = ui.editor.graph.getSelectionCell() || ui.editor.graph.getModel().getRoot();
		
		if (cell != null)
		{
			var dlg = new EditDataDialog(ui, cell);
			ui.showDialog(dlg.container, 600, 320, true, false);
      dlg.container.parentNode.style.resize = 'both';
			dlg.init();
		}
	}, null, null, 'Ctrl+M');

  ui.actions.addAction('awssfValidate', function()
  {
    var checklist = {
      START_EXIST: [false, 'start MUST exist'],
      END_EXIST: [false, 'end MUST exist'],
      UNIQ_NAME: [true, {}, 'name MUST be unique.'],
      NAME_LENGTH: [true, [], 'name MUST BE less than or equal to 128 unicode characters.']
    };
    var model = ui.editor.graph.getModel();
    for(var i in model.cells){
      var cell = model.cells[i];
      if (cell.awssf && cell.awssf.validate){
        var res = cell.awssf.validate(cell);
        if (res.length > 0){
          checklist[label] = [false, [], res.join("\n")];
          ui.editor.graph.setCellWarning(cell, res.join("\n"));
        }else{
          ui.editor.graph.setCellWarning(cell, null);
        }
      }
      if (!cell.isVertex()) continue;
      var label = cell.getAttribute("label");
      if (label != null && !awssfUtils.isStart(cell) && !awssfUtils.isEnd(cell)){
        if (checklist.UNIQ_NAME[1][label] >= 1){
          checklist.UNIQ_NAME[0] = false;
          checklist.UNIQ_NAME[1][label] += 1;
        }else{
          checklist.UNIQ_NAME[1][label] = 1;
        }
        if (label.length > 128){
          checklist.NAME_LENGTH[0] = false;
          checklist.NAME_LENGTH[1].push(label);
        }
      }
      if (cell.value != null){
        if (awssfUtils.isStart(cell)){
          checklist.START_EXIST[0] = true;
        }
        if (awssfUtils.isEnd(cell)){
          checklist.END_EXIST[0] = true;
        }
      }
    }
    var msg = [];
    for(var i in checklist){
      if (checklist[i][0] == false){
        msg.push(checklist[i][checklist[i].length - 1]);
      }
    }
    if(msg.length > 0)
      mxUtils.alert(msg.join("\n"));
  });

  function setupRoot(){
    if (!ui.editor.graph.getModel().cells) return;
    var cell = ui.editor.graph.getModel().getRoot();
    if (cell && (cell.value == null)){
      cell.value = mxUtils.createXmlDocument().createElement('object');    
      if (cell.getAttribute("type") == null) cell.setAttribute("type", "awssfRoot");
      if (cell.getAttribute("name") == null) cell.setAttribute("name", "");
      if (cell.getAttribute("comment") == null) cell.setAttribute("comment", "");
      if (cell.getAttribute("timeout_seconds") == null) cell.setAttribute("timeout_seconds", "");
      if (cell.getAttribute("version") == null) cell.setAttribute("version", "");
      if (cell.getAttribute("role_arn") == null) cell.setAttribute("role_arn", "");
      cell.awssf = {};
    }
    return;
  }

  function getStepFunctionDefinition(){
    var states = {};
    var model = ui.editor.graph.getModel();
    var startat = null;
    for(var i in model.cells){
      var cell = model.cells[i];
      if (!awssfUtils.isAWSsf(cell)) continue;
      if (awssfUtils.isAWSconfig(cell)) continue;
      if (awssfUtils.isParallelChild(cell)) continue;
      if (awssfUtils.isStartAt(cell)){
        startat = model.cells[cell.target.id].getAttribute("label");
      };
      if (awssfUtils.isStart(cell) || awssfUtils.isEnd(cell)) continue;
      if (cell.isVertex()){
        Object.assign(states, cell.awssf.expJSON(cell, model.cells));
      }
    }
    var root = model.getRoot();
    var data = {};
    if (root.getAttribute("comment"))
      data.Comment = root.getAttribute("comment");
    if (startat)
      data.StartAt = startat;
    data.States = states;
    if (root.getAttribute("timeout_seconds"))
      data.TimeoutSeconds = Number(root.getAttribute("timeout_seconds"));
    if (root.getAttribute("version"))
      data.Version = root.getAttribute("version");
    return data;
  }

  ui.actions.addAction('awssfExportJSON', function()
  {
    var data = getStepFunctionDefinition();
    mxUtils.popup(JSON.stringify(data, null, "  "), true);
  });

  ui.actions.addAction('awssfExportYAML', function()
  {
    var data = getStepFunctionDefinition();
    mxUtils.popup(jsyaml.dump(data), true);
  });

  ui.actions.addAction('awssfExport', function()
  {
    var encoder = new mxCodec();
    var node = encoder.encode(ui.editor.graph.getModel());
    mxUtils.popup(mxUtils.getPrettyXml(node), true);
  });

  function setupAWSconfig(){
    var codec = new mxCodec();
    var model = ui.editor.graph.getModel();
    var node = codec.encode(model);
    var found = mxUtils.findNode(node, "type", "awssfAWSconfig");
    if (found == null){
      //mxUtils.alert("You need to put a AWSconfig.")
      return false;
    }
    var awsconfig = codec.decode(found);
    AWS.config.update({accessKeyId: awsconfig.getAttribute('accessKeyId'), secretAccessKey: awsconfig.getAttribute('secretAccessKey'), region: awsconfig.getAttribute('region')});
    return true;
  }

  function getCallerIdentity(callback){
    var sts = new AWS.STS({apiVersion: '2011-06-15'});
    sts.getCallerIdentity({}, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else callback(data); 
    });    
  }

  function getResourceList(callback){
    if (!setupAWSconfig()) return;
    var funclist = [];
    // var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
    // stepfunctions.listActivities({}, function(err, data){
    //   if (err) console.log(err, err.stack); // an error occurred
    //   else{
    //     for(var i in data.activities){
    //       var act = data.activities[i];
    //       funclist.push(func.activityArn);
    //     }
    //   };
      var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
      lambda.listFunctions({}, function(err,data){
        if (err) console.log(err, err.stack); // an error occurred
        else{
          for(var i in data.Functions){
            var func = data.Functions[i];
            funclist.push(func.FunctionArn);
          }
          callback(funclist);
        }
      });
    // });
  }

  function isSupproted(){
    var sdk_supported = (typeof(AWS) == "object") && (typeof(AWS.StepFunctions) == "object");
    var cors_supported = false;
    return sdk_supported && cors_supported;
  }

  ui.actions.addAction('awssfDeploy', function()
  {
    if (!setupAWSconfig()) return;
    var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
    getCallerIdentity(function(data){
      var params = {
        definition: JSON.stringify(getStepFunctionDefinition()),
        name: ui.editor.graph.getModel().cells[0].getAttribute("name"),
        roleArn: ui.editor.graph.getModel().cells[0].getAttribute("role_arn")
      }; 
      stepfunctions.createStateMachine(params, function(err, data) {
        if (data) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });    
    });
  }).isEnabled = isSupproted;

  ui.actions.addAction('awssfInvoke', function()
  {
    if (!setupAWSconfig()) return;
    var stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
  }).isEnabled = isSupproted;  

	var menu = ui.menubar.addMenu('StepFunctions', function(menu, parent)
	{
		ui.menus.addMenuItems(menu, ['-', 'awssfValidate', '-', 'awssfExportJSON', 'awssfExportYAML', 'awssfExport' , '-', 'awssfDeploy', 'awssfInvoke']);
	});
	
	// Inserts voice menu before help menu
	var menu = menu.parentNode.insertBefore(menu, menu.previousSibling.previousSibling.previousSibling);


});
