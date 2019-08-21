# AWS Step Functions Workflow Designer

## About this
- You can make a AWS step functions workflow with GUI on the browser and export JSON.
- [v0.4.0-] You can import workflow definition JSON/YAML and update it with GUI.

 This is a AWS Step Functions plugin for [draw.io](https://github.com/jgraph/draw.io).

 Introduction movie is below   
[![Intro Movie](https://img.youtube.com/vi/NrMcFdTdhhU/0.jpg)](https://youtu.be/NrMcFdTdhhU)

## Quick Start
1. Access to https://www.draw.io/.
1. Select Save Option (ex. Decide Later...)
1. Select Menu [Extras]-[Plugins]
1. Click [Add]
1. Input https://cdn.jsdelivr.net/gh/sakazuki/step-functions-draw.io@0.4.3/aws-step-functions.js
1. [Apply]
1. Reload the page

- You can run locally draw.io in the browser too. See details [draw.io Wiki page](https://github.com/jgraph/draw.io/wiki/Building)


## Example
1. Drag and drop a **Start** on a diagram
1. Drag and drop a **Task** on a diagram
1. Select **Task**, and click a **Settings**(gear) icon, and Input params
1. Drag a connection from **Start** to **Task**
1. Drag and drop a **End** on a diagram
1. Drag a connection from **Task** to **End**
1. Menu [StepFunctions]-[Export JSON]
1. Copy the output and paste it to AWS Step Functions management console.

## Usage
### Top-level fields
- You can set them with [Edit Data...] on a diagram.
  <img src="https://user-images.githubusercontent.com/1878694/59982817-e4b40b00-9652-11e9-92be-5a2e22eb6fb1.png" width="550">

### AWS config
- You can select a function from lamdba when you input AWS config variables.

### Choice Connection Condition field
- You can use `==`, `>`, `<`, `>=`, `<=`, `!`, `&&`, `||`, `()`.
- You can write it like `($.x == true) && ($.y == 3) && !($.z == 2)`.
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


## Direct version

1. Download binary from [Releases page](https://github.com/sakazuki/step-functions-draw.io/releases)
1. Execute **step-functions-drawio-desktop.exe** or **step-functions-drawio-desktop-macos**
1. Select Save Option (ex. Decide Later...)
1. Select Menu [Extras]-[Plugins]
1. Click [Add]
1. Input https://cdn.jsdelivr.net/gh/sakazuki/step-functions-draw.io@0.4.3/aws-step-functions.js
1. [Apply]
1. Reload the page (Right click on a header part, and select reload menu.)
