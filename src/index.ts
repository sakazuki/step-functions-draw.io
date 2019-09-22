mxscript("https://cdn.rawgit.com/soney/jsep/b8baab7b/build/jsep.min.js");
mxscript("https://cdn.rawgit.com/nodeca/js-yaml/9c1894e2/dist/js-yaml.min.js");
mxscript("https://sdk.amazonaws.com/js/aws-sdk-2.510.0.min.js");
// mxscript("https://rawgit.com/soney/jsep/master/build/jsep.min.js");
// mxscript("https://f248fda6.ngrok.io/aws-sdk-2.510.0.js");
// mxscript("https://localhost:8000/js/jsep.min.js");
mxscript("https://cdn.jsdelivr.net/npm/jsoneditor@7.0.4/dist/jsoneditor.min.js");

var linkElement = document.createElement('link');
linkElement.setAttribute('rel', 'stylesheet');
linkElement.setAttribute('href', 'https://cdn.jsdelivr.net/npm/jsoneditor@7.0.4/dist/jsoneditor.min.css');
document.getElementsByTagName('head')[0].appendChild(linkElement);

import main from "./main";

Draw.loadPlugin(main);

