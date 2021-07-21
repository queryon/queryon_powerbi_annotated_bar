import powerbi from "powerbi-visuals-api";

import { valueFormatter as vf, } from "powerbi-visuals-utils-formattingutils";

export function createFormatter(format, precision?: any, value?: number) {
    let valueFormatter = {}
    valueFormatter["format"] = format;
    valueFormatter["value"] = value
  
    if (precision !== false) {
      valueFormatter["precision"] = precision
    }

    return vf.create(valueFormatter)
  }