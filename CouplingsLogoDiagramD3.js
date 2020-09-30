// CouplingsLogoDiagramD3.js
// This class generates a SVG image (via D3) representing couplings of residues within the sequence alignment.
// Constructor for the CouplingsLogoDiagramD3 class
// @param alignment A multiple sequence alignment
// @param options presentation and data processing / statistical options
class CouplingsLogoDiagramD3 {


  //##ROC##
  constructor(options, data, seqLen) {
    this.options = jQuery.extend(true, {},  options);
    // TODO: Currently dumping in the symColHash (normalized by alignment height) - but should be an integrated data model.
    this.rawData = data; // other class members
    this.svg = null;
    this.bounds = null;
    this.seqLen = seqLen;
    const defaultOpts = {
      elementId: 'couplingslogo', //html element Id to use as container
      elementWidth: 600, // desired width of the container
      elementHeight: 32, // desired height of the container
    };
  }

  // initDiagram()
  // constructs element in container from options and populates using drawDiagram()
  initDiagram() {
    this.svg = this.createSvg(d3.select('#' + this.options.elementId), this.options.elementWidth, this.options.elementHeight);
    this.drawDiagram(this.svg, this.bounds, this.options, this.rawData);
  }

  // createSVG()
  // constructs svg element using dimensions from options
  createSvg(container, width, height) {
    return container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'background-color:white');
  }

  // drawDiagram()
  // set up scaling and any labels, then call drawPlot
  drawDiagram(svg, bounds, options, derivedColumnProportions) {
    const xScale = null; //TODO implement
    const yScale = null; //TODO implement
    const finalBounds = null; //TODO implement
    this.drawPlot(svg, options, finalBounds, xScale, yScale);
  }

  // addcolumnToPlot()
  // given a plot group (g) element, add a column to it
  addColumnToPlot(plotGroup, options, columnIndexA, columnIndexB, symbolCode) {
    const nextcolA = plotGroup.append('g').attr('transform', 'translate(' + 100 * columnIndexA + ',0)');
    const nextcolB = plotGroup.append('g').attr('transform', 'translate(' + 100 * columnIndexB + ',0)');
    const nextcolC = plotGroup.append('g').attr('transform', 'translate(' + 100 * columnIndexB + ',0)');
    let columnFloorLevel = 100;
    const symbolProportion = 1;
    columnFloorLevel -= symbolProportion * 100;
    nextcolA
      .append('g')
      .attr('transform', 'matrix(1,0,0,' + symbolProportion + ',0,' + columnFloorLevel + ')')
      .append('use')
      .attr('xlink:href', '#' + symbolCode);
    nextcolB
      .append('g')
      .attr('transform', 'matrix(1,0,0,' + symbolProportion + ',0,' + columnFloorLevel + ')')
      .append('use')
      .attr('xlink:href', '#' + symbolCode);
    const circleData = [{ cx: 20, cy: 20, radius: 30, color: 'green' }, { cx: 70, cy: 70, radius: 20, color: 'purple' }];
    nextcolC
      .append('g')
      .attr('transform', 'matrix(1,0,0,' + symbolProportion + ',0,' + columnFloorLevel + ')')
      .selectAll('circle')
      .data(circleData)
      .enter()
      .append('circle');
    const circleAttributes = nextcolC
      .attr('cx', function(d) {
        return d.cx;
      })
      .attr('cy', function(d) {
        return d.cy;
      })
      .attr('r', function(d) {
        return d.radius;
      })
      .style('fill', function(d) {
        return d.color;
      });
  }

  // drawPlot()
  // Create the group element which represents the entire plot (using scaling) and add all columns.
  drawPlot(svg, options, bounds, xScale, yScale) {
    if (this.rawData == null) {
      return;
    }
    const columnCount = this.seqLen;
    if (columnCount === 0) {
      return;
    }
    this.plotGroup = svg
      .append('g')
      .attr(
        'transform',
        'matrix(' + this.options.elementWidth / columnCount / 100 + ',0,0,' + this.options.elementHeight / 100 + ',0,0)',
      );
    const colors = [
      '#3366cc',
      '#dc3912',
      '#ff9900',
      '#109618',
      '#990099',
      '#0099c6',
      '#dd4477',
      '#66aa00',
      '#b82e2e',
      '#316395',
      '#994499',
      '#22aa99',
      '#aaaa11',
      '#6633cc',
      '#e67300',
      '#8b0707',
      '#651067',
      '#329262',
      '#5574a6',
      '#3b3eac',
    ]; // http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d
    for (let col = 0; col < this.rawData.A.length && col < colors.length; col++) {
      // this.addColumnToPlot(plotGroup, options, this.rawData.A[col], this.rawData.B[col], symbolCodes[col]);
      const circleDataA = [{ cx: -60, cy: 50, radius: 40, color: colors[col] }];
      const circleDataB = [{ cx: -55, cy: 50, radius: 40, color: colors[col] }];
      // Translate.
      const trans1A = this.plotGroup.append('g').attr('transform', 'translate(' + 100 * this.rawData.A[col] + ',0)');
      const trans1B = this.plotGroup.append('g').attr('transform', 'translate(' + 100 * this.rawData.B[col] + ',0)');
      const circlesA = trans1A
        .selectAll('circle')
        .data(circleDataA)
        .enter()
        .append('circle');
      const circlesB = trans1B
        .selectAll('circle')
        .data(circleDataB)
        .enter()
        .append('circle');
      const circleAttributesA = circlesA
        .attr('cx', function(d) {
          return d.cx;
        })
        .attr('cy', function(d) {
          return d.cy;
        })
        .attr('r', function(d) {
          return d.radius;
        })
        .style('fill', function(d) {
          return d.color;
        });
      const circleAttributesB = circlesB
        .attr('cx', function(d) {
          return d.cx;
        })
        .attr('cy', function(d) {
          return d.cy;
        })
        .attr('r', function(d) {
          return d.radius;
        })
        .style('fill', function(d) {
          return d.color;
        });
    }
  }
}
