import { linkStyle } from "./utils";
import main from "./main";

mxscript("https://cdn.jsdelivr.net/npm/jsep@0.3.4/build/jsep.min.js");
mxscript("https://cdn.jsdelivr.net/npm/js-yaml@3.13.1/dist/js-yaml.min.js");
mxscript("https://sdk.amazonaws.com/js/aws-sdk-2.510.0.min.js");
mxscript("https://cdn.jsdelivr.net/npm/jsoneditor@7.0.4/dist/jsoneditor.min.js");
linkStyle('https://cdn.jsdelivr.net/npm/jsoneditor@7.0.4/dist/jsoneditor.min.css');

Draw.loadPlugin(main);

