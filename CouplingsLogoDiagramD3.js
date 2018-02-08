// CouplingsLogoDiagramD3.js
// This class generates a SVG image (via D3) representing couplings of residues within the sequence alignment.

// Constructor for the CouplingsLogoDiagramD3 class
// @param alignment A multiple sequence alignment
// @param options presentation and data processing / statistical options
function CouplingsLogoDiagramD3(options, data, seqLen) {
    var self = this;
    self.options = jQuery.extend(true, {}, self.defaultOpts, options);
    self.rawData = data; //TODO: currently dumping in the symColHash (normalized by alignment height) .. but should be an integrated data model
    // other class members
    self.svg = null;
    self.bounds = null;
    self.seqLen = seqLen;
}

// Default Options
CouplingsLogoDiagramD3.prototype.defaultOpts = {
    elementId: "couplingslogo", //html element Id to use as container
    elementWidth: 600, // desired width of the container
    elementHeight: 32 // desired height of the container
}


// initDiagram()
// constructs element in container from options and populates using drawDiagram()
CouplingsLogoDiagramD3.prototype.initDiagram = function() {
    var self = this;
    self.svg = self.createSvg(d3.select("#" + self.options.elementId),
                                self.options.elementWidth,
                                self.options.elementHeight);
    self.drawDiagram(self.svg, self.bounds, self.options, self.rawData);
}

// createSVG()
// constructs svg element using dimensions from options
CouplingsLogoDiagramD3.prototype.createSvg = function(container, width, height) {
    return container.append("svg")
                .attr("width", width)
                .attr("height",height)
                .attr("style","background-color:white");
}

// drawDiagram()
// set up scaling and any labels, then call drawPlot
CouplingsLogoDiagramD3.prototype.drawDiagram = function(svg, bounds, options, derivedColumnProportions) {
        var self = this;
        var xScale = null; //TODO implement
        var yScale = null; //TODO implement
        var bounds = null; //TODO implement
        this.drawPlot(svg, options, bounds, xScale, yScale);
}



// addcolumnToPlot()
// given a plot group (g) element, add a column to it
CouplingsLogoDiagramD3.prototype.addColumnToPlot = function(plotGroup, options, columnIndexA, columnIndexB) {
        var self = this;
        nextcolA = plotGroup.append("g").attr("transform","translate(" + (100 * columnIndexA) + ",0)");
        nextcolB = plotGroup.append("g").attr("transform","translate(" + (100 * columnIndexB) + ",0)");
        var columnFloorLevel = 100;
        var symbolCode = "A";
        var symbolProportion = 1;
        columnFloorLevel -= symbolProportion * 100;
        nextcolA.append("g").attr("transform","matrix(1,0,0," + symbolProportion + ",0," + columnFloorLevel + ")").append("use").attr("xlink:href","#" + symbolCode);
        nextcolB.append("g").attr("transform","matrix(1,0,0," + symbolProportion + ",0," + columnFloorLevel + ")").append("use").attr("xlink:href","#" + symbolCode);
}

// drawPlot()
// create the group element which represents the entire plot (using scaling) and add all columns
CouplingsLogoDiagramD3.prototype.drawPlot = function(svg, options, bounds, xScale, yScale) {
        var self = this;
        if (this.rawData == null) {return;}
        var columnCount = self.seqLen;
        if (columnCount == 0) {return;}
        plotGroup = svg.append("g").attr("transform","matrix(" + (this.options.elementWidth / columnCount / 100) + ",0,0," + (this.options.elementHeight / 100) + ",0,0)");
        for (var col = 0; col < this.rawData.A.length; col++) {
                this.addColumnToPlot(plotGroup, options, this.rawData.A[col], this.rawData.B[col]);
        }
}
