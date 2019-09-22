declare module AWS {
  const config
  const STS
  const Lambda
}

declare module jsyaml {
  function load(data: string)
  function dump(obj)
}
declare function jsep(condition)
declare class JSONEditor {
  constructor(node, options)
  set(json)
  get()
  format()
  compact()
}

declare let AWSconfig
declare let StartPoint
declare let EndPoint
declare let TaskState
declare let PassState
declare let ChoiceState
declare let WaitState
declare let SucceedState
declare let FailState
declare let ParallelState
declare let MapState

declare let StartAtEdge
declare let NextEdge
declare let RetryEdge
declare let ChoiceEdge
declare let CatchEdge
declare let DefaultEdge

interface StepFunctionsDefinitions {
  Comment?: string
  StartAt: string
  States: any
  TimeoutSeconds?: number
  Version?: string
}

interface mxCell {
  awssf: any
}