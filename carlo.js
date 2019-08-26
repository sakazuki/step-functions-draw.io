const carlo = require('carlo');
const AWS = require('aws-sdk');
const fs = require('fs');

(async () => {
  const app = await carlo.launch();
  let closing = false;
  app.on('exit', () => {
    closing = true
    process.exit()
  });
  app.serveHandler(request => {
    if (request.url() === 'https://localhost/aws-step-functions.js')
      request.fulfill({body: fs.readFileSync('./aws-step-functions.js')});
    else
      request.continue();
  });
  app.serveFolder(__dirname);

  await app.load('https://www.draw.io');

  await app.exposeFunction('__updateAWSconfig', params => {
    AWS.config.update(params);
    return Promise.resolve()
  });

  await app.exposeFunction('__listStateMachines', async _ => {
    try {
      const stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
      return await stepfunctions.listStateMachines({}).promise()
    } catch (err) {
      console.log(err)
      throw err
    }
  });

  await app.exposeFunction('__describeStateMachine', async arn => {
    try {
      const stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
      return await stepfunctions.describeStateMachine({ stateMachineArn: arn }).promise()
    } catch (err) {
      console.log(err)
      throw err
    }
  })

  await app.exposeFunction('__deployStateMachine', async params => {
    try {
      const stepfunctions = new AWS.StepFunctions({apiVersion: '2016-11-23'});
      if (params.stateMachineArn) {
        return await stepfunctions.updateStateMachine(params).promise()
      } else {
        return await stepfunctions.createStateMachine(params).promise()
      }
    } catch (err) {
      console.log(err)
      throw err
    }
  })

})()
