import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
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
export declare class Visual implements IVisual {
    private svg;
    private svgGroupMain;
    private padding;
    private visualSettings;
    private minScale;
    private maxScale;
    private host;
    private selectionManager;
    private selectionIdBuilder;
    constructor(options: VisualConstructorOptions);
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration;
    update(options: VisualUpdateOptions): void;
    renderVisual(width: number, height: number, datavars: DataVars[]): void;
    private updateCoord;
    private appendAnnotaions;
}
