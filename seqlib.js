//
// multiple sequence alignment analysis and visualization library
// relies on jQuery, d3 and external css 'seqlib.css'
// written and maintained by Yevgeniy Antipin at Memorial Sloan Kettering Cancer Center, 2012
//
let nl = '\n';

function isset(a) {
  return typeof a !== 'undefined';
} // yay php

// prettier-ignore
let AA = {
  A: 0, C: 0, D: 0, E: 0,
  F: 0, G: 0, H: 0, I: 0,
  K: 0, L: 0, M: 0, N: 0,
  P: 0, Q: 0, R: 0, S: 0,
  T: 0, V: 0, W: 0, Y: 0,
  '-': 0,
};

// prettier-ignore
let aaclr = {
  defaultClasses:  {
    '.': 'gr', '-': 'gr', G: 'aag',  A: 'aaa',
    I: 'aai', V: 'aav', L: 'aal', M: 'aam', F: 'aaf',
    Y: 'aay', W: 'aaw', H: 'aah', C: 'aac', P: 'aap',
    K: 'aak', R: 'aar', D: 'aad', E: 'aae', Q: 'aaq',
    N: 'aan', S: 'aas', T: 'aat', B: 'aab', Z: 'aaz',
    X: 'aax', '?': 'c9', '*': 'c8',  U: 'aau',
  },
  // amino-acid coloring, colors defined in css
  mview: {
    '.': 'gr', '-': 'gr', G: 'c0',  A: 'c0',
    I: 'c0', V: 'c0', L: 'c0', M: 'c0', F: 'c1',
    Y: 'c1', W: 'c1', H: 'c1', C: 'c2', P: 'c3',
    K: 'c4', R: 'c4', D: 'c5', E: 'c5', Q: 'c6',
    N: 'c6', S: 'c7', T: 'c7', B: 'c8', Z: 'c8',
    X: 'c8', '?': 'c9', '*': 'c8',  U: 'bl',
  },
  multalin: {
    '.': 'gr', '-': 'gr', G: 'm1', A: 'bl',
    I: 'm0', V: 'bl', L: 'bl', M: 'bl', F: 'bl',
    Y: 'bl', W: 'm1', H: 'bl', C: 'm1', P: 'bl',
    K: 'bl', R: 'bl', D: 'bl', E: 'bl', Q: 'bl',
    N: 'm0', S: 'bl', T: 'bl', B: 'bl', Z: 'bl',
    X: 'bl', '?': 'bl', '*': 'bl', U: 'bl',
  },
  taylor: {
    '.': 'gr', '-': 'gr', A: 't0', R: 't1',
    N: 't2', D: 't3', C: 't4', Q: 't5', E: 't6',
    G: 't7', H: 't8', I: 't9', L: 't10', K: 't11',
    M: 't12', F: 't13', P: 't14', S: 't15', T: 't16',
    W: 't17', Y: 't18', V: 't19',
  },
  pcp: {
    '.': 'gr', '-': 'gr',
    R: 'pc1', H: 'pc1', K: 'pc1', D: 'pc2',
    E: 'pc2', S: 'pc3', T: 'pc3', N: 'pc3',
    Q: 'pc3', C: 'pc4', U: 'pc4', G: 'pc4',
    P: 'pc4', A: 'pc5', V: 'pc5', I: 'pc5',
    L: 'pc5', M: 'pc5', F: 'pc5', Y: 'pc5',
    W: 'pc5',
  },
  hydro: {
    F: 'm1', I: 'm1', W: 'm1', L: 'm1', V: 'm1',
    M: 'm1', // very hydrophobic
    Y: 'c1', C: 'c1',
    A: 'c1', // hydrohobic
    T: 'gr', H: 'gr', G: 'gr', S: 'gr',
    Q: 'gr', // neutral
    R: 'm0', K: 'm0', N: 'm0', E: 'm0', P: 'm0',
    D: 'm0', // hydrohpilic
  },
};

// hydrophobicity at ph 7' relative to Glycine
// source: http://www.sigmaaldrich.com/life-science/metabolomics/learning-center/amino-acid-reference-chart.html
// prettier-ignore
let AAhydro = {
  F: 100, I: 99, W: 97, L: 97, V: 76,
  M: 74, // very
  Y: 63, C: 49,
  A: 41, // hydrophobic
  T: 13,  H: 8, G: 0, S: -5,
  Q: -10, // neutral
  R: -14, K: -23, N: -28, E: -31, P: -46,
  D: -55, // hydrophilic
  max: 100,
  min: -55,
};

// Have to duplicate actual colors defined in CSS here because AFAIK there is no way
// to access UNATTACHED style and look into its properties! if you know how please drop me a line
// prettier-ignore
let aacolors = {
  mview: {
    G: '#33cc00',
    A: '#33cc00',
    I: '#33cc00',
    V: '#33cc00',
    L: '#33cc00',
    M: '#33cc00',
    F: '#009900',
    Y: '#009900',
    W: '#009900',
    H: '#009900',
    C: '#ffff00',
    P: '#33cc00',
    K: '#33cc00',
    R: '#cc0000',
    D: '#0033ff',
    E: '#0033ff',
    Q: '#6600cc',
    N: '#6600cc',
    S: '#0099ff',
    T: '#0099ff',
    B: '#666666',
    Z: '#666666',
    X: '#666666',
    U: '#000000'
  },
  clustal:{
    G: '#f09048',
    A: '#80a0f0',
    I: '#80a0f0',
    V: '#80a0f0',
    L: '#80a0f0',
    M: '#80a0f0',
    F: '#80a0f0',
    Y: '#15a4a4',
    W: '#80a0f0',
    H: '#15a4a4',
    C: '#f08080',
    P: '#c0c000',
    K: '#f01505',
    R: '#f01505',
    D: '#c048c0',
    E: '#c048c0',
    Q: '#15c015',
    N: '#15c015',
    S: '#15c015',
    T: '#15c015',
    B: '#666666',
    Z: '#666666',
    X: '#666666',
    U: '#000000',
  },
};

$.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());

function getResidColor(style, aa) {
  if (!aacolors.hasOwnProperty(style)) {
    return '';
  }
  return aacolors[style][aa];
}

// hydrophobic - red, hydrophilic - blue
function getResidHydroColor(aa) {
  if (!AAhydro.hasOwnProperty(aa)) {
    return '';
  }
  const h = AAhydro[aa];
  const c = 255 - h > 0 ? Math.floor((255 * h) / AAhydro.max) : Math.floor((255 * h) / AAhydro.min);
  let q = c.toString(16);
  q = (c < 16 ? '0' : '') + q;
  if (h > 0) {
    return '#ff' + q + q;
  }
  return '#' + q + q + 'ff';
}

function getBioLink(type, id, text) {
  switch (type) {
    case 'uniprot':
      return "<a href='http://www.uniprot.org/uniprot/" + id + "' target='_blank'>" + text + '</a>';
      break;
    case 'pfam':
      return "<a href='http://pfam.xfam.org/protein/" + id + "' target='_blank'>" + text + '</a>';
      break;
    default:
      return '';
  }
}

/**
 * Parses sequence name.
 * Sequence name is assumed to be Uniprot in PFam or HHblits format.
 * Text after first space considered annotation and not part of sequence name in msa.
 *
 * Example Formats:
 *   - Pfam: EGFR_HUMAN/712-968
 *   - HHblits:	tr|F4CCT7|F4CCT7_SPHS2 NAD(P)H-quinone oxidoreductase subunit 2 ....
 *
 * @param {*} sequenceIdLine
 * @returns Object with 8 members :
 * - seq.name
 * - html <a href> (if uniprot name is detected)
 * - uniprot organism suffix
 * - protein region _from_
 * - protein region _to_
 * - uniprot organism code
 * - any text after ID
 * - link to Pfam page
 */
function ParseSeqName(sequenceIdLine) {
  let info = '';
  let sequenceId = sequenceIdLine;
  const spaceIndex = sequenceIdLine.indexOf(' ');
  if (spaceIndex !== -1) {
    info = sequenceIdLine.substr(spaceIndex + 1);
    sequenceId = sequenceIdLine.substr(0, spaceIndex); // name is seq.name before first space
  }
  let slashFrom = 1;
  let slashTo = 0;
  const slashSplit = sequenceId.split('/');
  if (slashSplit.length > 2) {
    //unrecognized format: excessive slashes
    return { name: sequenceId, link: sequenceId, org: '', from: slashFrom, to: slashTo, info: info, pfam: '' };
  }
  if (slashSplit.length === 2) {
    // slash notation, such as in pfam alignments : EGFR_HUMAN/712-968
    const dashSplit = slashSplit[1].split('-');
    if (dashSplit.length === 2) {
      slashFrom = parseInt(dashSplit[0], 10);
      slashTo = parseInt(dashSplit[1], 10);
      if (isNaN(slashFrom) || isNaN(slashTo)) {
        slashFrom = 1;
        slashTo = 0;
      }
    }
  }
  const fullSequenceId = slashSplit[0];
  const barSplit = fullSequenceId.split('|');
  const basicSequenceId = barSplit[barSplit.length - 1];
  // Split the last part of the ID such as with sp|P01112|RASH_HUMAN ... split is {'RASH' , 'HUMAN'}
  const underscoreSplit = basicSequenceId.split('_');
  const idStem = underscoreSplit[0];
  const idSpecies = underscoreSplit[1];
  const idIsUniprot =
    underscoreSplit.length === 2 &&
    idSpecies.length > 2 &&
    idSpecies.length < 6 &&
    ((idStem.length > 0 && idStem.length < 7) || idStem.length === 10);
  if (idIsUniprot) {
    const uniprotLinkField =
      getBioLink('uniprot', basicSequenceId, fullSequenceId) + (slashSplit.length === 2 ? '/' + slashSplit[1] : '');
    const pfamLinkField = getBioLink('pfam', basicSequenceId, 'pfam');
    return {
      name: sequenceId,
      link: uniprotLinkField,
      org: idSpecies,
      from: slashFrom,
      to: slashTo,
      info: info,
      pfam: pfamLinkField,
    };
  } else {
    return { name: sequenceId, link: sequenceId, org: '', from: slashFrom, to: slashTo, info: info, pfam: '' };
  }
}
function cri(v) {
  return Math.floor(v) + 0.5;
} // crisp shape edges in Raphael -- except for paths!
function mf(v) {
  return Math.floor(v);
}
function fillinc(ary, len) {
  for (let p = 0; p < len; p++) {
    ary.push(p);
  }
} // make sure ary is an empty array before calling
function getBox(w, h, margin) {
  return { l: margin, t: margin, r: w - margin, b: h - margin, w: w - 2 * margin, h: h - 2 * margin };
}
function getRange(from, to, steps) {
  return { from: from, to: to, steps: steps, w: to - from };
}
function getRangeUpdate() {
  return {
    min: 1e6,
    max: -1e6,
    width: 0,
    update: function(v) {
      if (v > this.max) {
        this.max = v;
      }
      if (v < this.min) {
        this.min = v;
      }
      this.width = this.max - this.min;
    },
  };
}
function sort(values, indices) {
  // sort by values and maintain indices in parallel order
  if (values.length !== indices.length) {
    return false;
  }
  const l = new Array();
  for (let k = 0; k < values.length; k++) {
    l.push({ v: values[k], i: indices[k] });
  }
  l.sort(function(a, b) {
    return b.v - a.v;
  });
  values = new Array();
  indices = new Array();
  for (let k = 0; k < l.length; k++) {
    values.push(l[k].v);
    indices.push(l[k].i);
  }
  return true;
}
function createMsaImageCanvas(div, canvas) {
  return {
    div: div,
    ca: canvas,
    init: function(rw, rh, msaw, msah) {
      // residue w x h in pixels, msa dimensions w x h)
      this.rw = rw;
      this.rh = rh;
      this.msaw = msaw;
      this.msah = msah;
      this.w = rw * msaw;
      this.h = rh * msah;
      this.ca.width = this.div.width = this.w;
      this.ca.height = this.div.height = this.h;
      this.ca.clearRect(0, 0, this.w, this.h);
    },
    clear: function() {
      this.ca.clearRect(0, 0, this.w, this.h);
    },
    paintCell: function(x, y, color) {
      // x,y zero based
      this.ca.fillStyle = color;
      this.ca.fillRect(this.rw * x, this.rh * y, this.rw, this.rh);
    },
  };
}

function createPairwiseMapCanvas(canvas) {
  return {
    ca: canvas,
    // square bitmap w pixels width and height
    initMap: function(w, nsamples) {
      this.w = w;
      this.n = nsamples;
      this.d = w / nsamples;
    },
    clear: function() {
      this.ca.clearRect(0, 0, this.w, this.w);
    },
    paintCell: function(i, j, color) {
      this.ca.fillStyle = color;
      this.ca.fillRect(this.d * i, this.d * j, this.d, this.d);
    },
  };
}

function createPlot() {
  return {
    d3plotselect: {},
    box: { l: 0, t: 0, r: 0, b: 0, w: 0, h: 0 }, // internal plot bbox
    rx: { from: 0, to: 0, steps: 0, w: 0 },
    ry: { from: 0, to: 0, steps: 0, w: 0 }, // range objects
    wx: 0,
    wy: 0, // grid steps in pixels
    sx: 0,
    sy: 0, // grid steps in specified range space
    // initialize and draw grid for regular plot
    // gridsty -- style name

    /**
     * @param {{ from: number, to: number, steps: number, w: number }} rangeX
     * @param {{ from: number, to: number, steps: number, w: number }} rangeY
     */
    drawGrid: function(d3plotselect, w, h, rangeX, rangeY, color) {
      const mrg = 40; // margin
      this.d3plotselect = d3plotselect;
      this.box = getBox(w, h, mrg);
      this.rx = rangeX;
      this.ry = rangeY;
      this.wx = this.box.w / this.rx.steps;
      this.wy = this.box.h / this.ry.steps;
      let pstr = '';
      this.sx = (this.rx.to - this.rx.from) / this.rx.steps;
      for (let x = 0; x <= this.rx.steps; x++) {
        const xr = (this.rx.from + this.sx * x).toFixed(0);
        const xp = mf(this.box.l + x * this.wx);
        pstr += 'M' + xp + ' ' + this.box.t + 'L' + xp + ' ' + this.box.b;
        this.d3plotselect
          .append('text')
          .attr('x', xp)
          .attr('y', this.box.b + 10)
          .attr('font-size', '10px')
          .attr('fill', 'black')
          .text(xr);
          
        //##ROC#
        if (x == 5){
                this.d3plotselect
                  .append('text')
                  .attr('x', xp-110)
                  .attr('y', this.box.b + 30)
                  .attr('font-size', '12px')
                  .attr('fill', 'black')
                  .text("Sequence number (sorted in descending order)");
        }
      }
      this.sy = (this.ry.to - this.ry.from) / this.ry.steps;
      for (let y = 0; y <= this.ry.steps; y++) {
        const yr = (this.ry.from + this.sy * y).toFixed(1);
        const yp = this.box.b - y * this.wy;
        pstr += 'M' + this.box.l + ' ' + yp + 'L' + this.box.r + ' ' + yp;
        // weird? you bet! i have no idea why text is shifting in chrome... 2014_02_26: not shifting with d3 apparently
        // if ($.browser.chrome) yp /= 2;
        this.d3plotselect
          .append('text')
          .attr('x', this.box.l - 5)
          .attr('y', yp + 2)
          .attr('font-size', '10px')
          .attr('fill', 'black')
          .attr('text-anchor', 'end')
          .text(yr);
        
        //##ROC#
        if (y == 10){
          this.d3plotselect
            .append('text')
            .attr('x', -150)
            .attr('y', 10 )
            .attr('font-size', '12px')
            .attr('fill', 'black')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-90)')
            .text('Fraction');
        }


      }
      this.d3plotselect
        .append('path')
        .attr('d', pstr)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', ['. ']);
    },
    // ary is normal ary or its items could be objects { i:index, v:value }
    addCurve: function(color, width, ary) {
      if (ary.length < 1) {
        return;
      }
      const vQ = isset(ary[0].v);
      let path = '';
      const sx = this.box.w / (ary.length - 1);
      for (let i = 0; i < ary.length; i++) {
        const v = vQ ? ary[i].v : ary[i];
        const x = this.box.l + sx * i;
        const f = (v - this.ry.from) / this.ry.w;
        const y = this.box.b - this.box.h * v;
        path += (i ? 'L' : 'M') + x + ' ' + y;
      }
      this.d3plotselect
        .append('path')
        .attr('d', path)
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr('stroke-linecap', 'round')
        .attr('fill', 'none');
    },
  };
}

// ---------- d3 force graph -----------------------------------------------------------------------
function createForceGraph() {
  return {
    w: 700,
    h: 700,
    node: {},
    link: {},
    vis: {},
    force: {},
    Q: false,
    linkdist: { min: 10, max: 100 },
    gra: { links: new Array(), nodes: new Array() }, // reference to user graph
    sampleGraph: {
      nodes: [{}, {}, {}, {}],
      links: [{ source: 0, target: 1, value: 0.2 }, { source: 0, target: 2, value: 0.5 }, { source: 0, target: 3, value: 1 }],
    },
    init: function(divID, w, h, gra) {
      this.w = w;
      this.h = h;
      this.gra = gra ? gra : this.sampleGraph;
      if (!this.Q) {
        this.vis = d3
          .select(divID)
          .append('svg:svg')
          .attr('width', this.w)
          .attr('height', this.h);
        this.force = d3.layout
          .force()
          .on('tick', $.proxy(this.tick, this))
          .size([this.w, this.h]);
        this.Q = true;
      }

      this.force.linkdist = this.linkdist; // so linkDistance() callback can access
      this.linkdist.w = this.linkdist.max - this.linkdist.min;
      this.update();
    },
    clear: function() {
      if (!this.Q) {
        return;
      }
      this.gra.nodes = new Array();
      this.gra.links = new Array();
      this.update();
    },
    update: function() {
      const nodes = this.gra.nodes;
      const links = this.gra.links;
      this.force
        .linkDistance(d => {
          return this.linkdist.min + this.linkdist.w * d.value;
        })
        .nodes(nodes)
        .links(links)
        .start();
      // update the links
      this.link = this.vis.selectAll('line.link').data(links, function(d) {
        return d.target.id;
      });
      // enter any new links
      this.link
        .enter()
        .insert('svg:line', '.node')
        .attr('class', 'link')
        .attr('x1', function(d) {
          return d.source.x;
        })
        .attr('y1', function(d) {
          return d.source.y;
        })
        .attr('x2', function(d) {
          return d.target.x;
        })
        .attr('y2', function(d) {
          return d.target.y;
        });
      // exit any old links
      this.link.exit().remove();
      // update the nodes
      this.node = this.vis
        .selectAll('circle.node')
        .data(nodes, function(d) {
          return d.id;
        })
        .style('fill', this.color); // $.proxy(this.color, this)
      // enter any new nodes
      this.node
        .enter()
        .append('svg:circle')
        .attr('class', 'node')
        .attr('cx', function(d) {
          return d.x;
        })
        .attr('cy', function(d) {
          return d.y;
        })
        .attr('r', function(d) {
          return Math.sqrt(d.size) / 10 || 4.5;
        })
        .style('fill', this.color)
        .on('click', this.click)
        .call(this.force.drag);
      // exit any old nodes
      this.node.exit().remove();
    },
    color: function(d) {
      return d._children ? '#3182bd' : d.children ? '#c6dbef' : '#fd8d3c';
    },
    tick: function() {
      this.link
        .attr('x1', function(d) {
          return d.source.x;
        })
        .attr('y1', function(d) {
          return d.source.y;
        })
        .attr('x2', function(d) {
          return d.target.x;
        })
        .attr('y2', function(d) {
          return d.target.y;
        });
      this.node
        .attr('cx', function(d) {
          return d.x;
        })
        .attr('cy', function(d) {
          return d.y;
        });
    },
    // toggle children on click... or not
    click: function(d) {
      /*
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		this.update();	*/
    },
  };
}
// ---------- kMins clustering ----- work in progress -------------------------------------------------------
function testkMinsClustering() {
  const Nclu = 4;
  const data = [1, 2, 3, 7, 8, 9];
  const kmc = new KMinsClustering();
  kmc.runAllIterations(Nclu, data);
  console.log('------- FINAL ------------');
  console.log(kmc.getClusteringStr());
}
