import { Visual } from "../../src/visual";
var powerbiKey = "powerbi";
var powerbi = window[powerbiKey];

var firstVisual10945130E24B4D6AAD5741C12ECB533D = {
    name: 'firstVisual10945130E24B4D6AAD5741C12ECB533D',
    displayName: 'firstVisual',
    class: 'Visual',
    version: '1.0.0',
    apiVersion: '2.6.0',
    create: (options) => {
        if (Visual) {
            return new Visual(options);
        }

        console.error('Visual instance not found');
    },
    custom: true
};

if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["firstVisual10945130E24B4D6AAD5741C12ECB533D"] = firstVisual10945130E24B4D6AAD5741C12ECB533D;
}

export default firstVisual10945130E24B4D6AAD5741C12ECB533D;