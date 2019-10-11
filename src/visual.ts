"use strict";


import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import ISelectionManager = powerbi.extensibility.ISelectionManager
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
// import DataView = powerbi.DataView;
import ISelectionId = powerbi.visuals.ISelectionId;
// import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
// import PrimitiveValue = powerbi.PrimitiveValue;
import Fill = powerbi.Fill;
import * as d3 from "d3";
import * as svgAnnotations from "d3-svg-annotation";

import {
  valueFormatter as vf,
} from "powerbi-visuals-utils-formattingutils";

import DataViewObjects = powerbi.DataViewObject;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import IVisualHost = powerbi.extensibility.visual.IVisualHost;

//Global settings to the visual
interface AnnotatedBarSettings {
  annotationSettings: {
    stagger: boolean,
    spacing: any,
    // editMode: boolean,
    separator: string,
    sameAsBarColor: boolean,
    barHeight: number,
    displayUnits: number,
    precision: any,
    overlapStyle: string,
    labelInfo: string,
  },
  axisSettings: {
    bold: boolean,
    axis: any,
    axisColor: any,
    fontSize: number,
    fontFamily: string,
    manualScale: boolean,
    barMin: any,
    barMax: any
  },
  textFormatting: {
    allTextTop: boolean,
    labelOrientation: string,
    annotationStyle: string,
    fill: any,
    FontFamily: string,
    fontSize: number
  }
}

//Individual values and settings from specific data point
interface AnnotatedBarDataPoint {
  value: any;
  displayName: string;
  barColor: string;
  selectionId: ISelectionId;
  LabelColor: string
  FontFamily: string
  fontSize: number
  ShowInBar: boolean
  dx: any
  dy: any
  x: any
  y: any
  top: string
  transformed: any
  customFormat: boolean
  labelOrientation: string
  highlight: boolean
};

interface AnnotatedBarViewModel {
  dataPoints: AnnotatedBarDataPoint[];
  settings: AnnotatedBarSettings
};

function createFormatter(format, precision?: any, value?: number) {
  let valueFormatter = {}
  valueFormatter["format"] = format;
  valueFormatter["value"] = value

  if (precision !== false) {
    valueFormatter["precision"] = precision
  }

  return vf.create(valueFormatter)
}

function visualTransform(options: VisualUpdateOptions, host: IVisualHost): AnnotatedBarViewModel {
  let dataViews = options.dataViews;

  let defaultSettings: AnnotatedBarSettings = {
    annotationSettings: {
      sameAsBarColor: false,
      stagger: true,
      spacing: 20,
      barHeight: 30,
      displayUnits: 0,
      precision: false,
      overlapStyle: 'full',
      labelInfo: 'Auto',
      // editMode: false,
      separator: ":"
    },
    axisSettings: {
      axis: "None",
      axisColor: { solid: { color: 'gray' } },
      fontSize: 12,
      fontFamily: 'Arial',
      bold: false,
      manualScale: true,
      barMin: false,
      barMax: false
    },
    textFormatting: {
      allTextTop: false,
      labelOrientation: "Auto",
      annotationStyle: "annotationLabel",
      fontSize: 12,
      FontFamily: 'Arial',
      fill: { solid: { color: 'gray' } }
    }
  };

  let viewModel: AnnotatedBarViewModel = {
    dataPoints: [],
    settings: defaultSettings
  };


  let objects = dataViews[0].metadata.objects;


  if (!dataViews
    || !dataViews[0]
    || !dataViews[0].categorical
    || !dataViews[0].categorical.values) {
    return viewModel;
  }

  let categorical = dataViews[0].categorical;
  let dataValues = categorical.values;
  let category, dataValue, highlightsArray


  if (categorical.categories) {
    category = categorical.categories[0];
    dataValue = categorical.values[0];
    if (dataValue.highlights) {
      highlightsArray = categorical.values[0].highlights
    }
  }

  let annotatedBarSettings: AnnotatedBarSettings = {
    annotationSettings: {
      sameAsBarColor: getValue<boolean>(objects, 'annotationSettings', 'sameAsBarColor', defaultSettings.annotationSettings.sameAsBarColor),
      stagger: getValue<boolean>(objects, 'annotationSettings', 'stagger', defaultSettings.annotationSettings.stagger),
      separator: getValue<string>(objects, 'annotationSettings', 'separator', defaultSettings.annotationSettings.separator),
      barHeight: getValue<number>(objects, 'annotationSettings', 'barHeight', defaultSettings.annotationSettings.barHeight),
      // editMode: getValue<boolean>(objects, 'annotationSettings', 'editMode', defaultSettings.annotationSettings.editMode),
      spacing: getValue<any>(objects, 'annotationSettings', 'spacing', defaultSettings.annotationSettings.spacing),
      displayUnits: getValue<number>(objects, 'annotationSettings', 'displayUnits', defaultSettings.annotationSettings.displayUnits),
      precision: getValue<any>(objects, 'annotationSettings', 'precision', defaultSettings.annotationSettings.precision),
      overlapStyle: getValue<string>(objects, 'annotationSettings', 'overlapStyle', defaultSettings.annotationSettings.overlapStyle),
      labelInfo: getValue<string>(objects, 'annotationSettings', 'labelInfo', defaultSettings.annotationSettings.labelInfo)
    },
    axisSettings: {
      axis: getValue<any>(objects, 'axisSettings', 'axis', defaultSettings.axisSettings.axis),
      axisColor: getValue<string>(objects, 'axisSettings', 'axisColor', defaultSettings.axisSettings.axisColor),
      fontSize: getValue<number>(objects, 'axisSettings', 'fontSize', defaultSettings.axisSettings.fontSize),
      fontFamily: getValue<string>(objects, 'axisSettings', 'fontFamily', defaultSettings.axisSettings.fontFamily),
      bold: getValue<boolean>(objects, 'axisSettings', 'bold', defaultSettings.axisSettings.bold),
      manualScale: getValue<any>(objects, 'axisSettings', 'manualScale', defaultSettings.axisSettings.manualScale),
      barMin: getValue<any>(objects, 'axisSettings', 'barMin', defaultSettings.axisSettings.barMin),
      barMax: getValue<any>(objects, 'axisSettings', 'barMax', defaultSettings.axisSettings.barMax),

    },
    textFormatting: {
      allTextTop: getValue<boolean>(objects, 'textFormatting', 'allTextTop', defaultSettings.textFormatting.allTextTop),
      labelOrientation: getValue<string>(objects, 'textFormatting', 'labelOrientation', defaultSettings.textFormatting.labelOrientation),
      annotationStyle: getValue<string>(objects, 'textFormatting', 'annotationStyle', defaultSettings.textFormatting.annotationStyle),

      fontSize: getValue<number>(objects, 'textFormatting', 'fontSize', defaultSettings.textFormatting.fontSize),
      FontFamily: getValue<string>(objects, 'textFormatting', 'FontFamily', defaultSettings.textFormatting.FontFamily),
      fill: getValue<any>(objects, 'textFormatting', 'fill', defaultSettings.textFormatting.fill).solid.color

    }
  }

  let annotatedBarDataPoints: AnnotatedBarDataPoint[] = [];

  //QueryOn colors to be set as default
  let customColors = ["rgb(186,215,57)", "rgb(0, 188, 178)", "rgb(121, 118, 118)", "rgb(105,161,151)", "rgb(78,205,196)", "rgb(166,197,207)", "rgb(215,204,182)", "rgb(67,158,157)", "rgb(122,141,45)", "rgb(162,157,167)"]

  let length = categorical.categories ? Math.max(categorical.categories[0].values.length, categorical.values[0].values.length) : dataValues.length

  for (let i = 0, len = length; i < len; i++) {

    let defaultBarColor: Fill = {
      solid: {
        color: customColors[i > 10 ? i % 10 : i]
      }
    }


    let format, valueFormatter, dataPointValue, displayName, selectionId

    if (!categorical.categories) {
      format = options.dataViews[0].categorical.values[i].source.format;
      dataPointValue = dataValues[i].values[0]
      displayName = dataValues[i].source.displayName,
        selectionId = host.createSelectionIdBuilder()     //generates IDs for svg elements based on queryName
          .withMeasure(dataValues[i].source.queryName)
          .createSelectionId()

    } else {
      format = options.dataViews[0].categorical.values[0].source.format;
      dataPointValue = categorical.values[0].values[i]
      displayName = categorical.categories[0].values[i].toString()
      selectionId = host.createSelectionIdBuilder()     //generates IDs for svg elements based on queryName
        .withCategory(category, i)
        .createSelectionId()

    }

    valueFormatter = createFormatter(format, annotatedBarSettings.annotationSettings.precision, annotatedBarSettings.annotationSettings.displayUnits);

    let dataPoint = {
      value: dataPointValue,
      displayName: displayName,
      barColor: getCategoricalObjectValue<Fill>(categorical, i, 'barColorSelector', 'fill', defaultBarColor).solid.color,
      LabelColor: getCategoricalObjectValue<Fill>(categorical, i, 'textFormatting', 'fill', { solid: { color: "gray" } }).solid.color,
      FontFamily: getCategoricalObjectValue<string>(categorical, i, 'textFormatting', 'FontFamily', "Arial"),
      fontSize: getCategoricalObjectValue<number>(categorical, i, 'textFormatting', 'fontSize', 12),
      ShowInBar: getCategoricalObjectValue<boolean>(categorical, i, 'barColorSelector', 'ShowInBar', true),
      dx: getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'dx', false),
      dy: getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'dy', false),
      x: getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'x', false),
      y: getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'y', false),
      top: getCategoricalObjectValue<string>(categorical, i, 'textFormatting', 'top', "bottom"),
      labelOrientation: getCategoricalObjectValue<string>(categorical, i, 'textFormatting', 'labelOrientation', "Auto"),
      customFormat: getCategoricalObjectValue<boolean>(categorical, i, 'textFormatting', 'customFormat', false),
      transformed: valueFormatter.format(dataPointValue),
      selectionId: selectionId,
      highlight: highlightsArray && highlightsArray[i] ? true : false
    }
    annotatedBarDataPoints.push(dataPoint);
  }


  return {
    dataPoints: annotatedBarDataPoints,
    settings: annotatedBarSettings
  };
}


export function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
  //gets settings from global attributes in property pane.
  if (objects) {
    let object = objects[objectName];
    if (object) {
      let property: T = object[propertyName];
      if (property !== undefined) {
        return property;
      }
    }
  }
  return defaultValue;
}

export interface graphElements {
  Category: string;
  Value: number;
  Display: string;
  Color: string;
  Top: boolean;
  labelOrientation: string;
  AnnotationColor: string;
  AnnotationFont: string;
  AnnotationSize: number;
  x: any;
  y: any;
  dx: any;
  dy: any;
  selectionId: ISelectionId;
  textWidth: number;
  customFormat: boolean;
  showInBar: boolean;
  annotationText: string;
}

//getCategoricalObjectValue takes in categorical: all datapoints objects, dataPoint's index, object name: properties' categories, property name and default value. 
export function getCategoricalObjectValue<T>(category: any, index: number, objectName: string, propertyName: string, defaultValue: T): T {

  let categoryObjects
  if (!category.categories) {
    categoryObjects = category.values;
  }
  else {
    categoryObjects = category.categories[0].objects
  }
  if (categoryObjects) {
    let categoryObject
    categoryObject = categoryObjects[index];
    if (categoryObject) {
      let object
      if (category.categories) {
        object = categoryObject[objectName]
      } else {
        if (categoryObject.source.objects) {
          object = categoryObject.source.objects[objectName];

        }
      }
      if (object) {
        let property = object[propertyName];

        if (property !== undefined) {
          return property;
        }
      }

    }
  }

  return defaultValue;
}


export class Visual implements IVisual {
  private svg: d3.Selection<SVGElement, {}, HTMLElement, any>;
  private svgGroupMain: any;
  private padding: number;
  private width: number;
  private height: number;
  private minScale: any;
  private maxScale: any;
  private highlighted: boolean;
  private host: IVisualHost;
  private selectionManager: ISelectionManager;
  private selectionIdBuilder: ISelectionIdBuilder;
  private annotatedBarSettings: AnnotatedBarSettings;
  private viewModel: AnnotatedBarViewModel;

  constructor(options: VisualConstructorOptions) {

    this.svg = d3.select(options.element).append('svg');
    this.svgGroupMain = this.svg.append('g');
    this.padding = 15;
    this.host = options.host
    this.selectionIdBuilder = this.host.createSelectionIdBuilder();
    this.selectionManager = this.host.createSelectionManager();
    this.highlighted = false;
  }

  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    //Push custom attributes to property pane, as well as dynamic names.
    let objectName = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];
    let dataPoints = this.viewModel.dataPoints.concat()

    switch (objectName) {
      case 'annotationSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            overlapStyle: this.viewModel.settings.annotationSettings.overlapStyle,
            labelInfo: this.viewModel.settings.annotationSettings.labelInfo,
            barHeight: this.viewModel.settings.annotationSettings.barHeight,
            sameAsBarColor: this.viewModel.settings.annotationSettings.sameAsBarColor,
            displayUnits: this.viewModel.settings.annotationSettings.displayUnits,
            precision: this.viewModel.settings.annotationSettings.precision,
            stagger: this.viewModel.settings.annotationSettings.stagger,
          },
          selector: null
        });
        // if (this.viewModel.settings.annotationSettings.stagger) {
        //   objectEnumeration.push({
        //     objectName: objectName,
        //     properties: {
        //       spacing: this.viewModel.settings.annotationSettings.spacing,
        //     },
        //     selector: null
        //   });
        // }

        if (this.viewModel.settings.annotationSettings.labelInfo === 'Auto') {

          objectEnumeration.push({
            objectName: objectName,
            properties: {
              separator: this.viewModel.settings.annotationSettings.separator,
            },
            selector: null
          });
        }



        break
      case 'textFormatting':

        objectEnumeration.push({
          objectName: objectName,
          properties: {
            allTextTop: this.viewModel.settings.textFormatting.allTextTop,
          },
          selector: null
        })



        // if (this.viewModel.settings.textFormatting.globalFormatting) {
        if (!this.viewModel.settings.annotationSettings.sameAsBarColor) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              fill: {
                solid: {
                  color: this.viewModel.settings.textFormatting.fill
                }
              }
            },
            selector: null
          })
        }
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            labelOrientation: this.viewModel.settings.textFormatting.labelOrientation,
            annotationStyle: this.viewModel.settings.textFormatting.annotationStyle,
            FontFamily: this.viewModel.settings.textFormatting.FontFamily,
            fontSize: this.viewModel.settings.textFormatting.fontSize
          },
          selector: null
        })

        // }


        for (let barDataPoint of dataPoints.sort((a, b) => (a.value > b.value) ? 1 : -1)) {
          objectEnumeration.push({
            objectName: objectName,
            displayName: barDataPoint.displayName + " custom format",
            properties: {
              customFormat: barDataPoint.customFormat
            },
            selector: barDataPoint.selectionId.getSelector()
          });

          if (barDataPoint.customFormat) {

            if (!this.viewModel.settings.annotationSettings.sameAsBarColor) {

              // if (!this.viewModel.settings.textFormatting.globalFormatting) {

              objectEnumeration.push({
                objectName: objectName,
                displayName: barDataPoint.displayName + " Color",
                properties: {
                  fill: {
                    solid: {
                      color: barDataPoint.LabelColor
                    }
                  }
                },
                selector: barDataPoint.selectionId.getSelector()
              });
            }


            objectEnumeration.push({
              objectName: objectName,
              displayName: barDataPoint.displayName + " text position",
              properties: {
                top: barDataPoint.top
              },
              selector: barDataPoint.selectionId.getSelector()
            });

            // }


            // if (!this.viewModel.settings.textFormatting.globalFormatting) {
            //Same Naming:  
            objectEnumeration.push({
              objectName: barDataPoint.displayName,
              displayName: barDataPoint.displayName,
              properties: {
                FontFamily: barDataPoint.FontFamily,
                fontSize: barDataPoint.fontSize
              },
              selector: barDataPoint.selectionId.getSelector()
            });

            objectEnumeration.push({
              objectName: objectName,
              displayName: barDataPoint.displayName + " Label orientation",
              properties: {
                labelOrientation: barDataPoint.labelOrientation
              },
              selector: barDataPoint.selectionId.getSelector()
            });



          }
        }



        break;
      case 'axisSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            axis: this.viewModel.settings.axisSettings.axis,
            axisColor: this.viewModel.settings.axisSettings.axisColor
          },
          selector: null
        });

        if (this.viewModel.settings.axisSettings.axis !== "None") {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              fontSize: this.viewModel.settings.axisSettings.fontSize,
              fontFamily: this.viewModel.settings.axisSettings.fontFamily,
              bold: this.viewModel.settings.axisSettings.bold
            },
            selector: null
          });
        }

        objectEnumeration.push({
          objectName: objectName,
          properties: {
            manualScale: this.viewModel.settings.axisSettings.manualScale,
          },
          selector: null
        });


        if (this.viewModel.settings.axisSettings.manualScale) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              barMin: this.viewModel.settings.axisSettings.barMin,
              barMax: this.viewModel.settings.axisSettings.barMax,
            },
            selector: null
          });

        }


        break
      case 'barColorSelector':
        for (let barDataPoint of dataPoints.sort((a, b) => (a.value > b.value) ? 1 : -1)) {
          objectEnumeration.push({
            objectName: objectName,
            displayName: "Display " + barDataPoint.displayName + " in bar",
            properties: {
              ShowInBar: barDataPoint.ShowInBar
            },
            selector: barDataPoint.selectionId.getSelector()
          });

          if (barDataPoint.ShowInBar) {
            objectEnumeration.push({
              objectName: objectName,
              displayName: barDataPoint.displayName,
              properties: {
                fill: {
                  solid: {
                    color: barDataPoint.barColor
                  }
                }
              },
              selector: barDataPoint.selectionId.getSelector()
            });
          }
        }
        break;

    };


    return objectEnumeration;
  }



  public update(options) {
    this.viewModel = visualTransform(options, this.host);


    let categorical = options.dataViews[0].categorical;
    if (categorical.categories && categorical.values[0].highlights) {
      this.highlighted = true
    } else {
      this.highlighted = false
    }



    let marginTop = 10,
      marginTopStagger = 20
    let graphElements = []

    this.viewModel.dataPoints.sort((a, b) => (a.value > b.value) ? 1 : -1).forEach((element, i) => {


      // this.viewModel.dataPoints.forEach((element, i) => {
      let graphElement = {}
      let barValue = 0
      let value = element.value
      let stackedBarX
      if (this.viewModel.settings.annotationSettings.overlapStyle === 'stacked') {

        for (let j = i; j >= 0; j--) {
          const previousElement = this.viewModel.dataPoints[j];
          if (element.value >= 0 && previousElement.value >= 0) {
            barValue += previousElement.value
          } else if (element.value < 0 && previousElement.value < 0) {
            barValue += previousElement.value
          }
        }
        stackedBarX = value > 0 ? barValue - value : barValue

        graphElement["x"] = barValue - (value / 2)
      }

      barValue = !barValue ? element.value : barValue

      let elementTop = element.top === "top" ? true : false;

      let displayName = element.displayName
      let annotationColor = !element.customFormat ? this.viewModel.settings.textFormatting.fill : element.LabelColor
      let annotationSize = !element.customFormat ? this.viewModel.settings.textFormatting.fontSize : element.fontSize
      let annotationFont = !element.customFormat ? this.viewModel.settings.textFormatting.FontFamily : element.FontFamily
      let labelOrientation = !element.customFormat ? this.viewModel.settings.textFormatting.labelOrientation : element.labelOrientation

      graphElement["Category"] = displayName;
      graphElement["Value"] = element.value;
      graphElement["Color"] = element.barColor
      graphElement["ShowInBar"] = element.ShowInBar
      graphElement["AnnotationColor"] = this.viewModel.settings.annotationSettings.sameAsBarColor && element.ShowInBar ? element.barColor : annotationColor;
      graphElement["Top"] = !element.customFormat ? this.viewModel.settings.textFormatting.allTextTop : elementTop;
      graphElement["Display"] = element.transformed
      graphElement["selectionId"] = element.selectionId
      graphElement["AnnotationSize"] = annotationSize;
      graphElement["AnnotationFont"] = annotationFont;
      if (this.viewModel.settings.annotationSettings.labelInfo === 'Auto') {
        graphElement["annotationText"] = graphElement["Category"] + this.viewModel.settings.annotationSettings.separator + " " + graphElement["Display"]
      } else {
        graphElement["annotationText"] = graphElement[this.viewModel.settings.annotationSettings.labelInfo]
      }
      graphElement["textWidth"] = this.getTextWidth(graphElement["annotationText"], annotationSize, annotationFont)
      graphElement["labelOrientation"] = labelOrientation
      graphElement["customFormat"] = element.customFormat
      graphElement["dx"] = 0
      graphElement["highlight"] = element.highlight
      graphElement["stackedBarX"] = stackedBarX

      graphElements.push(graphElement)
      let textHeight = this.getTextHeight(graphElement["annotationText"], annotationSize, annotationFont)

      if (this.viewModel.settings.annotationSettings.spacing < textHeight) {
        this.viewModel.settings.annotationSettings.spacing = textHeight

        if (graphElement["Top"]) {
          marginTopStagger += textHeight

        }
      }




      if (graphElement["Top"]) {
        marginTop = Math.max(marginTop, textHeight + 30)
        // marginTopStagger += 10
        // marginTopStagger += (this.viewModel.settings.annotationSettings.spacing)
      }
    });

    if (this.viewModel.settings.textFormatting.annotationStyle === 'annotationCallout' || this.viewModel.settings.textFormatting.annotationStyle === 'annotationCalloutCurve') {
      this.viewModel.settings.annotationSettings.spacing += 10
    }
    // if (this.viewModel.settings.annotationSettings.overlapStyle !== "edge") {
    // marginTopStagger += 20
    // }

    // marginTopStagger = marginTopStagger + (graphElements.filter(el => el.top).length * this.viewModel.settings.annotationSettings.spacing)

    let conditionalMinimum, conditionalMax
    if (this.viewModel.settings.annotationSettings.overlapStyle === 'stacked') {
      conditionalMinimum = graphElements.filter(el => el.Value < 0).reduce(function (a, b) {
        return a + b.Value;
      }, 0);

      conditionalMax = graphElements.filter(el => el.Value >= 0).reduce(function (a, b) {
        return a + b.Value;
      }, 0);

    } else {
      conditionalMinimum = d3.min(graphElements, function (d) { return d.Value }) > 0 ? 0 : d3.min(graphElements, function (d) { return d.Value })
      conditionalMax = d3.max(graphElements, function (d) { return d.Value })
    }
    //handles auto and manual scale
    if (!this.viewModel.settings.axisSettings.manualScale) {
      this.minScale = conditionalMinimum
      this.maxScale = conditionalMax
      this.viewModel.settings.axisSettings.barMin = false;
      this.viewModel.settings.axisSettings.barMax = false;

    } else {
      // this.minScale = this.viewModel.settings.axisSettings.barMin === false ? d3.min(graphElements, function (d) { return d.Value }) : d3.min(graphElements, function (d) { return d.Value }) < this.viewModel.settings.axisSettings.barMin ? d3.min(graphElements, function (d) { return d.Value }) : this.viewModel.settings.axisSettings.barMin;
      this.maxScale = this.viewModel.settings.axisSettings.barMax === false ? conditionalMax : this.viewModel.settings.axisSettings.barMax;

      this.minScale = this.viewModel.settings.axisSettings.barMin === false ? conditionalMinimum : this.viewModel.settings.axisSettings.barMin;

    }

    let format: string = options.dataViews[0].categorical.values[0].source.format;

    let valueFormatter = createFormatter(format, this.viewModel.settings.annotationSettings.precision, this.viewModel.settings.annotationSettings.displayUnits);

    if (this.viewModel.settings.axisSettings.axis === "Values") {
      let dynamicPadding = Math.max(this.getTextWidth(valueFormatter.format(this.minScale), this.viewModel.settings.axisSettings.fontSize, this.viewModel.settings.axisSettings.fontFamily), this.getTextWidth(valueFormatter.format(this.maxScale), this.viewModel.settings.axisSettings.fontSize, this.viewModel.settings.axisSettings.fontFamily)) / 2
      this.padding = dynamicPadding
    }

    graphElements = graphElements.filter(element => {
      if (this.viewModel.settings.annotationSettings.overlapStyle !== "stacked") {
        return element.Value >= this.minScale && element.Value <= this.maxScale
      } else {
        let value = element.Value > 0 ? element.Value + element.stackedBarX : element.Value
        return value >= this.minScale && value <= this.maxScale
      }
    })

    marginTopStagger += (graphElements.filter(element => element.Top).length * this.viewModel.settings.annotationSettings.spacing)

    this.width = options.viewport.width;
    this.height = options.viewport.height;

    if (this.viewModel.settings.annotationSettings.overlapStyle !== "edge") {

      graphElements = graphElements.sort((x, y) => { return y.Value - x.Value })
    }


    //sets an empty canva
    this.svgGroupMain.selectAll("g").remove();

    this.svgGroupMain.selectAll("rect").remove();

    let scale = d3.scaleLinear()
      .domain([this.minScale !== false ? this.minScale : d3.min(graphElements, function (d) { return d.Value }), this.maxScale !== false ? this.maxScale : d3.max(graphElements, function (d) { return d.Value; })]) //min and max data from input
      .range([0, this.width - (this.padding * 2)]); //min and max width in px           

    // set height and width of root SVG element using viewport passed by Power BI host
    this.svg.attr("height", this.height)
      .attr("width", this.width)
      .attr("stroke", 'gray');


    //axis settings

    let x_axis
    if (this.viewModel.settings.axisSettings.axis === "Percentage") {
      x_axis = d3.axisBottom(d3.scaleLinear()
        .domain([0, 100]) //percentage axis
        .range([0, this.width - (this.padding * 2)]))
        .tickFormat(d => d + "%")
    } else {
      x_axis = d3.axisBottom(scale)
        .tickFormat(d => valueFormatter.format(d))
    }

    //Append group and insert axis
    this.svgGroupMain.append("g")
      .attr("transform", "translate(" + this.padding + "," + ((this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop) + this.viewModel.settings.annotationSettings.barHeight) + ")")
      .call(x_axis)
      .attr('class', 'axis')
      .attr('style', `color :${this.viewModel.settings.axisSettings.axisColor.solid.color}`)
      .attr('style', `stroke :${this.viewModel.settings.axisSettings.axisColor.solid.color}`)

    this.svgGroupMain.selectAll('path, line')
      .attr('style', `color :${this.viewModel.settings.axisSettings.axisColor.solid.color}`)

    if (this.viewModel.settings.axisSettings.bold) {
      this.svgGroupMain.classed("xAxis", false);
    } else {
      this.svgGroupMain.attr('class', 'xAxis')

    }
    if (this.viewModel.settings.axisSettings.axis === "None") {
      this.svgGroupMain.selectAll("text").remove()
    } else {
      this.svgGroupMain.selectAll("text").style('font-size', this.viewModel.settings.axisSettings.fontSize)
      this.svgGroupMain.selectAll("text").style('fill', this.viewModel.settings.axisSettings.axisColor.solid.color)
      this.svgGroupMain.selectAll("text").style('font-family', this.viewModel.settings.axisSettings.fontFamily)

    }
    //bar settings

    //bar settings
    let barY, thisBarHeight,
      barElements = graphElements.concat().filter(element => element.ShowInBar === true),
      firstBarY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop,
      bar


    switch (this.viewModel.settings.annotationSettings.overlapStyle) {
      case "full":
        barElements = barElements.filter(el => el.Value < 0).sort((a, b) => (a.Value > b.Value) ? 1 : -1).concat(barElements.filter(el => el.Value >= 0))
        barY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop
        thisBarHeight = this.viewModel.settings.annotationSettings.barHeight

        bar = this.svgGroupMain.selectAll('rect')
          .data(barElements)

        bar.enter()
          .append('rect')
          .merge(bar)
          // .attr('class', 'bar')
          .attr('width', d => {
            // let min = Math.max(this.minScale, 0)
            let min = 0
            return Math.abs(scale(d.Value) - scale(min))
          })
          .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
          .attr('x', d => {

            // let min = Math.max(this.minScale, 0)

            let min = 0
            return this.padding + scale(Math.min(d.Value, min))
            // return scale(20000)
          })
          .attr('fill', function (d) {
            return d.Color
          })
          .attr('fill-opacity', (d) => {
            if (this.highlighted) {
              return d.highlight ? 1 : 0.4
            } else {
              return 1
            }
          })
          .attr('y', barY)
          .attr('height', thisBarHeight)

        bar.exit().remove()
        break
      case "stacked":
        barY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop
        thisBarHeight = this.viewModel.settings.annotationSettings.barHeight

        //sort negative values for correct overlay
        // barElements = barElements.filter(el => el.Value < 0).sort((a, b) => (a.Value > b.Value) ? 1 : -1).concat(barElements.filter(el => el.Value >= 0))


        bar = this.svgGroupMain.selectAll('rect')
          .data(barElements)

        bar.enter()
          .append('rect')
          .merge(bar)
          // .attr('class', 'bar')
          .attr('width', d => {
            let min = Math.max(this.minScale, 0)
            return Math.abs(scale(d.Value) - scale(min))
            // return Math.abs(scale(d.Value))
          })
          .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
          .attr('x', d => {
            let min = Math.max(this.minScale, 0)
            // return this.padding + scale(Math.min(d.Value, min))
            return this.padding + scale(d.stackedBarX)
          })
          .attr('fill', function (d, i) {

            return d.Color
          })
          .attr('fill-opacity', (d) => {
            if (this.highlighted) {
              return d.highlight ? 1 : 0.4
            } else {
              return 1
            }
          })
          .attr('y', barY)
          .attr('height', thisBarHeight)
        bar.exit().remove()
        break
      case "edge":
        // barElements = barElements.reverse()
        thisBarHeight = this.viewModel.settings.annotationSettings.barHeight / barElements.length
        // let countBottomBar = 0;
        // let countTopBar = barElements.filter(el => el.Top).length;
        let countBottomBar = 1;
        let countTopBar = 1;
        barY = (d, i) => {
          return firstBarY + thisBarHeight * i
        }

        bar = this.svgGroupMain.selectAll('rect')
          .data(barElements)

        bar.enter()
          .append('rect')
          .merge(bar)
          // .attr('class', 'bar')
          .attr('width', d => {
            let min = Math.max(this.minScale, 0)
            return Math.abs(scale(d.Value) - scale(min))
          })
          .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
          .attr('x', d => {

            let min = Math.max(this.minScale, 0)
            return this.padding + scale(Math.min(d.Value, min))
            // return this.padding + scale(Math.min(d.Value, 0))
            // return scale(20000)
          })
          .attr('fill', function (d, i) {

            return d.Color
          })
          .attr('fill-opacity', (d) => {
            if (this.highlighted) {
              return d.highlight ? 1 : 0.4
            } else {
              return 1
            }
          })
          .attr('y', barY)
          .attr('height', thisBarHeight)

        bar.exit().remove()
        break
      case "inside":
        let bars = {}

        const MINIMUM_BAR_HEIGHT = 4
        let amount = barElements.length,
          smallestBar = Math.max(this.viewModel.settings.annotationSettings.barHeight / amount, MINIMUM_BAR_HEIGHT),
          interval = (this.viewModel.settings.annotationSettings.barHeight - smallestBar) / (amount - 1),
          totalSpace = this.viewModel.settings.annotationSettings.barHeight

        barElements.forEach((barElement, i) => {

          if (i === 0) {
            //if first bar, total height
            thisBarHeight = this.viewModel.settings.annotationSettings.barHeight
          } else if (i === amount - 1) {
            //if last bar, smallest bar
            thisBarHeight = smallestBar
          } else {
            totalSpace = totalSpace - interval
            thisBarHeight = totalSpace
          }

          let finalY = (this.viewModel.settings.annotationSettings.barHeight - thisBarHeight) / 2

          barY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger + finalY : marginTop + finalY

          bars[i] = this.svgGroupMain.selectAll(`.bar${i}`)
            .data([barElement])

          bars[i].enter()
            .append('rect')
            .merge(bars[i])
            .attr('class', `.bar${i}`)
            .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
            // .attr('width', function (d) {
            //   return scale(d.Value);
            // })

            .attr('x', d => {
              let min = Math.max(this.minScale, 0)
              return this.padding + scale(Math.min(d.Value, min))
              // return scale(20000)
            })
            .attr('width', d => {
              let min = Math.max(this.minScale, 0)
              return Math.abs(scale(d.Value) - scale(min))
            })
            // .attr('class', `selector_${bars[i].Category}`)

            // .attr('x', this.padding)
            .attr('fill', function (d, i) {

              return d.Color
            })
            .attr('fill-opacity', (d) => {
              if (this.highlighted) {
                return d.highlight ? 1 : 0.4
              } else {
                return 1
              }
            })
            .attr('y', barY)
            .attr('height', thisBarHeight)

          bars[i].exit().remove()

        })
        break
    }
    //Annotation details
    let annotationsData, makeAnnotations;

    //keeps track of count for stagger positioning
    let countBottom = graphElements.filter(el => !el.Top).length;
    let countTop = graphElements.filter(el => el.Top).length;

    const style = this.viewModel.settings.textFormatting.annotationStyle !== "textOnly" ? svgAnnotations[this.viewModel.settings.textFormatting.annotationStyle] : svgAnnotations['annotationLabel']
    let alignment = {
      "className": "custom",
      "note": { "align": "dynamic" }
    }
    const type = new svgAnnotations.annotationCustomType(
      style,
      alignment
    )

    let annotationElements
    if (this.viewModel.settings.annotationSettings.overlapStyle === "stacked") {
      // annotationElements = graphElements.concat()
      // .sort((a, b) => (a.value > b.value) ? 1 : -1)
      let positive = graphElements.filter(el => el.Value >= 0)
      let negative = graphElements.filter(el => el.Value < 0)
      negative.sort((a, b) => a.Value > b.Value ? 1 : -1)
      annotationElements = positive.concat(negative)
    } else if (this.viewModel.settings.annotationSettings.overlapStyle === "edge") {
      annotationElements = graphElements.concat().reverse()

    } else {
      annotationElements = graphElements.concat()
    }

    // handle annotations positioning
    annotationElements.forEach((element, i) => {
      // element.x = this.padding + scale(element.Value);
      element.x = !element.x ? this.padding + scale(element.Value) : this.padding + scale(element.x)

      if (element.labelOrientation !== "Auto") {
        alignment.note.align = element.labelOrientation
      } else {
        alignment.note.align = this.getAnnotationOrientation(element)
      }
      if (!this.viewModel.settings.annotationSettings.stagger) {


        if (this.viewModel.settings.annotationSettings.overlapStyle === 'edge' && element.Top) {
          if (element.ShowInBar) {

            let index = barElements.indexOf(element)

            element.y = marginTop + thisBarHeight * index
            element.dy = - (thisBarHeight * (index)) - 20
          }
          else {
            element.y = marginTop + this.viewModel.settings.annotationSettings.barHeight
            element.dy = -20 - this.viewModel.settings.annotationSettings.barHeight
          }
        }


        if (!element.dy) {
          element.dy = element.Top ? -20 : this.viewModel.settings.axisSettings.axis === "None" ? 20 : 40;

        }
        if (!element.y) {
          element.y = element.Top ? marginTop : marginTop + this.viewModel.settings.annotationSettings.barHeight;
        }
        // }
      }

      else {
        if (this.viewModel.settings.annotationSettings.overlapStyle === 'edge' && element.Top) {
          if (element.ShowInBar) {

            let index = barElements.indexOf(element)

            element.y = marginTopStagger + thisBarHeight * index
            element.dy = - (thisBarHeight * (index))
            element.dy += this.viewModel.settings.annotationSettings.spacing * (-1 * countTop)
          }
          else {
            element.y = marginTopStagger + this.viewModel.settings.annotationSettings.barHeight
            element.dy = this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) - this.viewModel.settings.annotationSettings.barHeight
          }
        }


        if (!element.y) {
          element.y = element.Top ? marginTopStagger : marginTopStagger + this.viewModel.settings.annotationSettings.barHeight;

        }
        if (!element.dy) {
          element.dy = element.Top ? this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) : this.viewModel.settings.axisSettings.axis === "None" ? this.viewModel.settings.annotationSettings.spacing * countBottom : this.viewModel.settings.annotationSettings.spacing * countBottom + 20;
        }
      }


      annotationsData = [{
        note: {
          wrap: 900,
          label: element.annotationText,
          bgPadding: 10
        },
        x: element.x,
        y: element.y,
        dy: element.dy,
        dx: element.dx,
        color: element["AnnotationColor"],
        id: element.selectionId
      }]

      makeAnnotations = svgAnnotations.annotation()
        .annotations(annotationsData)
        .type(type)

      if (this.viewModel.settings.textFormatting.annotationStyle === 'textOnly') {
        makeAnnotations
          .disable(["connector"])

      }




      this.svgGroupMain
        .append("g")
        .attr('class', 'annotations')
        .style('font-size', element.AnnotationSize)
        .style('font-family', element.AnnotationFont)
        .style('background-color', 'transparent')
        .call(makeAnnotations)
        .on('click', el => {
          selectionManager.select(element.selectionId).then((ids: ISelectionId[]) => {

            if (ids.length > 0) {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 0.4)
              d3.select(`.selector_${element.Category.replace(/\W/g, '')}`).style('fill-opacity', 1)

            } else {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 1)

            }

          })
        })

      if (element.Top) {
        countTop--;
      } else {
        countBottom--;
      }

      let selectionManager = this.selectionManager;

      // handle context menu - right click
      this.svgGroupMain.on('contextmenu', () => {
        const mouseEvent: MouseEvent = d3.event as MouseEvent;
        const eventTarget: EventTarget = mouseEvent.target;
        let dataPoint: any = d3.select(<Element>eventTarget).datum();
        selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {}, {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        });
        mouseEvent.preventDefault();
      });

      //handle filter and transparency
      this.svg.on('click', () => {
        const mouseEvent: MouseEvent = d3.event as MouseEvent;
        const eventTarget: EventTarget = mouseEvent.target;
        let dataPoint: any = d3.select(<Element>eventTarget).datum();

        if (dataPoint) {
          selectionManager.select(dataPoint.selectionId).then((ids: ISelectionId[]) => {
            if (ids.length > 0) {

              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 0.4)
              d3.select(<Element>eventTarget).style('fill-opacity', 1)
            } else {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 1)

            }
          })
        } else {
          selectionManager.clear().then(() => {

            this.svgGroupMain.selectAll('.bar').style('fill-opacity', 1)
          })
        }

      });
    })

  }

  private getTextWidth(textString: string, fontSize: number, fontFamily: string) {
    let textData = [textString]

    let textWidth

    //Measure text's width for correct positioning of annotation
    this.svg.append('g')
      .selectAll('.dummyText')
      .data(textData)
      .enter()
      .append("text")
      .attr("font-family", fontFamily)
      .attr("font-size", fontSize)
      .text(function (d) { return d })
      .each(function (d, i) {
        let thisWidth = this.getComputedTextLength()
        textWidth = thisWidth
        this.remove() // remove them just after displaying them
      })

    return textWidth
  }

  private getTextHeight(textString: string, fontSize: number, fontFamily: string) {
    let textData = [textString]

    let textHeight

    //Measure text's width for correct positioning of annotation
    this.svg.append('g')
      .selectAll('.dummyText')
      .data(textData)
      .enter()
      .append("text")
      .attr("font-family", fontFamily)
      .attr("font-size", fontSize)
      .text(function (d) { return d })
      .each(function (d, i) {
        let thisHeight = this.getBBox().height
        textHeight = thisHeight
        this.remove() // remove them just after displaying them
      })

    return textHeight
  }
  private getAnnotationOrientation(element) {
    if (element.textWidth + element.x > this.width - this.padding * 2) {
      return "right"
    } else {
      return "left"
    }

  }


}
