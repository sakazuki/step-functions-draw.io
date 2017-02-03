# AWS Step Functions Workflow Designer

 You can make a step functions workflow with GUI and export JSON.
 
 This is a AWS Step Functions plugin for draw.io.

(Under writing...)

## Setup
- Access to https://www.draw.io/.
- Select Save Option (ex. Decide Later...)
- Select Menu [Extras]-[Plugins]
- Click [Add]
- Input https://github.com/sakazuki/step-functions-draw.io/raw/master/aws-step-functions.js
- [Apply]

## Example
1. Drag and drop a **Start** on a canvas
1. Drag and drop a **Task** on a canvas
1. Drag a connection from **Start** to **Task**
1. Right Click on **Task**, Select **Edit Data...**, and Input params
1. Drag and drop a **End** on a canvas
1. Drag a connection from **Task** to **End**
1. Menu [StepFunctions]-[Export JSON]

## Feature
- Top-level fields: [Edit Data...] on a canvas
- use JSEP (https://github.com/soney/jsep) in Choice Condition.
- Retry: Drag a connection and Drop on self.




