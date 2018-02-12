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
CouplingsLogoDiagramD3.prototype.addColumnToPlot = function(plotGroup, options, columnIndexA, columnIndexB, symbolCode) {
        var self = this;
        nextcolA = plotGroup.append("g").attr("transform","translate(" + (100 * columnIndexA) + ",0)");
        nextcolB = plotGroup.append("g").attr("transform","translate(" + (100 * columnIndexB) + ",0)");

        nextcolC = plotGroup.append("g").attr("transform","translate(" + (100 * columnIndexB) + ",0)");

        var columnFloorLevel = 100;
        var symbolProportion = 1;
        columnFloorLevel -= symbolProportion * 100;
        nextcolA.append("g").attr("transform","matrix(1,0,0," + symbolProportion + ",0," + columnFloorLevel + ")").append("use").attr("xlink:href","#" + symbolCode);
        nextcolB.append("g").attr("transform","matrix(1,0,0," + symbolProportion + ",0," + columnFloorLevel + ")").append("use").attr("xlink:href","#" + symbolCode);


        circleData = [  { "cx": 20, "cy": 20, "radius": 30, "color" : "green" },  { "cx": 70, "cy": 70, "radius": 20, "color" : "purple" }];
        nextcolC.append("g").attr("transform","matrix(1,0,0," + symbolProportion + ",0," + columnFloorLevel + ")").selectAll("circle").data(circleData).enter().append("circle");

        circleAttributes = nextcolC
                        .attr("cx", function (d) { return d.cx; })
                        .attr("cy", function (d) { return d.cy; })
                        .attr("r", function (d) { return d.radius; })
                        .style("fill", function (d) { return d.color; });
}

// drawPlot()
// create the group element which represents the entire plot (using scaling) and add all columns
CouplingsLogoDiagramD3.prototype.drawPlot = function(svg, options, bounds, xScale, yScale) {
        var self = this;
        if (this.rawData == null) {return;}
        var columnCount = self.seqLen;
        if (columnCount == 0) {return;}
        plotGroup = svg.append("g").attr("transform","matrix(" + ((this.options.elementWidth) / columnCount / 100) + ",0,0," + (this.options.elementHeight / 100) + ",0,0)");
        var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"]; // http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d
        for (var col = 0; col < this.rawData.A.length && col < colors.length; col++) {
//                this.addColumnToPlot(plotGroup, options, this.rawData.A[col], this.rawData.B[col], symbolCodes[col]);

            var circleDataA = [ { "cx": -60, "cy": 50, "radius": 40, "color" : colors[col] } ];
            var circleDataB = [ { "cx": -55, "cy": 50, "radius": 40, "color" : colors[col] } ];

            //translate
            var trans1A = plotGroup.append("g").attr("transform","translate(" + (100 * this.rawData.A[col]) + ",0)");
            var trans1B = plotGroup.append("g").attr("transform","translate(" + (100 * this.rawData.B[col]) + ",0)");

            var circlesA = trans1A.selectAll("circle").data(circleDataA).enter().append("circle");
            var circlesB = trans1B.selectAll("circle").data(circleDataB).enter().append("circle");

            var circleAttributesA = circlesA.attr("cx", function (d) { return d.cx; }).attr("cy", function (d) { return d.cy; }).attr("r", function (d) { return d.radius; }).style("fill", function (d) { return d.color; });
            var circleAttributesB = circlesB.attr("cx", function (d) { return d.cx; }).attr("cy", function (d) { return d.cy; }).attr("r", function (d) { return d.radius; }).style("fill", function (d) { return d.color; });
            
        }
}


