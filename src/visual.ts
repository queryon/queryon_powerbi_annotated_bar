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

import { VisualSettings, dataPointSettings } from "./settings";
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
  enableAxis: {
    show: boolean;
  };
}

interface AnnotatedBarDataPoint {
  value: any;
  // category: any;
  display: string;
  displayName: string;
  barColor: string;
  selectionId: ISelectionId;
};

interface AnnotatedBarViewModel {
  dataPoints: AnnotatedBarDataPoint[];
  // settings: AnnotatedBarSettings
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
    enableAxis: {
      show: false,
    }
  };

  let viewModel: AnnotatedBarViewModel = {
    dataPoints: [],
    // dataMax: 0,
    // settings: defaultSettings

  };


  let objects = dataViews[0].metadata.objects;

  // let annotatedBarSettings: AnnotatedBarSettings = {
  //   enableAxis: {
  //     show: getValue<boolean>(dataViewObject, 'enableAxis', 'show', defaultSettings.enableAxis.show),
  //   }
  // }



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
    // console.log(colorPalette.getColor(dataValue.values[i]).value)
    annotatedBarDataPoints.push({
      // category: category,
      value: dataValue[i].values[0],
      display: valueFormatter.format(dataValue[i].values[0]),
      displayName: dataValue[i].source.displayName,
      barColor: customColors[i],
      // barColor: !colorPalette.getColor(dataValue.values[i]).value ? customColors[i] : colorPalette.getColor(dataValue.values[i]).value,
      selectionId: host.createSelectionIdBuilder()
        //   .withCategory(category, i)
        .withMeasure(dataValue[i].source.queryName)
        .createSelectionId()
    });
  }

  // dataMax = <number>dataValue.maxLocal;

  return {
    dataPoints: annotatedBarDataPoints,
    // settings: annotatedBarSettings
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
// export function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
//   if (objects) {
//     let object = objects[objectName];
//     if (object) {
//       let property: T = object[propertyName];
//       if (property !== undefined) {
//         return property;
//       }
//     }
//   }
//   return defaultValue;
// }


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

// export function getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T {
//   let categoryObjects = category.objects;

//   if (categoryObjects) {
//     let categoryObject: DataViewObject = categoryObjects[index];
//     if (categoryObject) {
//       let object = categoryObject[objectName];
//       if (object) {
//         let property: T = object[propertyName];
//         if (property !== undefined) {
//           return property;
//         }
//       }
//     }
//   }
//   return defaultValue;
// }


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

  constructor(options: VisualConstructorOptions) {

    this.svg = d3.select(options.element).append('svg');
    this.svgGroupMain = this.svg.append('g');
    this.padding = 10;
    this.host = options.host
    this.selectionIdBuilder = this.host.createSelectionIdBuilder();
    this.selectionManager = this.host.createSelectionManager();
  }

  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    let objectName = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];

    // switch (objectName) {
    //   case 'enableAxis':
    //     objectEnumeration.push({
    //       objectName: objectName,
    //       properties: {
    //         show: this.annotatedBarSettings.enableAxis.show,
    //       },
    //       selector: null
    //     });
    // };

    // return objectEnumeration;

    const settings: VisualSettings = this.visualSettings ||
      VisualSettings.getDefault() as VisualSettings;
    return VisualSettings.enumerateObjectInstances(settings, options);
  }



  public update(options: VisualUpdateOptions) {
    let viewModel: AnnotatedBarViewModel = visualTransform(options, this.host);

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


    viewModel.dataPoints.forEach((element, i) => {
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
      // graphElement["AnnotationColor"] = this.visualSettings[role].LabelColor;
      // graphElement["Top"] = role.includes("Top") ? true : false;
      graphElement["Display"] = element.display
      graphElement["selectionId"] = element.selectionId
      // graphElement["AnnotationSize"] = this.visualSettings[role].fontSize;
      // graphElement["AnnotationFont"] = this.visualSettings[role].FontFamily;

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
      .attr('style', `color :${this.visualSettings.axisSettings.axisColor}`)

    if (!this.visualSettings.axisSettings.axis) {
      this.svgGroupMain.selectAll("text").remove()
    } else {
      this.svgGroupMain.selectAll("text").style('font-size', this.visualSettings.axisSettings.fontSize)
      this.svgGroupMain.selectAll("text").style('stroke', this.visualSettings.axisSettings.axisColor)
      this.svgGroupMain.selectAll("text").style('font-family', this.visualSettings.axisSettings.fontFamily)

    }

    //Annotation details
    let annotationsData, makeAnnotations;

    let countBottom = datavars.filter(el => !el.Top).length;
    let countTop = datavars.filter(el => el.Top).length;;

    const style = svgAnnotations[this.visualSettings.annotationSettings.annotationStyle]
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
      if (!this.visualSettings.annotationSettings.stagger) {
        this.visualSettings.annotationSettings.spacing = false;

        if (this.visualSettings.annotationSettings.editMode) {
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
        if (this.visualSettings.annotationSettings.editMode) {
          element.dy = this.visualSettings[element.Role].dy ? this.visualSettings[element.Role].dy : element.Top ? this.visualSettings.annotationSettings.spacing * (-1 * countTop) : this.visualSettings.annotationSettings.spacing * countBottom;
          element.dx = this.visualSettings[element.Role].dx ? this.visualSettings[element.Role].dx : element.Value == d3.max(datavars, function (d) { return d.Value; }) ? -0.1 : 0;
        }

        else {
          this.updateCoord({ dx: false, dy: false }, element.Role)
          element.dy = element.Top ? this.visualSettings.annotationSettings.spacing * (-1 * countTop) : this.visualSettings.annotationSettings.spacing * countBottom;
          element.dx = element.Value == d3.max(datavars, function (d) { return d.Value; }) ? -0.1 : 0;
        }
      }

      annotationsData = [{
        note: {
          wrap: 900,
          label: element.Category + this.visualSettings.annotationSettings.separator + element.Display,
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


      if (this.visualSettings.annotationSettings.editMode) {
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
