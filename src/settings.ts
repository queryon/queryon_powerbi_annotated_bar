import powerbi from "powerbi-visuals-api";

export class AnnotatedBarSettings {
    public annotationSettings: AnnotationSettings;
    public axisSettings: AxisSettings;
    public textFormatting: TextFormattingSettings;

    constructor() {
        this.annotationSettings = new AnnotationSettings();
        this.axisSettings = new AxisSettings();
        this.textFormatting = new TextFormattingSettings();
    }

}

export class AnnotationSettings {
    public stagger: boolean = true;
    public spacing: number = 20;
    public separator: string = ':';
    public sameAsBarColor: boolean = false;
    public hideLabels: boolean = false;
    public barHt: number = 30;
    public displayUnits: number = 0;
    public precision: boolean = false;
    public overlapStyle: string = 'full';
    public labelInfo: string = 'Auto';
}

export class AxisSettings {
    public bold: boolean = false;
    public axis: string = 'None';
    public axisColor: powerbi.Fill = { solid: { color: 'gray' } };
    public fontSize: number = 12;
    public fontFamily: string = 'Arial';
    public manualScale: boolean = true;
    public barMin: boolean = false;
    public barMax: boolean = false
}

export class TextFormattingSettings {
    public allTextTop: boolean = false;
    public labelOrientation: string = 'Auto';
    public annotationStyle: string = 'annotationLabel';
    public fill: powerbi.Fill = { solid: { color: 'gray' } };
    public FontFamily: string = 'Arial';
    public fontSize: number = 12
}