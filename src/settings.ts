/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import Annotation from "d3-svg-annotation";
import { color } from "d3";

// export class VisualSettings extends DataViewObjectsParser {
//       public dataPoint: dataPointSettings = new dataPointSettings();
//       }

export class dataPointSettings {
  // Default color
  public defaultColor: string = "";
  // Show all
  public showAllDataPoints: boolean = true;
  // Fill
  public fill: string = "";
  // Color saturation
  public fillRule: string = "";
  // Text Size
  public fontSize: number = 12;
}

export class BarSettings {
  public barHeight: number = 30;

  public manualScale: boolean = false;
  public barMin: any = false;
  public barMax: any = false;
}

export class AxisSettings {
  public axis: boolean = false;
  public axisColor: string = 'gray';
  public fontSize: number = 12;
  public fontFamily: string = 'Arial';
}
export class AnnotationSettings {
  public annotationStyle: string = "annotationLabel";
  public stagger: boolean = false;
  public spacing: any = 20;

  public editMode: boolean = false;
  public separator: string = ": ";

}

export class Label {
  public LabelColor: string = "gray";
  public FontFamily: string = "Arial";
  public fontSize: number = 18;
  public ShowInBar: boolean = true;
  public BarColor: string = "transparent";
  public dx: any = false;
  public dy: any = false;
  public show: boolean = false;
}

export class VisualSettings extends DataViewObjectsParser {
  public barSettings: BarSettings = new BarSettings();
  public axisSettings: AxisSettings = new AxisSettings();
  public annotationSettings: AnnotationSettings = new AnnotationSettings();
  public TopLabel1: Label = new Label();
  public TopLabel2: Label = new Label();
  public TopLabel3: Label = new Label();
  public BottomLabel1: Label = new Label();
  public BottomLabel2: Label = new Label();
  public BottomLabel3: Label = new Label();
}
