import powerbi from "powerbi-visuals-api";

import { valueFormatter as vf, } from "powerbi-visuals-utils-formattingutils";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;

export function enumerateObjectInstancesMain(options: EnumerateVisualObjectInstancesOptions) {
        //Push custom attributes to property pane, as well as dynamic names.
        let objectName = options.objectName;
        console.log("enumerateObjectInstances OBJECT NAME : " + options.objectName);
        let objectEnumeration: VisualObjectInstance[] = [];
        let dataPoints = this.viewModel.dataPoints.concat()
        switch (objectName) {
          case 'annotationSettings':
            console.log("PUSHING HIDE LABELS TO BE : " + this.viewModel.settings.annotationSettings.hideLabels);
            objectEnumeration.push({
              objectName: objectName,
              properties: {
                overlapStyle: this.viewModel.settings.annotationSettings.overlapStyle,
                labelInfo: this.viewModel.settings.annotationSettings.labelInfo,
                barHt: this.viewModel.settings.annotationSettings.barHt,
                sameAsBarColor: this.viewModel.settings.annotationSettings.sameAsBarColor,
                hideLabels: this.viewModel.settings.annotationSettings.hideLabels,
                displayUnits: this.viewModel.settings.annotationSettings.displayUnits,
                precision: this.viewModel.settings.annotationSettings.precision,
                stagger: this.viewModel.settings.annotationSettings.stagger,
              },selector: null});
            if (this.viewModel.settings.annotationSettings.labelInfo === 'Auto') {
              objectEnumeration.push({
                objectName: objectName,
                properties: { separator: this.viewModel.settings.annotationSettings.separator, },selector: null});}
            break
          case 'textFormatting':
            objectEnumeration.push({
              objectName: objectName,
              properties: {allTextTop: this.viewModel.settings.textFormatting.allTextTop,
              },selector: null})
    
            if (this.viewModel.settings.annotationSettings.hideLabels) {
              objectEnumeration.push({
                objectName: objectName,
                properties: {fill: {solid: {color: this.viewModel.settings.textFormatting.fill}}},selector: null})}
    
            if (!this.viewModel.settings.annotationSettings.sameAsBarColor) {
              objectEnumeration.push({
                objectName: objectName,
                properties: {fill: {solid: {color: false}}},selector: null})
              }
            objectEnumeration.push({
              objectName: objectName,properties: {
                labelOrientation: this.viewModel.settings.textFormatting.labelOrientation,
                annotationStyle: this.viewModel.settings.textFormatting.annotationStyle,
                FontFamily: this.viewModel.settings.textFormatting.FontFamily,
                fontSize: this.viewModel.settings.textFormatting.fontSize
              },selector: null})
            for (let barDataPoint of dataPoints){//.sort((a, b) => (a.value > b.value) ? 1 : -1)) {
              objectEnumeration.push({
                objectName: objectName, displayName: barDataPoint.displayName + " custom format",
                properties: {customFormat: barDataPoint.customFormat},selector: barDataPoint.selectionId.getSelector()});
              if (barDataPoint.customFormat) {
                if (!this.viewModel.settings.annotationSettings.sameAsBarColor) {
                  objectEnumeration.push({
                    objectName: objectName, displayName: barDataPoint.displayName + " Color",
                    properties: {fill: {solid: {color: barDataPoint.LabelColor}}
                    },selector: barDataPoint.selectionId.getSelector()});
                }
                objectEnumeration.push({
                  objectName: objectName, displayName: barDataPoint.displayName + " text position",
                  properties: {top: barDataPoint.top
                  },selector: barDataPoint.selectionId.getSelector()});
                objectEnumeration.push({
                  objectName: barDataPoint.displayName, displayName: barDataPoint.displayName,
                  properties: {
                    FontFamily: barDataPoint.FontFamily, fontSize: barDataPoint.fontSize},selector: barDataPoint.selectionId.getSelector()});
                objectEnumeration.push({
                  objectName: objectName, displayName: barDataPoint.displayName + " Label orientation",
                  properties: { labelOrientation: barDataPoint.labelOrientation },selector: barDataPoint.selectionId.getSelector()}); }
            }
            break;
          case 'axisSettings':
            objectEnumeration.push({
              objectName: objectName, properties: {
                axis: this.viewModel.settings.axisSettings.axis,
                axisColor: this.viewModel.settings.axisSettings.axisColor
              },selector: null});
            if (this.viewModel.settings.axisSettings.axis !== "None") {
              objectEnumeration.push({
                objectName: objectName, properties: {
                  fontSize: this.viewModel.settings.axisSettings.fontSize,
                  fontFamily: this.viewModel.settings.axisSettings.fontFamily,
                  bold: this.viewModel.settings.axisSettings.bold
                },selector: null});}
            if (this.viewModel.settings.annotationSettings.overlapStyle !== "stacked") {
              objectEnumeration.push({
                objectName: objectName, properties: {manualScale: this.viewModel.settings.axisSettings.manualScale,
                },selector: null});
              if (this.viewModel.settings.axisSettings.manualScale) {
                objectEnumeration.push({
                  objectName: objectName, properties: {
                    barMin: this.viewModel.settings.axisSettings.barMin, barMax: this.viewModel.settings.axisSettings.barMax,
                  },selector: null});}}
            break
          case 'barColorSelector':
            for (let barDataPoint of dataPoints){//.sort((a, b) => (a.value > b.value) ? 1 : -1)) {
              objectEnumeration.push({
                objectName: objectName, displayName: "Display " + barDataPoint.displayName + " in bar",
                properties: {ShowInBar: barDataPoint.ShowInBar
                },selector: barDataPoint.selectionId.getSelector()});
              if (barDataPoint.ShowInBar) {
                objectEnumeration.push({
                  objectName: objectName, displayName: barDataPoint.displayName,
                  properties: {fill: {solid: {color: barDataPoint.barColor}} },selector: barDataPoint.selectionId.getSelector()});}}
            break;
        };
        return objectEnumeration;
  }