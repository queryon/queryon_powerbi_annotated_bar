import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class dataPointSettings {
    defaultColor: string;
    showAllDataPoints: boolean;
    fill: string;
    fillRule: string;
    fontSize: number;
}
export declare class BarSettings {
    barHeight: number;
    manualScale: boolean;
    barMin: any;
    barMax: any;
}
export declare class AxisSettings {
    axis: boolean;
    axisColor: string;
    fontSize: number;
    fontFamily: string;
}
export declare class AnnotationSettings {
    annotationStyle: string;
    stagger: boolean;
    spacing: any;
    editMode: boolean;
    separator: string;
}
export declare class Label {
    LabelColor: string;
    FontFamily: string;
    fontSize: number;
    ShowInBar: boolean;
    BarColor: string;
    dx: any;
    dy: any;
    show: boolean;
}
export declare class VisualSettings extends DataViewObjectsParser {
    barSettings: BarSettings;
    axisSettings: AxisSettings;
    annotationSettings: AnnotationSettings;
    TopLabel1: Label;
    TopLabel2: Label;
    TopLabel3: Label;
    BottomLabel1: Label;
    BottomLabel2: Label;
    BottomLabel3: Label;
}
