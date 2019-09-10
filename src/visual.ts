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
import DataView = powerbi.DataView;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import PrimitiveValue = powerbi.PrimitiveValue;
import Fill = powerbi.Fill;
import * as d3 from "d3";
import * as svgAnnotations from "d3-svg-annotation";
import IColorPalette = powerbi.extensibility.IColorPalette;

import {
  valueFormatter as vf,
} from "powerbi-visuals-utils-formattingutils";

import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
import DataViewObjects = powerbi.DataViewObject;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import { VisualSettings, dataPointSettings, AxisSettings, BarSettings } from "./settings";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

//Global settings to the visual
interface AnnotatedBarSettings {
  annotationSettings: {
    annotationStyle: string,
    stagger: boolean,
    spacing: any,
    editMode: boolean,
    separator: string
  },
  axisSettings: {
    axis: any,
    axisColor: any,
    fontSize: number,
    fontFamily: string
  },
  barSettings: {
    barHeight: number,
    manualScale: boolean,
    barMin: any,
    barMax: any
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
  top: boolean
};

interface AnnotatedBarViewModel {
  dataPoints: AnnotatedBarDataPoint[];
  settings: AnnotatedBarSettings
};

function visualTransform(options: VisualUpdateOptions, host: IVisualHost): AnnotatedBarViewModel {
  let dataViews = options.dataViews;

  let defaultSettings: AnnotatedBarSettings = {
    annotationSettings: {
      annotationStyle: "annotationLabel",
      stagger: false,
      spacing: 20,
      editMode: false,
      separator: ": "
    },
    axisSettings: {
      axis: "None",
      axisColor: { solid: { color: 'gray' } },
      fontSize: 12,
      fontFamily: 'Arial'
    },
    barSettings: {
      barHeight: 30,
      manualScale: false,
      barMin: false,
      barMax: false
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

  let annotatedBarDataPoints: AnnotatedBarDataPoint[] = [];

  //QueryOn colors to be set as default
  let customColors = ["rgb(186,215,57)", "rgb(0, 188, 178)", "rgb(121, 118, 118)", "rgb(248, 250, 239)", "rgb(105,161,151)", "rgb(78,205,196)"]

  for (let i = 0, len = dataValues.length; i < len; i++) {

    let defaultBarColor: Fill = {
      solid: {
        color: customColors[i]
      }
    }

    //getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'dx', "TEST") will return TEST after drag and drop should have set correct coordinates.

    annotatedBarDataPoints.push({
      value: dataValues[i].values[0],
      displayName: dataValues[i].source.displayName,
      barColor: getCategoricalObjectValue<Fill>(categorical, i, 'barColorSelector', 'fill', defaultBarColor).solid.color,
      LabelColor: getCategoricalObjectValue<Fill>(categorical, i, 'textFormatting', 'fill', { solid: { color: "gray" } }).solid.color,
      FontFamily: getCategoricalObjectValue<string>(categorical, i, 'textFormatting', 'FontFamily', "Arial"),
      fontSize: getCategoricalObjectValue<number>(categorical, i, 'textFormatting', 'fontSize', 12),
      ShowInBar: getCategoricalObjectValue<boolean>(categorical, i, 'barColorSelector', 'ShowInBar', true),
      dx: getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'dx', false),
      dy: getCategoricalObjectValue<any>(categorical, i, 'manualPosition', 'dy', false),
      top: getCategoricalObjectValue<boolean>(categorical, i, 'textFormatting', 'top', false),
      selectionId: host.createSelectionIdBuilder()     //generates IDs for svg elements based on queryName
        .withMeasure(dataValues[i].source.queryName)
        .createSelectionId()
    });
  }

  let annotatedBarSettings: AnnotatedBarSettings = {
    annotationSettings: {
      stagger: getValue<boolean>(objects, 'annotationSettings', 'stagger', defaultSettings.annotationSettings.stagger),
      separator: getValue<string>(objects, 'annotationSettings', 'separator', defaultSettings.annotationSettings.separator),
      editMode: getValue<boolean>(objects, 'annotationSettings', 'editMode', defaultSettings.annotationSettings.editMode),
      spacing: getValue<any>(objects, 'annotationSettings', 'spacing', defaultSettings.annotationSettings.spacing),
      annotationStyle: getValue<string>(objects, 'annotationSettings', 'annotationStyle', defaultSettings.annotationSettings.annotationStyle),
    },
    axisSettings: {
      axis: getValue<any>(objects, 'axisSettings', 'axis', defaultSettings.axisSettings.axis),
      axisColor: getValue<string>(objects, 'axisSettings', 'axisColor', defaultSettings.axisSettings.axisColor),
      fontSize: getValue<number>(objects, 'axisSettings', 'fontSize', defaultSettings.axisSettings.fontSize),
      fontFamily: getValue<string>(objects, 'axisSettings', 'fontFamily', defaultSettings.axisSettings.fontFamily)
    }, barSettings: {
      barHeight: getValue<number>(objects, 'barSettings', 'barHeight', defaultSettings.barSettings.barHeight),
      manualScale: getValue<any>(objects, 'barSettings', 'manualScale', defaultSettings.barSettings.manualScale),
      barMin: getValue<any>(objects, 'barSettings', 'barMin', defaultSettings.barSettings.barMin),
      barMax: getValue<any>(objects, 'barSettings', 'barMax', defaultSettings.barSettings.barMax),
    }
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
  AnnotationColor: string;
  AnnotationFont: string;
  AnnotationSize: number;
  x: any;
  y: any;
  dx: any;
  dy: any;
  selectionId: ISelectionId;
}

//getCategoricalObjectValue takes in categorical: all datapoints objects, dataPoint's index, object name: properties' categories, property name and default value. 
export function getCategoricalObjectValue<T>(category: any, index: number, objectName: string, propertyName: string, defaultValue: T): T {

  let categoryObjects = category.values;

  if (categoryObjects) {
    let categoryObject = categoryObjects[index];

    if (categoryObject) {
      // if (objectName === "manualPosition") {
      //   console.log("getCategoricalObjectValue", propertyName, categoryObject.source)
      // }
      // Bug: `categoryObject.source` doesn't have `objects` attribute, with manual position object, containing properties dx and dy. 
      // Keep returning default value and reseting position after drag and drop 
      if (categoryObject.source.objects) {
        let object = categoryObject.source.objects[objectName];

        if (object) {

          let property = object[propertyName];

          if (property !== undefined) {
            return property;
          }
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
  private visualSettings: VisualSettings;
  private minScale: any;
  private maxScale: any;
  private host: IVisualHost;
  private selectionManager: ISelectionManager;
  private selectionIdBuilder: ISelectionIdBuilder;
  private annotatedBarSettings: AnnotatedBarSettings;
  private viewModel: AnnotatedBarViewModel;

  constructor(options: VisualConstructorOptions) {

    this.svg = d3.select(options.element).append('svg');
    this.svgGroupMain = this.svg.append('g');
    this.padding = 10;
    this.host = options.host
    this.selectionIdBuilder = this.host.createSelectionIdBuilder();
    this.selectionManager = this.host.createSelectionManager();

  }

  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    //Push custom attributes to property pane, as well as dynamic names.
    let objectName = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];


    switch (objectName) {
      case 'annotationSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            stagger: this.viewModel.settings.annotationSettings.stagger
          },
          selector: null
        });
        if (this.viewModel.settings.annotationSettings.stagger) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {
              spacing: this.viewModel.settings.annotationSettings.spacing,
            },
            selector: null
          });
        }

        objectEnumeration.push({
          objectName: objectName,
          properties: {
            separator: this.viewModel.settings.annotationSettings.separator,
            editMode: this.viewModel.settings.annotationSettings.editMode,
            annotationStyle: this.viewModel.settings.annotationSettings.annotationStyle
          },
          selector: null
        });

        break
      case 'textFormatting':
        for (let barDataPoint of this.viewModel.dataPoints) {


          //Same Naming:  
          objectEnumeration.push({
            objectName: barDataPoint.displayName,
            displayName: barDataPoint.displayName,
            properties: {
              FontFamily: barDataPoint.FontFamily,
              fontSize: barDataPoint.fontSize,
              fill: {
                solid: {
                  color: barDataPoint.LabelColor
                }
              }


            },
            selector: barDataPoint.selectionId.getSelector()
          });

          //diferent naming:
          objectEnumeration.push({
            objectName: objectName,
            displayName: barDataPoint.displayName + "'s text on top",
            properties: {
              top: barDataPoint.top
            },
            selector: barDataPoint.selectionId.getSelector()
          });
        }
        break;

      // Code works the same with or without manualPosition section. Ideally it will be hidden 
      // case "manualPosition":
      //   for (let barDataPoint of this.viewModel.dataPoints) {
      //     objectEnumeration.push({
      //       objectName: objectName,
      //       displayName: barDataPoint.displayName + " dx",
      //       properties: {
      //         dx: barDataPoint.dx
      //       },
      //       selector: barDataPoint.selectionId.getSelector()
      //     }, {
      //         objectName: objectName,
      //         displayName: barDataPoint.displayName + " dy",
      //         properties: {
      //           dy: barDataPoint.dy
      //         },
      //         selector: barDataPoint.selectionId.getSelector()
      //       });
      //   }
      //   break;
      case 'barSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            barHeight: this.viewModel.settings.barSettings.barHeight,
            manualScale: this.viewModel.settings.barSettings.manualScale
          },
          selector: null
        });

        if (this.viewModel.settings.barSettings.manualScale) {
          objectEnumeration.push({
            objectName: objectName,
            properties: {

              barMin: this.viewModel.settings.barSettings.barMin,
              barMax: this.viewModel.settings.barSettings.barMax,
            },
            selector: null
          });

        }
        break
      case 'axisSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            axis: this.viewModel.settings.axisSettings.axis,
            axisColor: this.viewModel.settings.axisSettings.axisColor,
            fontSize: this.viewModel.settings.axisSettings.fontSize,
            fontFamily: this.viewModel.settings.axisSettings.fontFamily
          },
          selector: null
        });
        break
      case 'barColorSelector':
        for (let barDataPoint of this.viewModel.dataPoints) {
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



  public update(options: VisualUpdateOptions) {
    this.viewModel = visualTransform(options, this.host);

    let graphElements = []


    // this.viewModel.settings.barSettings.barHeight = Math.max(5, this.viewModel.settings.barSettings.barHeight);
    // this.viewModel.settings.barSettings.barHeight = Math.min(200, this.viewModel.settings.barSettings.barHeight);

    //handles modeling tab with dynamic formatting
    var format: string = options.dataViews[0].categorical.values[0].source.format;
    var valueFormatterFactory = vf;
    var valueFormatter = valueFormatterFactory.create({
      format: format,
      formatSingleValues: true
    });

    this.viewModel.dataPoints.forEach((element, i) => {
      // console.log(element.dx, element.dy)
      // After coordinates are persisted element.dx and element.dy are still delayed - element comes from getCategoricalObjectValue function.
      let value = element.value
      let displayName = element.displayName
      let graphElement = {}
      graphElement["Category"] = displayName;
      graphElement["Value"] = value;
      graphElement["Color"] = element.ShowInBar ? element.barColor : "transparent"
      graphElement["AnnotationColor"] = element.LabelColor;
      graphElement["Top"] = element.top;
      graphElement["Display"] = valueFormatter.format(value)
      graphElement["selectionId"] = element.selectionId
      graphElement["AnnotationSize"] = element.fontSize;
      graphElement["AnnotationFont"] = element.FontFamily;
      graphElement["dx"] = element.dx;
      graphElement["dy"] = element.dy;
      graphElements.push(graphElement)
    });


    //handles auto and manual scale
    if (!this.viewModel.settings.barSettings.manualScale) {
      this.minScale = d3.min(graphElements, function (d) { return d.Value })
      this.maxScale = d3.max(graphElements, function (d) { return d.Value })
      this.viewModel.settings.barSettings.barMin = false;
      this.viewModel.settings.barSettings.barMax = false;

    } else {
      this.minScale = this.viewModel.settings.barSettings.barMin === false ? d3.min(graphElements, function (d) { return d.Value }) : this.viewModel.settings.barSettings.barMin;
      this.maxScale = this.viewModel.settings.barSettings.barMax === false ? d3.max(graphElements, function (d) { return d.Value }) : this.viewModel.settings.barSettings.barMax;
    }

    graphElements = graphElements.filter(element => {
      return element.Value >= this.minScale && element.Value <= this.maxScale
    })

    // this.renderVisual(options.viewport.width, options.viewport.height, graphElements.sort((x, y) => { return y.Value - x.Value }))

    let width = options.viewport.width,
      height = options.viewport.height;
    graphElements = graphElements.sort((x, y) => { return y.Value - x.Value })



    // }

    // public renderVisual(width: number, height: number, graphElements: graphElements[]) {

    //sets an empty canva
    this.svgGroupMain.selectAll("g").remove();

    let scale = d3.scaleLinear()
      .domain([this.minScale !== false ? this.minScale : d3.min(graphElements, function (d) { return d.Value }), this.maxScale !== false ? this.maxScale : d3.max(graphElements, function (d) { return d.Value; })]) //min and max data from input
      .range([0, width - (this.padding * 2)]); //min and max width in px           

    // set height and width of root SVG element using viewport passed by Power BI host
    this.svg.attr("height", height)
      .attr("width", width)
      .attr("stroke", 'gray');


    //bar settings
    let bar = this.svgGroupMain.selectAll('rect')
      .data(graphElements)

    bar.enter()
      .append('rect')
      .merge(bar)
      .attr('width', function (d) {
        return scale(d.Value);
      })

      .attr('x', this.padding)
      .attr('fill', function (d, i) {

        return d.Color
      })
      .attr('y', 100)
      .attr('height', this.viewModel.settings.barSettings.barHeight)

    bar.exit().remove()


    let x_axis
    if (this.viewModel.settings.axisSettings.axis === "Percentage") {
      x_axis = d3.axisBottom(d3.scaleLinear()
        .domain([0, 100]) //percentage axis
        .range([0, width - (this.padding * 2)]))
        .tickFormat(d => d + "%")
    } else {
      x_axis = d3.axisBottom(scale)
    }

    //Append group and insert axis
    this.svgGroupMain.append("g")
      .attr("transform", "translate(" + this.padding + "," + (100 + this.viewModel.settings.barSettings.barHeight) + ")")
      .call(x_axis)
      .attr('style', `color :${this.viewModel.settings.axisSettings.axisColor.solid.color}`)

    if (this.viewModel.settings.axisSettings.axis === "None") {
      this.svgGroupMain.selectAll("text").remove()
    } else {
      this.svgGroupMain.selectAll("text").style('font-size', this.viewModel.settings.axisSettings.fontSize)
      this.svgGroupMain.selectAll("text").style('stroke', this.viewModel.settings.axisSettings.axisColor.solid.color)
      this.svgGroupMain.selectAll("text").style('font-family', this.viewModel.settings.axisSettings.fontFamily)

    }

    //Annotation details
    let annotationsData, makeAnnotations;

    //keeps track of count for stagger positioning
    let countBottom = graphElements.filter(el => !el.Top).length;
    let countTop = graphElements.filter(el => el.Top).length;;

    const style = svgAnnotations[this.viewModel.settings.annotationSettings.annotationStyle]
    const type = new svgAnnotations.annotationCustomType(
      style,
      {
        "className": "custom",
        "note": { "align": "dynamic" }
      })


    // handle annotations positioning
    graphElements.forEach(element => {
      element.x = this.padding + scale(element.Value);

      element.y = element.Top ? 100 : 100 + this.viewModel.settings.barSettings.barHeight;
      if (!this.viewModel.settings.annotationSettings.stagger) {
        this.viewModel.settings.annotationSettings.spacing = false;

        if (this.viewModel.settings.annotationSettings.editMode) {
          element.dy = element.dy ? element.dy : element.Top ? -20 : 20;
          element.dx = element.dx ? element.dx : element.Value == d3.max(graphElements, function (d) { return d.Value; }) ? -0.1 : 0;
        }

        else {
          element.dx = false;
          element.dy = false;
          this.persistCoord(element) //resets coord to false so previous are deleted. Also being delayed but work fine because of if statements
          element.dy = element.Top ? -20 : 20;
          element.dx = element.Value == d3.max(graphElements, function (d) { return d.Value; }) ? -0.1 : 0;
        }
      }

      else {
        if (this.viewModel.settings.annotationSettings.editMode) {
          element.dy = element.dy ? element.dy : element.Top ? this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) : this.viewModel.settings.annotationSettings.spacing * countBottom;
          element.dx = element.dx ? element.dx : element.Value == d3.max(graphElements, function (d) { return d.Value; }) ? -0.1 : 0;
        }

        else {
          element.dx = false;
          element.dy = false;
          this.persistCoord(element)
          element.dy = element.Top ? this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) : this.viewModel.settings.annotationSettings.spacing * countBottom;
          element.dx = element.Value == d3.max(graphElements, function (d) { return d.Value; }) ? -0.1 : 0;
        }
      }

      annotationsData = [{
        note: {
          wrap: 900,
          label: element.Category + this.viewModel.settings.annotationSettings.separator + element.Display,
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


      if (this.viewModel.settings.annotationSettings.editMode) {
        makeAnnotations.editMode(true)
          .on('dragend', (el) => {
            this.persistCoord(el)
          })

      }


      //print annotations

      this.appendAnnotaions(makeAnnotations, element.AnnotationFont, element.AnnotationSize);

      if (element.Top) {
        countTop--;
      } else {
        countBottom--;
      }

      // handle context menu - right click
      this.svgGroupMain.on('contextmenu', () => {
        const mouseEvent: MouseEvent = d3.event as MouseEvent;
        const eventTarget: EventTarget = mouseEvent.target;
        let dataPoint: any = d3.select(<Element>eventTarget).datum();
        this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {}, {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        });
        mouseEvent.preventDefault();
      });

    })

  }

  private persistCoord(el) {

    const id = el.selectionId ? el.selectionId : el.id; //if SVG element, use selectionId, if annotation, use ID.
    console.log("dx", el.dx, "dy", el.dy)

    const propertiesToBePersisted: VisualObjectInstance = {
      objectName: "manualPosition",
      properties: {
        dx: el.dx,
        dy: el.dy
      },
      selector: id.getSelector() //selector is necessary for finding correct dataPoint
    };

    //test below works fine and no delay.
    // const propertiesToBePersistedTest: VisualObjectInstance = {
    //   objectName: "axisSettings",
    //   properties: {
    //     axis: "Percentage"
    //   },
    //   selector: null //global setting no selector
    // };


    this.host.persistProperties({
      merge: [
        propertiesToBePersisted
      ]
    });
  }

  private appendAnnotaions(makeAnnotations: svgAnnotations.default<unknown>, fontFamily: string, fontSize: number) {
    this.svgGroupMain
      .append("g")
      .attr('class', 'annotations')
      .style('font-size', fontSize)
      .style('font-family', fontFamily)
      .call(makeAnnotations)

  }

}
