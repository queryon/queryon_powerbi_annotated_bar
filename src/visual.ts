"use strict";

import "core-js/stable";
import 'regenerator-runtime/runtime'
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisual = powerbi.extensibility.visual.IVisual;
import ISelectionManager = powerbi.extensibility.ISelectionManager
import ITooltipService = powerbi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem; 

import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISelectionId = powerbi.visuals.ISelectionId;
import Fill = powerbi.Fill;
import * as d3 from "d3";
import * as svgAnnotations from "d3-svg-annotation";

import {
  valueFormatter as vf,
} from "powerbi-visuals-utils-formattingutils";
import {
  TooltipEventArgs,
  TooltipEnabledDataPoint,
  createTooltipServiceWrapper,
  ITooltipServiceWrapper,
} from 'powerbi-visuals-utils-tooltiputils'
import DataViewObject = powerbi.DataViewObject;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { color } from "d3";

import {createFormatter} from './helper_methods';

//Global settings to the visual
interface AnnotatedBarSettings {
  annotationSettings: {
    stagger: boolean,
    spacing: any,
    separator: string,
    sameAsBarColor: boolean,
    hideLabels: boolean,
    barHt: number,
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
  colName: string;
  colVal: string;
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
}

interface AnnotatedBarViewModel {
  dataPoints: AnnotatedBarDataPoint[];
  settings: AnnotatedBarSettings
}

function visualTransform(options: VisualUpdateOptions, host: IVisualHost): AnnotatedBarViewModel {
  let dataViews = options.dataViews, defaultSettings: AnnotatedBarSettings = {
    annotationSettings: 
    {

    sameAsBarColor: false, hideLabels: false, stagger: true, spacing: 20,barHt: 30, displayUnits: 0,precision: false, overlapStyle: 'full',labelInfo: 'Auto', separator: ":", },
    axisSettings: { axis: "None",axisColor: { solid: { color: 'gray' } }, fontSize: 12,fontFamily: 'Arial', bold: false,manualScale: true, barMin: false,barMax: false },
    textFormatting: { allTextTop: false,labelOrientation: "Auto", annotationStyle: "annotationLabel",fontSize: 12, FontFamily: 'Arial',fill: { solid: { color: 'gray' } } }

    };
  let viewModel: AnnotatedBarViewModel = { dataPoints: [], settings: defaultSettings };
  let objects = dataViews[0].metadata.objects;
  if (!dataViews || !dataViews[0] || !dataViews[0].categorical || !dataViews[0].categorical.values) { return viewModel; }
  let categorical = dataViews[0].categorical, dataValues = categorical.values, category, dataValue, highlightsArray
  if (categorical.categories) {
    category = categorical.categories[0];
    dataValue = categorical.values[0];
    if (dataValue.highlights) {highlightsArray = categorical.values[0].highlights} 
  }
  let annotatedBarSettings: AnnotatedBarSettings = {
    annotationSettings: {
      sameAsBarColor: getValue<boolean>(objects, 'annotationSettings', 'sameAsBarColor', defaultSettings.annotationSettings.sameAsBarColor),
      hideLabels: getValue<boolean>(objects, 'annotationSettings', 'hideLabels', defaultSettings.annotationSettings.hideLabels),
      stagger: getValue<boolean>(objects, 'annotationSettings', 'stagger', defaultSettings.annotationSettings.stagger),
      separator: getValue<string>(objects, 'annotationSettings', 'separator', defaultSettings.annotationSettings.separator),
      barHt: getValue<number>(objects, 'annotationSettings', 'barHt', defaultSettings.annotationSettings.barHt),
      spacing: getValue<any>(objects, 'annotationSettings', 'spacing', defaultSettings.annotationSettings.spacing),
      displayUnits: getValue<number>(objects, 'annotationSettings', 'displayUnits', defaultSettings.annotationSettings.displayUnits),
      precision: getValue<any>(objects, 'annotationSettings', 'precision', defaultSettings.annotationSettings.precision),
      overlapStyle: getValue<string>(objects, 'annotationSettings', 'overlapStyle', defaultSettings.annotationSettings.overlapStyle),
      labelInfo: getValue<string>(objects, 'annotationSettings', 'labelInfo', defaultSettings.annotationSettings.labelInfo)},
    axisSettings: {
      axis: getValue<any>(objects, 'axisSettings', 'axis', defaultSettings.axisSettings.axis),
      axisColor: getValue<string>(objects, 'axisSettings', 'axisColor', defaultSettings.axisSettings.axisColor),
      fontSize: getValue<number>(objects, 'axisSettings', 'fontSize', defaultSettings.axisSettings.fontSize),
      fontFamily: getValue<string>(objects, 'axisSettings', 'fontFamily', defaultSettings.axisSettings.fontFamily),
      bold: getValue<boolean>(objects, 'axisSettings', 'bold', defaultSettings.axisSettings.bold),
      manualScale: getValue<any>(objects, 'axisSettings', 'manualScale', defaultSettings.axisSettings.manualScale),
      barMin: getValue<any>(objects, 'axisSettings', 'barMin', defaultSettings.axisSettings.barMin),
      barMax: getValue<any>(objects, 'axisSettings', 'barMax', defaultSettings.axisSettings.barMax),},
    textFormatting: {
      allTextTop: getValue<boolean>(objects, 'textFormatting', 'allTextTop', defaultSettings.textFormatting.allTextTop),
      labelOrientation: getValue<string>(objects, 'textFormatting', 'labelOrientation', defaultSettings.textFormatting.labelOrientation),
      annotationStyle: getValue<string>(objects, 'textFormatting', 'annotationStyle', defaultSettings.textFormatting.annotationStyle),
      fontSize: getValue<number>(objects, 'textFormatting', 'fontSize', defaultSettings.textFormatting.fontSize),
      FontFamily: getValue<string>(objects, 'textFormatting', 'FontFamily', defaultSettings.textFormatting.FontFamily),
      fill: getValue<any>(objects, 'textFormatting', 'fill', defaultSettings.textFormatting.fill).solid.color} }
  let annotatedBarDataPoints: AnnotatedBarDataPoint[] = [];
  //QueryOn colors to be set as default
  let customColors = ["rgb(186,215,57)", "rgb(0, 188, 178)", "rgb(121, 118, 118)", "rgb(105,161,151)", "rgb(78,205,196)", "rgb(166,197,207)", "rgb(215,204,182)", "rgb(67,158,157)", "rgb(122,141,45)", "rgb(162,157,167)"]
  let length = categorical.categories ? Math.max(categorical.categories[0].values.length, categorical.values[0].values.length) : dataValues.length
  for (let i = 0, len = length; i < len; i++) {
    let defaultBarColor: Fill = {solid: {color: customColors[i > 10 ? i % 10 : i]}}
    let format, valueFormatter1, dataPointValue, displayName, selectionId, colName, colVal
    if (!categorical.categories) {
      format = options.dataViews[0].categorical.values[i].source.format;
      dataPointValue = dataValues[i].values[0]
      displayName = dataValues[i].source.displayName,
        selectionId = host.createSelectionIdBuilder()     //generates IDs for svg elements based on queryName
          .withMeasure(dataValues[i].source.queryName)
          .createSelectionId()
      colName = displayName
      colVal = false
    } else {
      if(options.dataViews[0].metadata.columns[0].roles.category){
        colName = options.dataViews[0].metadata.columns[0].displayName
        colVal = options.dataViews[0].metadata.columns[1].displayName }
      else {
        colName = options.dataViews[0].metadata.columns[1].displayName
        colVal = options.dataViews[0].metadata.columns[0].displayName }
      format = options.dataViews[0].categorical.values[0].source.format;
      dataPointValue = categorical.values[0].values[i]
      displayName = categorical.categories[0].values[i].toString()
      selectionId = host.createSelectionIdBuilder()     //generates IDs for svg elements based on queryName
        .withCategory(category, i)
        .createSelectionId()
    }
    if (isNaN(dataPointValue)) {return viewModel;}
    valueFormatter1 = createFormatter(format, annotatedBarSettings.annotationSettings.precision, annotatedBarSettings.annotationSettings.displayUnits);
    let dataPoint = {
      colName: colName, colVal: colVal, value: dataPointValue, displayName: displayName,
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
      transformed: valueFormatter1.format(dataPointValue), selectionId: selectionId,
      highlight: highlightsArray && highlightsArray[i] ? true : false }
    annotatedBarDataPoints.push(dataPoint);
  }
  return {dataPoints: annotatedBarDataPoints,settings: annotatedBarSettings};
}

export function getValue<T>(objects: DataViewObject, objectName: string, propertyName: string, defaultValue: T): T {
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
  private tooltipServiceWrapper: ITooltipServiceWrapper;

  private events: IVisualEventService;

  constructor(options: VisualConstructorOptions) {
    this.svg = d3.select(options.element).append('svg');
    this.svgGroupMain = this.svg.append('g');
    this.padding = 15;
    this.host = options.host
    this.selectionIdBuilder = this.host.createSelectionIdBuilder();
    this.selectionManager = this.host.createSelectionManager();
    this.highlighted = false;
    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      options.host.tooltipService,
      options.element);
    this.events = options.host.eventService;
  }

  /*
  When a value is changed in the Format Section of a graph on Power Bi enumerateObjectInstances() is called.
  */
  public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
    console.log("Something is changed");
    return;
  }

  private validateData(data: AnnotatedBarDataPoint[], options: VisualUpdateOptions) {
    if (data.length > 10000) {
        return true;
    }
    return false;
}



  public update(options) {
    this.events.renderingStarted(options); // Rendering Events API START
    this.viewModel = visualTransform(options, this.host);
    if(this.validateData(this.viewModel.dataPoints, options)) { // Short circuit if data size is too large for view type
      this.events.renderingFailed(options); // Rendering Events API FAIL
      return;}
    let categorical = options.dataViews[0].categorical;
    this.highlighted = (categorical.categories && categorical.values[0].highlights)
    let marginTop = 10, marginTopStagger = 20, graphElements = []
    this.viewModel.dataPoints.forEach((element, i) => {
      let graphElement = {}, barValue = 0, value = element.value, stackedBarX
      if (this.viewModel.settings.annotationSettings.overlapStyle === 'stacked') {
        for (let j = i; j >= 0; j--) {
          const previousElement = this.viewModel.dataPoints[j];
          if (element.value >= 0 && previousElement.value >= 0) {
            barValue += previousElement.value
          } else if (element.value < 0 && previousElement.value < 0) {
            barValue += previousElement.value
          }}
        stackedBarX = value > 0 ? barValue - value : barValue
        graphElement["x"] = barValue - (value / 2)
      }
      barValue = !barValue ? element.value : barValue
      let elementTop = element.top === "top" ? true : false, displayName = element.displayName
      let annotationColor = !element.customFormat ? this.viewModel.settings.textFormatting.fill : element.LabelColor
      let annotationSize = !element.customFormat ? this.viewModel.settings.textFormatting.fontSize : element.fontSize
      let annotationFont = !element.customFormat ? this.viewModel.settings.textFormatting.FontFamily : element.FontFamily
      let labelOrientation = !element.customFormat ? this.viewModel.settings.textFormatting.labelOrientation : element.labelOrientation
      this.setGraphElementValuesFromViewModel(graphElement, displayName, element, annotationColor, elementTop, annotationSize, annotationFont, labelOrientation, stackedBarX);
      graphElements.push(graphElement)
      let textHeight = this.getTextHeight(graphElement["annotationText"], annotationSize, annotationFont)
      if (this.viewModel.settings.annotationSettings.spacing < textHeight) {
        this.viewModel.settings.annotationSettings.spacing = textHeight
        if (graphElement["Top"]) {marginTopStagger += textHeight}
      }
      if (graphElement["Top"]) {marginTop = Math.max(marginTop, textHeight + 30)}
    });
    if (this.viewModel.settings.textFormatting.annotationStyle === 'annotationCallout' || this.viewModel.settings.textFormatting.annotationStyle === 'annotationCalloutCurve') {
      this.viewModel.settings.annotationSettings.spacing += 10
    }
    let conditionalMinimum, conditionalMax
    //Stablish min/max axis with exception on stacked (sum of vals)
    if (this.viewModel.settings.annotationSettings.overlapStyle === 'stacked') {
      conditionalMinimum = Math.ceil(graphElements.filter(el => el.Value < 0).reduce((a, b) => (a + b.Value), 0));
      conditionalMax = Math.ceil(graphElements.filter(el => el.Value >= 0).reduce((a, b) => (a + b.Value), 0));
    } else {
      conditionalMinimum = d3.min(graphElements, d => d.Value) > 0 ? 0 : d3.min(graphElements, d => d.Value)
      conditionalMax = d3.max(graphElements, d => d.Value )
    }
    //handles auto and manual scale
    this.handleAutoAndManualScale(conditionalMinimum, conditionalMax);
    let format: string = options.dataViews[0].categorical.values[0].source.format;
    let valueFormatter = createFormatter(format, this.viewModel.settings.annotationSettings.precision, this.viewModel.settings.annotationSettings.displayUnits);
    if (this.viewModel.settings.axisSettings.axis === "Values") {
      let dynamicPadding = Math.max(this.getTextWidth(valueFormatter.format(this.minScale), this.viewModel.settings.axisSettings.fontSize, this.viewModel.settings.axisSettings.fontFamily), this.getTextWidth(valueFormatter.format(this.maxScale), this.viewModel.settings.axisSettings.fontSize, this.viewModel.settings.axisSettings.fontFamily)) / 2
      this.padding = dynamicPadding
    }
    //Filter out elements smaller/bigger than manual axis
    graphElements = this.filterElementsForAxis(graphElements);
    marginTopStagger += (graphElements.filter(element => element.Top).length * this.viewModel.settings.annotationSettings.spacing)
    this.width = options.viewport.width;
    this.height = options.viewport.height;
    //sets an empty canva
    this.svgGroupMain.selectAll("g").remove();
    this.svgGroupMain.selectAll("rect").remove();
    let scale = d3.scaleLinear()
      .domain([this.minScale !== false ? this.minScale : d3.min(graphElements, d => d.Value), this.maxScale !== false ? this.maxScale : d3.max(graphElements, d=> d.Value )]) //min and max data from input
      .range([0, this.width - (this.padding * 2)]); //min and max width in px           
    // set height and width of root SVG element using viewport passed by Power BI host
    this.svg.attr("height", this.height)
      .attr("width", this.width)
      .attr("stroke", 'gray');
    //axis settings
    let x_axis = this.handleAxisSettings(scale, valueFormatter);
    //Append group and insert axis
    this.appendGroupInsertAxis(marginTopStagger, marginTop, x_axis);
    //bar settings
    let { barElements, thisBarHt } = this.setBarSettings(graphElements, marginTopStagger, marginTop, scale);
    //Annotation details
    let annotationsData, makeAnnotations;
    //keeps track of count for stagger positioning
    let countBottom = graphElements.filter(el => !el.Top).length;
    let countTop = graphElements.filter(el => el.Top).length;
    const style = this.viewModel.settings.textFormatting.annotationStyle !== "textOnly" ? svgAnnotations[this.viewModel.settings.textFormatting.annotationStyle] : svgAnnotations['annotationLabel']
    let alignment = {"className": "custom", "note": { "align": "dynamic" } }
    const type = new svgAnnotations.annotationCustomType(style,alignment)
    let annotationElements
    if (this.viewModel.settings.annotationSettings.overlapStyle === "stacked") {
      let positive = graphElements.filter(el => el.Value >= 0)
      let negative = graphElements.filter(el => el.Value < 0)
      annotationElements = positive.concat(negative)
    } else if (this.viewModel.settings.annotationSettings.overlapStyle === "edge") {
      annotationElements = graphElements.concat().reverse()
    } else {annotationElements = graphElements.concat()}
    // handle annotations positioning
    ({ countTop, countBottom, annotationsData, makeAnnotations } = this.handleAnnotationPositions(annotationElements, scale, alignment, barElements, marginTop, thisBarHt, marginTopStagger, countTop, countBottom, annotationsData, makeAnnotations, type, categorical));
    this.events.renderingFinished(options); // Rendering Events API FINISH
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
      .text(d => d)
      .attr("color", function(d){
        //Irrelevant color. ".EACH" does not work on IE and we need to iterate over the elements after they have been appended to dom.
        let thisHeight = this.getBBox().height
        textHeight = thisHeight
        // this.remove()
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
           
        return "white"
    })

    return textHeight
  }

  private setGraphElementValuesFromViewModel(graphElement: {}, displayName: string, element: AnnotatedBarDataPoint, annotationColor: any, elementTop: boolean, annotationSize: number, annotationFont: string, labelOrientation: string, stackedBarX: any) {
    
    graphElement["Category"] = displayName;
    graphElement["Value"] = element.value;
    graphElement["Color"] = element.barColor;
    graphElement["ShowInBar"] = element.ShowInBar;
    graphElement["AnnotationColor"] = this.viewModel.settings.annotationSettings.sameAsBarColor && element.ShowInBar ? element.barColor : annotationColor;
    graphElement["Top"] = !element.customFormat ? this.viewModel.settings.textFormatting.allTextTop : elementTop;
    graphElement["Display"] = element.transformed;
    graphElement["colName"] = element.colName;
    graphElement["colVal"] = element.colVal ? element.colVal : element.transformed;
    graphElement["selectionId"] = element.selectionId;
    graphElement["AnnotationSize"] = annotationSize;
    graphElement["AnnotationFont"] = annotationFont;
    if (this.viewModel.settings.annotationSettings.labelInfo === 'Auto') {
      graphElement["annotationText"] = graphElement["Category"] + this.viewModel.settings.annotationSettings.separator + " " + graphElement["Display"];
    } else {
      graphElement["annotationText"] = graphElement[this.viewModel.settings.annotationSettings.labelInfo];
    }
    graphElement["textWidth"] = this.getTextWidth(graphElement["annotationText"], annotationSize, annotationFont);
    graphElement["labelOrientation"] = labelOrientation;
    graphElement["customFormat"] = element.customFormat;
    graphElement["dx"] = 0;
    graphElement["highlight"] = element.highlight;
    graphElement["stackedBarX"] = stackedBarX;

    if (this.viewModel.settings.annotationSettings.hideLabels === true)
    {
      graphElement["annotationText"] = "";
      this.viewModel.settings.textFormatting.annotationStyle == 'textOnly';
    }

    //if (this.viewModel.settings.textFormatting.annotationStyle === 'textOnly') {
    //  makeAnnotations.disable(["connector"]); }

  }
  
  private handleAxisSettings(scale: d3.ScaleLinear<number, number>, valueFormatter: vf.IValueFormatter) {
    let x_axis;
    if (this.viewModel.settings.axisSettings.axis === "Percentage") {
      x_axis = d3.axisBottom(d3.scaleLinear()
        .domain([0, 100]) //percentage axis
        .range([0, this.width - (this.padding * 2)]))
        .tickFormat(d => d + "%");
    } else {
      x_axis = d3.axisBottom(scale)
        .tickFormat(d => valueFormatter.format(d));
    }
    return x_axis;
  }

  private handleAnnotationPositions(annotationElements: any, scale: d3.ScaleLinear<number, number>, alignment: { className: string; note: { align: string; }; }, barElements: any[], marginTop: number, thisBarHt: any, marginTopStagger: number, countTop: number, countBottom: number, annotationsData: any, makeAnnotations: any, type: svgAnnotations.annotationCustomType<unknown>, categorical: any) {
    annotationElements.forEach((element, i) => {
      element.x = !element.x ? this.padding + scale(element.Value) : this.padding + scale(element.x);
      alignment.note.align = (element.labelOrientation !== "Auto") ? element.labelOrientation : this.getAnnotationOrientation(element);
      if (!this.viewModel.settings.annotationSettings.stagger) {
        if (this.viewModel.settings.annotationSettings.overlapStyle === 'edge' && element.Top) {
          if (element.ShowInBar) {
            element.y = marginTop + thisBarHt * barElements.indexOf(element);
            element.dy = -(thisBarHt * (barElements.indexOf(element))) - 20;}
          else {
            element.y = marginTop + this.viewModel.settings.annotationSettings.barHt;
            element.dy = -20 - this.viewModel.settings.annotationSettings.barHt;} }
        if (!element.dy) { element.dy = element.Top ? -20 : this.viewModel.settings.axisSettings.axis === "None" ? 20 : 40; }
        if (!element.y) { element.y = element.Top ? marginTop : marginTop + this.viewModel.settings.annotationSettings.barHt; } }
      else {
        if (this.viewModel.settings.annotationSettings.overlapStyle === 'edge' && element.Top) {
          if (element.ShowInBar) {
            element.y = marginTopStagger + thisBarHt * barElements.indexOf(element);
            element.dy = -(thisBarHt * (barElements.indexOf(element)));
            element.dy += this.viewModel.settings.annotationSettings.spacing * (-1 * countTop); }
          else {
            element.y = marginTopStagger + this.viewModel.settings.annotationSettings.barHt;
            element.dy = this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) - this.viewModel.settings.annotationSettings.barHt; }
        }
        if (!element.y) { element.y = element.Top ? marginTopStagger : marginTopStagger + this.viewModel.settings.annotationSettings.barHt; }
        if (!element.dy) { element.dy = element.Top ? this.viewModel.settings.annotationSettings.spacing * (-1 * countTop) : this.viewModel.settings.axisSettings.axis === "None" ? this.viewModel.settings.annotationSettings.spacing * countBottom : this.viewModel.settings.annotationSettings.spacing * countBottom + 20; }
      }
      annotationsData = [{ note: { wrap: 900, label: element.annotationText, bgPadding: 10 }, x: element.x, y: element.y, dy: element.dy, dx: element.dx, color: element["AnnotationColor"], id: element.selectionId }];
      makeAnnotations = svgAnnotations.annotation()
        .annotations(annotationsData)
        .type(type);

      
      if (this.viewModel.settings.textFormatting.annotationStyle === 'textOnly') {
        makeAnnotations
          .disable(["connector"]); }

      this.svgGroupMain
        .append("g")
        .attr('class', `annotation_selector_${element.Category.replace(/\W/g, '')} annotationSelector`)
        .style('stroke', 'transparent')
        .style('font-size', element.AnnotationSize + "px")
        .style('font-family', element.AnnotationFont)
        .style('background-color', 'transparent')
        .style('text-decoration', () => { if (this.highlighted) { return element.highlight ? "none" : "line-through"; } else { return "none"; } })
        .call(makeAnnotations)
        .on('click', el => {
          selectionManager.select(element.selectionId).then((ids: ISelectionId[]) => {
            if (ids.length > 0) {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 0.1);
              d3.select(`.selector_${element.Category.replace(/\W/g, '')}`).style('fill-opacity', 1);
              this.svgGroupMain.selectAll('.annotationSelector').style('text-decoration', "line-through");
              d3.selectAll(`.annotation_selector_${element.Category.replace(/\W/g, '')}`).style('text-decoration', "none"); }
            else {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 1);
              this.svgGroupMain.selectAll('.annotationSelector').style('text-decoration', "none"); }
          }); });
      if (element.Top) { countTop--; } else { countBottom--; }
      let selectionManager = this.selectionManager;
      // handle context menu - right click
      this.svg.on('contextmenu', () => {
        const mouseEvent: MouseEvent = <MouseEvent>d3.event;
        const eventTarget: EventTarget = mouseEvent.target;
        let dataPoint: any = d3.select(<Element>eventTarget).datum();
        selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {}, { x: mouseEvent.clientX, y: mouseEvent.clientY });
        mouseEvent.preventDefault(); });
      //tooltips
      this.svg.on('mouseover', el => {
        const mouseEvent: MouseEvent = <MouseEvent>d3.event;
        const eventTarget: EventTarget = mouseEvent.target;
        let args = [], dataPoint: any = d3.select(<Element>eventTarget).datum();
        if (dataPoint && dataPoint.Category) {
          if (categorical.categories) {
            args = [{ displayName: dataPoint.colName, value: dataPoint.Category },
            { displayName: dataPoint.colVal, value: dataPoint.Display }]; }
          else {
            args = [{ displayName: dataPoint.Category, value: dataPoint.Display }]; }
          //this.tooltipServiceWrapper.addTooltip(d3.select(<Element>eventTarget),
          //  (tooltipEvent: TooltipEventArgs<number>) => args, (tooltipEvent: TooltipEventArgs<number>) => null);
        } });
      //handle filter and transparency
      this.svg.on('click', () => {
        const mouseEvent: MouseEvent = <MouseEvent>d3.event;
        const eventTarget: EventTarget = mouseEvent.target;
        let dataPoint: any = d3.select(<Element>eventTarget).datum();
        if (dataPoint) {
          selectionManager.select(dataPoint.selectionId).then((ids: ISelectionId[]) => {
            if (ids.length > 0) {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 0.1);
              d3.select(<Element>eventTarget).style('fill-opacity', 1);
              this.svgGroupMain.selectAll('.annotationSelector').style('text-decoration', "line-through");
              d3.select(`.annotation_selector_${dataPoint.Category.replace(/\W/g, '')}`).style('text-decoration', "none"); }
            else {
              this.svgGroupMain.selectAll('.bar').style('fill-opacity', 1);
              this.svgGroupMain.selectAll('.annotationSelector').style('text-decoration', "none"); }
          }); } else {
          selectionManager.clear().then(() => { this.svgGroupMain.selectAll('.bar').style('fill-opacity', 1);
            this.svgGroupMain.selectAll('.annotationSelector').style('text-decoration', "none"); });
        } }); });
    return { countTop, countBottom, annotationsData, makeAnnotations };
  }

  private setBarSettings(graphElements: any[], marginTopStagger: number, marginTop: number, scale: d3.ScaleLinear<number, number>) {
    let barY, thisBarHt, barElements = graphElements.concat().filter(element => element.ShowInBar === true),
      firstBarY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop, bar;
    switch (this.viewModel.settings.annotationSettings.overlapStyle) {
      case "full":
        let negative = barElements.concat().filter(el => el.Value < 0).sort((a, b) => (a.Value > b.Value) ? 1 : -1);
        let positive = barElements.concat().filter(el => el.Value >= 0).sort((a, b) => (a.Value > b.Value) ? -1 : 1);
        barElements = negative.concat(positive);
        barY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop;
        thisBarHt = this.viewModel.settings.annotationSettings.barHt;
        bar = this.svgGroupMain.selectAll('rect')
          .data(barElements);
        bar.enter()
          .append('rect')
          .merge(bar)
          .attr('width', d => {            
            let min = (this.maxScale >= 0)?Math.max(this.minScale, 0):Math.min(this.maxScale, 0)
            return Math.abs(scale(d.Value) - scale(min));
          })
          .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
          .attr('x', d => { return this.padding + scale(Math.min(d.Value, Math.max(this.minScale, 0))); })
          .attr('fill', d => d.Color )
          .attr('fill-opacity', (d) => { if (this.highlighted) { return d.highlight ? 1 : 0.1; } else { return 1; } })
          .attr('y', barY)
          .attr('height', thisBarHt);
        bar.exit().remove();
        break;
      case "stacked":
        barY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop;
        thisBarHt = this.viewModel.settings.annotationSettings.barHt;
        //sort negative values for correct overlay
        bar = this.svgGroupMain.selectAll('rect')
          .data(barElements);
        bar.enter()
          .append('rect')
          .merge(bar)
          .attr('width', d => {return Math.abs(scale(d.Value) - scale(Math.max(this.minScale, 0))); })
          .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
          .attr('x', d => { return this.padding + scale(d.stackedBarX); })
          .attr('fill', (d,i) => d.Color )
          .attr('fill-opacity', (d) => { if (this.highlighted) { return d.highlight ? 1 : 0.1; } else { return 1; } })
          .attr('y', barY)
          .attr('height', thisBarHt);
        bar.exit().remove();
        break;
      case "edge":
        thisBarHt = this.viewModel.settings.annotationSettings.barHt / barElements.length;
        let countBottomBar = 1, countTopBar = 1;
        barY = (d, i) => { return firstBarY + thisBarHt * i; };
        bar = this.svgGroupMain.selectAll('rect')
          .data(barElements);
        bar.enter()
          .append('rect')
          .merge(bar)
          .attr('width', d => { let min = (this.maxScale >= 0) ? Math.max(this.minScale, 0) : Math.min(this.maxScale, 0);
            return Math.abs(scale(d.Value) - scale(min)); })
          .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
          .attr('x', d => { return this.padding + scale(Math.min(d.Value, Math.max(this.minScale, 0))); })
          .attr('fill', (d, i) => d.Color )
          .attr('fill-opacity', (d) => { if (this.highlighted) { return d.highlight ? 1 : 0.1; } else { return 1; } })
          .attr('y', barY)
          .attr('height', thisBarHt);
        bar.exit().remove();
        break;
      case "inside":
        let bars = {};
        const MINIMUM_BAR_HEIGHT = 4;
        let amount = barElements.length,
          smallestBar = Math.max(this.viewModel.settings.annotationSettings.barHt / amount, MINIMUM_BAR_HEIGHT),
          interval = (this.viewModel.settings.annotationSettings.barHt - smallestBar) / (amount - 1),
          totalSpace = this.viewModel.settings.annotationSettings.barHt;
        barElements.forEach((barElement, i) => {
          if (i === 0) { thisBarHt = this.viewModel.settings.annotationSettings.barHt; } //if first bar, total height
          else if (i === amount - 1) { thisBarHt = smallestBar; } //if last bar, smallest bar
          else { totalSpace = totalSpace - interval; thisBarHt = totalSpace; }
          let finalY = (this.viewModel.settings.annotationSettings.barHt - thisBarHt) / 2;
          barY = this.viewModel.settings.annotationSettings.stagger ? marginTopStagger + finalY : marginTop + finalY;
          bars[i] = this.svgGroupMain.selectAll(`.bar${i}`)
            .data([barElement]);
          bars[i].enter()
            .append('rect')
            .merge(bars[i])
            .attr('class', `.bar${i}`)
            .attr('class', el => `bar selector_${el.Category.replace(/\W/g, '')}`)
            .attr('x', d => { return this.padding + scale(Math.min(d.Value, Math.max(this.minScale, 0))); })
            .attr('width', d => {
              let min = (this.maxScale >= 0) ? Math.max(this.minScale, 0) : Math.min(this.maxScale, 0);
              return Math.abs(scale(d.Value) - scale(min)); })
            .attr('fill', (d, i) =>  d.Color )
            .attr('fill-opacity', (d) => { if (this.highlighted) { return d.highlight ? 1 : 0.1; } else { return 1; } })
            .attr('y', barY)
            .attr('height', thisBarHt);
          bars[i].exit().remove();
        }); break; }
    return { barElements, thisBarHt };
  }

  private appendGroupInsertAxis(marginTopStagger: number, marginTop: number, x_axis: any) {
    this.svgGroupMain.append("g")
      .attr("transform", "translate(" + this.padding + "," + ((this.viewModel.settings.annotationSettings.stagger ? marginTopStagger : marginTop) + this.viewModel.settings.annotationSettings.barHt) + ")")
      .call(x_axis)
      .attr('class', 'axis')
      .attr('style', `color :${this.viewModel.settings.axisSettings.axisColor.solid.color}`)
      .attr('style', `stroke :${this.viewModel.settings.axisSettings.axisColor.solid.color}`);
    this.svgGroupMain.selectAll('path, line')
      .attr('style', `color :${this.viewModel.settings.axisSettings.axisColor.solid.color}`);
    if (this.viewModel.settings.axisSettings.bold) {
      this.svgGroupMain.classed("xAxis", false);
    } else {
      this.svgGroupMain.attr('class', 'xAxis');
    }
    if (this.viewModel.settings.axisSettings.axis === "None") {
      this.svgGroupMain.selectAll("text").remove();
    } else {
      this.svgGroupMain.selectAll("text").style('font-size', this.viewModel.settings.axisSettings.fontSize);
      this.svgGroupMain.selectAll("text").style('fill', this.viewModel.settings.axisSettings.axisColor.solid.color);
      this.svgGroupMain.selectAll("text").style('font-family', this.viewModel.settings.axisSettings.fontFamily);
    }
  }

  private filterElementsForAxis(graphElements: any[]) {
    graphElements = graphElements.filter(element => {
      if (this.viewModel.settings.annotationSettings.overlapStyle !== "stacked") {
        return element.Value >= this.minScale && element.Value <= this.maxScale;
      } else {
        let value = element.Value > 0 ? element.Value + element.stackedBarX : element.Value;
        return value >= this.minScale && value <= this.maxScale;
      }
    });
    return graphElements;
  }

  private handleAutoAndManualScale(conditionalMinimum: any, conditionalMax: any) {
    if (!this.viewModel.settings.axisSettings.manualScale || this.viewModel.settings.annotationSettings.overlapStyle === "stacked") {
      this.minScale = conditionalMinimum;
      this.maxScale = conditionalMax;
      this.viewModel.settings.axisSettings.barMin = false;
      this.viewModel.settings.axisSettings.barMax = false;
    } else {
      this.maxScale = this.viewModel.settings.axisSettings.barMax === false ? conditionalMax : this.viewModel.settings.axisSettings.barMax;
      this.minScale = this.viewModel.settings.axisSettings.barMin === false ? conditionalMinimum : this.viewModel.settings.axisSettings.barMin;
    }
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
      .text(d => d )
      .attr("color", function(d){
        //Irrelevant color. ".EACH" does not work on IE and we need to iterate over the elements after they have been appended to dom.
        let thisWidth = this.getBBox().width
        textWidth = thisWidth
        // this.remove()
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }        
        return "white"
    })
    return textWidth
  }

  private getAnnotationOrientation(element) {
    if (element.textWidth + element.x > this.width - this.padding * 2) {
      return "right"
    } else {
      return "left"
    }

  }


}
