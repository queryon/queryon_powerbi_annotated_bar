import powerbi from "powerbi-visuals-api";

export function getTextHeight(textString: string, fontSize: number, fontFamily: string) {
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
           
        console.log("Still Working");
        return "white"
    })

    return textHeight
  }