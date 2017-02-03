# AWS Step Functions Workflow Designer

 You can make a step functions workflow with GUI and export JSON.
 
 This is a AWS Step Functions plugin for draw.io.

(Under writing...)

## Setup
- Access to https://www.draw.io/.
- Select Save Option (ex. Decide Later...)
- Select Menu [Extras]-[Plugins]
- Click [Add]
- Input https://rawgit.com/sakazuki/step-functions-draw.io/master/aws-step-functions.js
  (Thanks: https://rawgit.com/)
- [Apply]
- Reload the page

## Example
1. Drag and drop a **Start** on a canvas
1. Drag and drop a **Task** on a canvas
1. Drag a connection from **Start** to **Task**
1. Right Click on **Task**, Select **Edit Data...**, and Input params
1. Drag and drop a **End** on a canvas
1. Drag a connection from **Task** to **End**
1. Menu [StepFunctions]-[Export JSON]

## Usage
### Top-level fields
- You can set them with [Edit Data...] on a canvas.

### Choice Connection Condition field
- You can use `==`, `>`, `<`, `>=`, `<=`, `!`, `&&`, `||`, `()`.
- You can write it like `($.x == true) && ($.y == 3) && !($.z == 2)`
- I parse it using JSEP (https://github.com/soney/jsep) in Choice Condition.

### Draw Default from Choice
- Drag a **Next** connection in the sidebar and drop on **Choice**

### Catch
- Drag a **Catch** connection in the sidebar and drop on the source state.

### Retry
- Drag a connection from a state and Drop on self.


## Feature
- You can put states that are not connected.
- You can use states that is normal shapes that draw.io provides.

