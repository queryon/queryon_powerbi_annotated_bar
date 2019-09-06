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
  valueFormatter as vf, valueFormatter,
  // textMeasurementService as tms
} from "powerbi-visuals-utils-formattingutils";

import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
import DataViewObjects = powerbi.DataViewObject;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import { VisualSettings, dataPointSettings, AxisSettings, BarSettings } from "./settings";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { Stringifiable, mouse } from "d3";
import { dataViewObject } from "powerbi-visuals-utils-dataviewutils";


// module powerbi.extensibility.visual {
//   /**
//  * Interface for AnnotatedBars viewmodel.
//  *
//  * @interface
//  * @property {AnnotatedBarDataPoint[]} dataPoints - Set of data points the visual will render.
//  * @property {number} dataMax                 - Maximum data value in the set of data points.
//  */
//   interface AnnotatedBarViewModel {
//     dataPoints: AnnotatedBarDataPoint[];
//     dataMax: number;
//   };

/**
 * Interface for AnnotatedBar data points.
 *
 * @interface
 * @property {number} value    - Data value for point.
 */


/**
* Interface for AnnotatedBar settings.
*
* @interface
* @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
*/

/**
* @interface
* @property {AnnotatedBarDataPoint[]} dataPoints - Set of data points the visual will render.
* @property {number} dataMax                 - Maximum data value in the set of data points.
*/

interface AnnotatedBarSettings {
  annotationSettings: {
    annotationStyle: string,
    stagger: boolean,
    spacing: any,
    editMode: boolean,
    separator: string
  },
  axisSettings: {
    axis: boolean,
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

interface AnnotatedBarDataPoint {
  value: any;
  // category: any;
  display: string;
  displayName: string;
  barColor: string;
  selectionId: ISelectionId;
  LabelColor: string
  FontFamily: string
  fontSize: number
  ShowInBar: boolean
  dx: any
  dy: any
  show: boolean
  top: false

};

interface AnnotatedBarViewModel {
  dataPoints: AnnotatedBarDataPoint[];
  settings: AnnotatedBarSettings
  // dataMax: number;
};

/**
 * Function that converts queried data into a view model that will be used by the visual
 *
 * @function
 * @param {VisualUpdateOptions} options - Contains references to the size of the container
 *                                        and the dataView which contains all the data
 *                                        the visual had queried.
 * @param {IVisualHost} host            - Contains references to the host which contains services
 */
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
      axis: false,
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
    // dataMax: 0,
    settings: defaultSettings

  };


  let objects = dataViews[0].metadata.objects;




  if (!dataViews
    || !dataViews[0]
    || !dataViews[0].categorical
    // || !dataViews[0].categorical.categories
    // || !dataViews[0].categorical.categories[0].source
    || !dataViews[0].categorical.values) {
    return viewModel;
  }


  let categorical = dataViews[0].categorical;
  // let category = categorical.categories[0];
  let dataValue = categorical.values;
  var format: string = options.dataViews[0].categorical.values[0].source.format;

  var valueFormatterFactory = vf;
  var valueFormatter = valueFormatterFactory.create({
    format: format,
    formatSingleValues: true
  });

  let annotatedBarDataPoints: AnnotatedBarDataPoint[] = [];
  let dataMax: number;

  let colorPalette: IColorPalette = host.colorPalette; // host: IVisualHost

  let customColors = ["rgb(186,215,57)", "rgb(0, 188, 178)", "rgb(121, 118, 118)", "rgb(248, 250, 239)", "rgb(105,161,151)", "rgb(78,205,196)"]

  for (let i = 0, len = dataValue.length; i < len; i++) {
    let defaultBarColor: Fill = {
      solid: {
        color: customColors[i]
      }
    }
    annotatedBarDataPoints.push({
      // category: category,
      value: dataValue[i].values[0],
      display: valueFormatter.format(dataValue[i].values[0]),
      displayName: dataValue[i].source.displayName,
      barColor: getCategoricalObjectValue<Fill>(categorical, i, 'barColorSelector', 'fill', defaultBarColor).solid.color,
      LabelColor: getCategoricalObjectValue<Fill>(categorical, i, 'textFormatting', 'fill', { solid: { color: "gray" } }).solid.color,
      FontFamily: getCategoricalObjectValue<string>(categorical, i, 'textFormatting', 'FontFamily', "Arial"),
      fontSize: getCategoricalObjectValue<number>(categorical, i, 'textFormatting', 'fontSize', 12),
      ShowInBar: true,
      dx: false,
      dy: false,
      show: true,
      top: false,
      // barColor: !colorPalette.getColor(dataValue.values[i]).value ? customColors[i] : colorPalette.getColor(dataValue.values[i]).value,
      selectionId: host.createSelectionIdBuilder()
        //   .withCategory(category, i)
        .withMeasure(dataValue[i].source.queryName)
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
      axis: getValue<boolean>(objects, 'axisSettings', 'axis', defaultSettings.axisSettings.axis),
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

  // console.log(annotatedBarSettings)
  // dataMax = <number>dataValue.maxLocal;

  return {
    dataPoints: annotatedBarDataPoints,
    settings: annotatedBarSettings
    // dataMax: dataMax
  };
}

/**
 * Gets property value for a particular object.
 *
 * @function
 * @param {DataViewObjects} objects - Map of defined objects.
 * @param {string} objectName       - Name of desired object.
 * @param {string} propertyName     - Name of desired property.
 * @param {T} defaultValue          - Default value of desired property.
 */
export function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
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


export interface DataVars {
  Category: string;
  Value: number;
  Display: string;
  Color: string;
  Top: boolean;
  AnnotationColor: string;
  AnnotationFont: string;
  AnnotationSize: number;
  Role: string;
  x: any;
  y: any;
  dx: any;
  dy: any;
}

export function getCategoricalObjectValue<T>(category: any, index: number, objectName: string, propertyName: string, defaultValue: T): T {
  let categoryObjects = category.values;
  if (categoryObjects) {
    let categoryObject = categoryObjects[index];
    if (categoryObject) {
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
    // let objectName = options.objectName;
    // let objectEnumeration: VisualObjectInstance[] = [];
    let objectName = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];


    switch (objectName) {
      case 'annotationSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            stagger: this.viewModel.settings.annotationSettings.stagger,
            spacing: this.viewModel.settings.annotationSettings.spacing,
            separator: this.viewModel.settings.annotationSettings.separator,
            editMode: this.viewModel.settings.annotationSettings.editMode,
            annotationStyle: this.viewModel.settings.annotationSettings.annotationStyle
          },
          selector: null
        });
        break
      case 'textFormatting':
        for (let barDataPoint of this.viewModel.dataPoints) {

          //diferent naming:
          // objectEnumeration.push({
          //   objectName: objectName,
          //   displayName: barDataPoint.displayName + " Annotation Color",
          //   properties: {
          //     fill: {
          //       solid: {
          //         color: barDataPoint.LabelColor
          //       }
          //     }
          //   },
          //   selector: barDataPoint.selectionId.getSelector()
          // });

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


        }
      case 'barSettings':
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            barHeight: this.viewModel.settings.barSettings.barHeight,
            barMin: this.viewModel.settings.barSettings.barMin,
            barMax: this.viewModel.settings.barSettings.barMax,
            manualScale: this.viewModel.settings.barSettings.manualScale
          },
          selector: null
        });
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
        break;

    };


    return objectEnumeration;

    // const settings: VisualSettings = this.visualSettings ||
    //   VisualSettings.getDefault() as VisualSettings;


    // console.log(VisualSettings.enumerateObjectInstances(settings, options))
    // return VisualSettings.enumerateObjectInstances(settings, options);
  }



  public update(options: VisualUpdateOptions) {
    this.viewModel = visualTransform(options, this.host);

    let datavars = []

    this.visualSettings = VisualSettings.parse<VisualSettings>(options.dataViews[0]);
    this.visualSettings.barSettings.barHeight = Math.max(5, this.visualSettings.barSettings.barHeight);
    this.visualSettings.barSettings.barHeight = Math.min(200, this.visualSettings.barSettings.barHeight);


    let dataViews = options.dataViews //options: VisualUpdateOptions
    let categorical = dataViews[0].categorical;
    let dataValues = categorical.values;

    // for (let dataValue of dataValues) {
    //   let values = dataValue.values;
    //   for (let i = 0, len = dataValue.values.length; i < len; i++) {
    //     let selectionId = this.host.createSelectionIdBuilder()
    //       // .withCategory(categorical.categories[0], i)
    //       // .withMeasure(dataValue.source.queryName)
    //       .withSeries(categorical.values, categorical.values[i])
    //       .createSelectionId();
    //   }
    // }
    // let selectionManager = this.selectionManager;

    // this.svgGroupMain.on('click', function (d) {
    //   selectionManager.select(d.selectionId).then((ids: any) => {
    //     console.log(ids)
    //   })
    // })

    // var format: string = options.dataViews[0].categorical.values[0].source.format;


    // var valueFormatterFactory = vf;
    // var valueFormatter = valueFormatterFactory.create({
    //   format: format,
    //   formatSingleValues: true
    // });

    this.viewModel.dataPoints.forEach((element, i) => {
      let value = element.value
      let displayName = element.displayName
      // let roles = element.roles
      // for (var role in roles) {
      // this.visualSettings[role].fontSize = Math.max(10, this.visualSettings[role].fontSize)
      // this.visualSettings[role].fontSize = Math.min(25, this.visualSettings[role].fontSize)


      // if (this.visualSettings[role].ShowInBar) {
      //   if (this.visualSettings[role].BarColor === "transparent") {
      //     this.visualSettings[role].BarColor = colorPalette[i]
      //     const propertiesToBePersisted: VisualObjectInstance = {
      //       objectName: role,
      //       selector: undefined,
      //       properties: {
      //         BarColor: this.visualSettings[role].BarColor
      //       }
      //     };

      //     this.host.persistProperties({
      //       merge: [
      //         propertiesToBePersisted
      //       ]
      //     });

      //   }

      // } else {
      //   this.visualSettings[role].BarColor = "transparent";
      // }



      let graphElement = {}
      // graphElement["Role"] = role
      graphElement["Category"] = displayName;
      graphElement["Value"] = value;
      graphElement["Color"] = element.barColor
      graphElement["AnnotationColor"] = element.LabelColor;
      // graphElement["Top"] = role.includes("Top") ? true : false;
      graphElement["Display"] = element.display
      graphElement["selectionId"] = element.selectionId
      graphElement["AnnotationSize"] = element.fontSize;
      graphElement["AnnotationFont"] = element.FontFamily;

      datavars.push(graphElement)
      // }
    });

    if (!this.visualSettings.barSettings.manualScale) {
      this.minScale = d3.min(datavars, function (d) { return d.Value })
      this.maxScale = d3.max(datavars, function (d) { return d.Value })
      this.visualSettings.barSettings.barMin = false;
      this.visualSettings.barSettings.barMax = false;

    } else {
      this.minScale = this.visualSettings.barSettings.barMin === false ? d3.min(datavars, function (d) { return d.Value }) : this.visualSettings.barSettings.barMin;
      this.maxScale = this.visualSettings.barSettings.barMax === false ? d3.max(datavars, function (d) { return d.Value }) : this.visualSettings.barSettings.barMax;

    }

    datavars = datavars.filter(element => {
      return element.Value >= this.minScale && element.Value <= this.maxScale
    })

    this.renderVisual(options.viewport.width, options.viewport.height, datavars.sort((x, y) => { return y.Value - x.Value }))

    // this.selectionManager = this.host.createSelectionManager();



  }

  public renderVisual(width: number, height: number, datavars: DataVars[]) {

    this.svgGroupMain.selectAll("g").remove();

    let scale = d3.scaleLinear()
      .domain([this.minScale !== false ? this.minScale : d3.min(datavars, function (d) { return d.Value }), this.maxScale !== false ? this.maxScale : d3.max(datavars, function (d) { return d.Value; })]) //min and max data from input
      .range([0, width - (this.padding * 2)]); //min and max width in px           

    // set height and width of root SVG element using viewport passed by Power BI host
    this.svg.attr("height", height)
      .attr("width", width)
      .attr("stroke", 'gray');



    let bar = this.svgGroupMain.selectAll('rect')
      .data(datavars)

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
      .attr('height', this.visualSettings.barSettings.barHeight)

    bar.exit().remove()

    var x_axis = d3.axisBottom(scale)


    //Append group and insert axis
    this.svgGroupMain.append("g")
      .attr("transform", "translate(" + this.padding + "," + (100 + this.visualSettings.barSettings.barHeight) + ")")
      .call(x_axis)
      .attr('style', `color :${this.viewModel.settings.axisSettings.axisColor.solid.color}`)

    if (!this.viewModel.settings.axisSettings.axis) {
      this.svgGroupMain.selectAll("text").remove()
    } else {
      this.svgGroupMain.selectAll("text").style('font-size', this.viewModel.settings.axisSettings.fontSize)
      this.svgGroupMain.selectAll("text").style('stroke', this.viewModel.settings.axisSettings.axisColor.solid.color)
      this.svgGroupMain.selectAll("text").style('font-family', this.viewModel.settings.axisSettings.fontFamily)

    }

    //Annotation details
    let annotationsData, makeAnnotations;

    let countBottom = datavars.filter(el => !el.Top).length;
    let countTop = datavars.filter(el => el.Top).length;;

    const style = svgAnnotations[this.viewModel.settings.annotationSettings.annotationStyle]
    const type = new svgAnnotations.annotationCustomType(
      style,
      {
        "className": "custom",
        "note": { "align": "dynamic" }
      })


    // handle positioning
    datavars.forEach(element => {
      element.x = this.padding + scale(element.Value);

      element.y = element.Top ? 100 : 100 + this.visualSettings.barSettings.barHeight;
      if (!this.viewModel.settings.annotationSettings.stagger) {
        this.viewModel.settings.annotationSettings.spacing = false;

        if (this.viewModel.settings.annotationSettings.editMode) {
          element.dy = this.visualSettings[element.Role].dy ? this.visualSettings[element.Role].dy : element.Top ? -20 : 20;
          element.dx = this.visualSettings[element.Role].dx ? this.visualSettings[element.Role].dx : element.Value == d3.max(datavars, function (d) { return d.Value; }) ? -0.1 : 0;
        }

        else {
          this.updateCoord({ dx: false, dy: false }, element.Role)
          element.dy = element.Top ? -20 : 20;
          element.dx = element.Value == d3.max(datavars, function (d) { return d.Value; }) ? -0.1 : 0;
        }
      }

      else {
        if (this.viewModel.settings.annotationSettings.editMode) {
          element.dy = this.visualSettings[element.Role].dy ? this.visualSettings[element.Role].dy : element.Top ? this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) : this.viewModel.settings.annotationSettings.spacing * countBottom;
          element.dx = this.visualSettings[element.Role].dx ? this.visualSettings[element.Role].dx : element.Value == d3.max(datavars, function (d) { return d.Value; }) ? -0.1 : 0;
        }

        else {
          this.updateCoord({ dx: false, dy: false }, element.Role)
          element.dy = element.Top ? this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) : this.viewModel.settings.annotationSettings.spacing * countBottom;
          element.dx = element.Value == d3.max(datavars, function (d) { return d.Value; }) ? -0.1 : 0;
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

      }]

      makeAnnotations = svgAnnotations.annotation()
        .annotations(annotationsData)
        .type(type)


      if (this.viewModel.settings.annotationSettings.editMode) {
        makeAnnotations.editMode(true)
          .on('dragend', (el) => {
            this.updateCoord(el, element.Role)
          })

      }


      //print annotations

      this.appendAnnotaions(makeAnnotations, element.AnnotationFont, element.AnnotationSize);

      if (element.Top) {
        countTop--;
      } else {
        countBottom--;
      }

      // handle context menu
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

  private updateCoord(el, role) {
    // const propertiesToBePersisted: VisualObjectInstance = {
    //   objectName: role,
    //   selector: undefined,
    //   properties: {
    //     dx: el.dx,
    //     dy: el.dy
    //   }
    // };

    // this.host.persistProperties({
    //   merge: [
    //     propertiesToBePersisted
    //   ]
    // });

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
