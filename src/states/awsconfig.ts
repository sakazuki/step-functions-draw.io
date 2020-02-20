import { registCodec, awssfStateHandler } from "./helper";

function createAWSconfig (awsf) {
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

export const AWSconfig = function () {};
AWSconfig.prototype.create = function () {
  return createAWSconfig(this);
};
AWSconfig.prototype.handler = awssfStateHandler;
registCodec('AWSconfig', AWSconfig);
