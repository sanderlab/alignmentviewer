// SequenceLogoDiagramD3.js
// This class generates a SVG image (via D3) representing stacks of amino acid residue codes for a sequence alignment.

// Constructor for the SequenceLogoDiagramD3 class
// @param alignment A multiple sequence alignment
// @param options presentation and data processing / statistical options
function SequenceLogoDiagramD3(options, data) {
  var self = this;
  self.options = jQuery.extend(true, {}, self.defaultOpts, options);
  self.rawData = data; //TODO: currently dumping in the symColHash (normalized by alignment height) .. but should be an integrated data model
  // other class members
  self.svg = null;
  self.bounds = null;
  self.derivedColumnProportions = null;
}

// Default Options
SequenceLogoDiagramD3.prototype.defaultOpts = {
  elementId: 'seqlogo', //html element Id to use as container
  elementWidth: 600, // desired width of the container
  elementHeight: 32, // desired height of the container
};

// deriveColummProportions()
// sorts amino acid prevalence into descending order for all columns
// Returns an array containing one array per column. Each element in a column array is a two element array containing [residue_code, normalized_proportion] such as ["P", .2115].
SequenceLogoDiagramD3.prototype.deriveColumnProportions = function() {
  var self = this;
  var returnValue = [];
  var columnCount = self.rawData.length;
  for (var col = 0; col < columnCount; col++) {
    returnValue.push([]);
    var returnCol = returnValue[col];
    for (var key in self.rawData[col]) {
      returnCol.push([key, self.rawData[col][key]]);
    }
    returnCol.sort(function(a, b) {
      return b[1] - a[1];
    });
  }
  return returnValue;
};

// initDiagram()
// constructs element in container from options and populates using drawDiagram()
SequenceLogoDiagramD3.prototype.initDiagram = function() {
  var self = this;
  self.derivedColumnProportions = self.deriveColumnProportions();
  self.svg = self.createSvg(
    d3.select('#' + self.options.elementId),
    self.options.elementWidth,
    self.options.elementHeight,
  );
  self.drawDiagram(self.svg, self.bounds, self.options, self.derivedColumnProportions);
};

// createSVG()
// constructs svg element using dimensions from options
SequenceLogoDiagramD3.prototype.createSvg = function(container, width, height) {
  return container
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'background-color:white');
};

// drawDiagram()
// set up scaling and any labels, then call drawPlot
SequenceLogoDiagramD3.prototype.drawDiagram = function(svg, bounds, options, derivedColumnProportions) {
  var self = this;
  var xScale = null; //TODO implement
  var yScale = null; //TODO implement
  var bounds = null; //TODO implement
  this.drawPlot(svg, options, bounds, xScale, yScale);
};

// addSymbolDefinitionsToPlot
// adds defs section with svg paths for letter shapes
SequenceLogoDiagramD3.prototype.addSymbolDefinitionsToPlot = function(svg) {
  var self = this;
  defs = svg.append('defs');
  defs
    .append('path')
    .attr('id', 'A')
    .attr('d', 'M 10 99 L 45 0 h 10 L 90 99 h -18 L 66 80 h -32 L 28 99 Z M 40 60 h 20 L 50 30 Z')
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'B')
    .attr(
      'd',
      'M 10 99 v -99 h 50 A 25,25 0 0,1 75,50 A 25,25 0 0,1 60,99 Z M 25 31 v 10 h 35 A 15,11 0 0,0 60,15 h -35 Z M 25 75 v 10 h 35 A 15,11 0 0,0 60,60 h -35 Z',
    )
    .attr('class', 'c8');
  defs
    .append('path')
    .attr('id', 'C')
    .attr(
      'd',
      'M 10 50 v -15 A 46,46 0 0,1 85,12 L 72 25 A 31,31 0 0,0 25,40 v 25 A 31,31 0 0,0 72,75 L 85 88 A 46,46 0 0,1 10,70 Z',
    )
    .attr('class', 'c3');
  defs
    .append('path')
    .attr('id', 'D')
    .attr('d', 'M 10 99 v -99 h 40 A 20,25 0 0,1 50,99 Z M 25 20 v 60 h 10 A 18,17 0 0,0 35,20 Z')
    .attr('class', 'c5');
  defs
    .append('path')
    .attr('id', 'E')
    .attr('d', 'M 10 99 v -99 h 80 v 20 h -65 v 20 h 65 v 20 h -65 v 20 h 65 v 19 Z')
    .attr('class', 'c5');
  defs
    .append('path')
    .attr('id', 'F')
    .attr('d', 'M 10 99 v -99 h 80 v 20 h -65 v 20 h 55 v 20 h -55 v 39 Z')
    .attr('class', 'c2');
  defs
    .append('path')
    .attr('id', 'G')
    .attr(
      'd',
      'M 10 50 v -15 A 46,46 0 0,1 85,12 L 72 25 A 31,31 0 0,0 25,40 v 25 A 28,28 0 0,0 75,60 h -20 v -20 h 35 v 20 A 41,41 0 0,1 10,70 Z',
    )
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'H')
    .attr('d', 'M 10 99 v -99 h 15 v 40 h 50 v -40 h 15 v 99 h -15 v -40 h -50 v 40 Z')
    .attr('class', 'c2');
  defs
    .append('path')
    .attr('id', 'I')
    .attr('d', 'M 25 99 v -19 h 17 v -60 h -17 v -20 h 50 v 20 h -17 v 60 h 17 v 19 Z')
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'J')
    .attr('d', 'M 57 50 v -30 h -17 v -20 h 50 v 20 h -17 v 30 A 0.6,1 0 0,1 15,50 h 15 A 0.5,1 0 0,0 57,50 Z')
    .attr('class', 'c8');
  defs
    .append('path')
    .attr('id', 'K')
    .attr('d', 'M 10 99 v -99 h 15 v 40 L 70 0 h 20 L 35 50 L 85 99 h -20 L 25 60 v 39 Z')
    .attr('class', 'c4');
  defs
    .append('path')
    .attr('id', 'L')
    .attr('d', 'M 10 99 v -99 h 15 v 80 h 65 v 19 Z')
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'M')
    .attr('d', 'M 10 99 L 22 0 h 17 L 50 70 L 61 0 h 17 L 90 99 h -15 L 69 30 L 60 99 h -20 L 31 30 L 25 99 Z')
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'N')
    .attr('d', 'M 10 99 v -99 h 20 L 75 70 v -70 h 15 v 99 h -20 L 25 30 v 70 Z')
    .attr('class', 'c6');
  defs
    .append('path')
    .attr('id', 'O')
    .attr(
      'd',
      'M 10 40 A 15,15 0 0,1 90 40 v 20 A 15,15 0 0,1 10 60 Z M 25 60 A 10,10 0 0,0 75,60 v -20 A 10,10 0 0,0 25,40 Z',
    )
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'P')
    .attr('d', 'M 10 99 v -99 h 55 A 12,15 0 0,1 65 60 h -40 v 40 Z M 25 20 v 20 h 35 A 15,11 0 0,0 60,20 h -35 Z')
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'Q')
    .attr(
      'd',
      'M 10 40 A 15,15 0 0,1 90 40 v 20 A 15,15 0 0,1 10 60 Z M 25 60 A 10,10 0 0,0 75,60 v -20 A 10,10 0 0,0 25,40 Z M 65 65 l 30 25 l -15 9 l -30 -24 Z',
    )
    .attr('class', 'c6');
  defs
    .append('path')
    .attr('id', 'R')
    .attr(
      'd',
      'M 10 99 v -99 h 55 A 12,15 0 0,1 65 60 h -15 L 90 99 h -23 L 30 65 h -5 v 34 Z M 25 20 v 20 h 35 A 15,11 0 0,0 60,20 h -35 Z',
    )
    .attr('class', 'c4');
  defs
    .append('path')
    .attr('id', 'S')
    .attr(
      'd',
      'M 10 78 l 15 -12 A 8,5 0 0,0 65 63 l -48 -12 A 8,7 0 0,1 90 22 l -15 12 A 8,5 0 0,0 35 37 l 48 12 A 8,7 0 0,1 10 78 Z',
    )
    .attr('class', 'c7');
  defs
    .append('path')
    .attr('id', 'T')
    .attr('d', 'M 43 99 v -79 h -33 v -20 h 80 v 20 h -33 v 79 Z')
    .attr('class', 'c7');
  defs
    .append('path')
    .attr('id', 'U')
    .attr('d', 'M 10 0 h 15 v 50 A 15,15 0 0,0 75 50 v -50 h 15 v 50 A 12,15 0 0,1 10 50 Z')
    .attr('class', 'c9');
  defs
    .append('path')
    .attr('id', 'V')
    .attr('d', 'M 10 0 h 18 L 50 68 L 72 0 h 18 L 60 99 h -20 Z')
    .attr('class', 'c1');
  defs
    .append('path')
    .attr('id', 'W')
    .attr('d', 'M 10 0 L 22 99 h 17 L 50 30 L 61 99 h 17 L 90 0 h -15 L 69 70 L 60 0 h -20 L 31 70 L 25 0 Z')
    .attr('class', 'c2');
  defs
    .append('path')
    .attr('id', 'X')
    .attr('d', 'M 10 0 h 18 L 50 40 L 72 0 h 18 L 59 50 L 90 99 h -18 L 50 60 L 28 99 h -18 L 41 50 Z')
    .attr('class', 'c8');
  defs
    .append('path')
    .attr('id', 'Y')
    .attr('d', 'M 10 0 h 18 L 50 40 L 72 0 h 18 L 58 55 v 44 h -16 v -44 Z')
    .attr('class', 'c2');
  defs
    .append('path')
    .attr('id', 'Z')
    .attr('d', 'M 10 20 v -20 h 80 v 20 L 28 80 h 62 v 19 h -80 v -19 L 72 20 Z')
    .attr('class', 'c8');
};

// addcolumnToPlot()
// given a plot group (g) element, add a column to it
SequenceLogoDiagramD3.prototype.addColumnToPlot = function(plotGroup, options, columnIndex) {
  var self = this;
  var columnProportionArray = this.derivedColumnProportions[columnIndex];
  if (columnProportionArray == null || columnProportionArray.length == 0) {
    return;
  }
  nextcol = plotGroup.append('g').attr('transform', 'translate(' + 100 * columnIndex + ',0)');
  var columnFloorLevel = 100;
  for (var i = columnProportionArray.length - 1; i >= 0; i--) {
    var nextSymbolSpec = columnProportionArray[i];
    var symbolCode = nextSymbolSpec[0];
    if (symbolCode != symbolCode.toUpperCase(symbolCode)) {
      continue;
    } //ignore lower case letters
    var symbolProportion = nextSymbolSpec[1];
    columnFloorLevel -= symbolProportion * 100;
    nextcol
      .append('g')
      .attr('transform', 'matrix(1,0,0,' + symbolProportion + ',0,' + columnFloorLevel + ')')
      .append('use')
      .attr('xlink:href', '#' + symbolCode);
  }
};

// drawPlot()
// create the group element which represents the entire plot (using scaling) and add all columns
SequenceLogoDiagramD3.prototype.drawPlot = function(svg, options, bounds, xScale, yScale) {
  var self = this;
  if (this.derivedColumnProportions == null) {
    return;
  }
  this.addSymbolDefinitionsToPlot(svg);
  var columnCount = this.derivedColumnProportions.length;
  if (columnCount == 0) {
    return;
  }
  plotGroup = svg
    .append('g')
    .attr(
      'transform',
      'matrix(' + this.options.elementWidth / columnCount / 100 + ',0,0,' + this.options.elementHeight / 100 + ',0,0)',
    );
  for (var col = 0; col < this.derivedColumnProportions.length; col++) {
    this.addColumnToPlot(plotGroup, options, col);
  }
};
