# AWS Step Functions Workflow Designer

 You can make a step functions workflow with GUI and export JSON.
 
 This is a AWS Step Functions plugin for draw.io.

[![intro](https://img.youtube.com/vi/NrMcFdTdhhU/0.jpg)](https://youtu.be/NrMcFdTdhhU)

## Example
1. Drag and drop a **Start** on a diagram
1. Drag and drop a **Task** on a diagram
1. Select **Task**, and click a **Settings**(gear) icon, and Input params
1. Drag a connection from **Start** to **Task**
1. Drag and drop a **End** on a diagram
1. Drag a connection from **Task** to **End**
1. Menu [StepFunctions]-[Export JSON]
1. Copy the output and paste it to AWS Step Functions management console.

## Setup
- Access to https://www.draw.io/.
- Select Save Option (ex. Decide Later...)
- Select Menu [Extras]-[Plugins]
- Click [Add]
- Input https://rawgit.com/sakazuki/step-functions-draw.io/master/aws-step-functions.js
  (Thanks: https://rawgit.com/)
- [Apply]
- Reload the page

## Usage
### Top-level fields
- You can set them with [Edit Data...] on a canvas.

### AWS config
- You can select a function from lamdba when you input AWS config variables.

### Choice Connection Condition field
- You can use `==`, `>`, `<`, `>=`, `<=`, `!`, `&&`, `||`, `()`.
- You can write it like `($.x == true) && ($.y == 3) && !($.z == 2)`
- I parse it using JSEP (https://github.com/soney/jsep) in Choice Condition.

### Retry
- Drag a connection from a state and Drop on self.

### Weight fields
- This fields are used to define order (from big to small)

## Feature
- You can put states that are not connected.
- You can use states that is normal shapes that draw.io provides.

## Useful TIPS
- Put a inputed AWSconfig into [Scratchpad].
- Put a frequent useful pattern into [Scratchpad].