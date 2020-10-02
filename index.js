let msa = new MultipleSequenceAlignment(); // msa obj created by seqlib.js
let prevMsa = new MultipleSequenceAlignment();
let msaTextblockWidth;
let d3StatsPlots;
let d3PairwiseIdentityPlot;
let d3fg; // d3 force-directed graph
let pwGraph; // pairwise identity graph object
let pwMap; // pairwise map plot object
let pwMapNSeq;
let msaImage;
let msaImgColorType = 1; // 1:mview, 2:hydrophobicity, 3:mutations
let drawImageNSeq;
let asyncTimeout = 2; // ms
let msaImageTimeout = 1; //original at 10
let colorSliderDflt = 0;
let imageSliderDflt = { w: 4, h: 4 };
let filterGaps = 100; // default filtering values (=no filtering)
let filterIdent = 0;
let filterRSgaps = false;
let msaPage = 0;
let firstSequence = '';

// Read URL query parameters
let getUrlParameter = function(sParam) {
  const sPageURL = window.location.search.substring(1);
  const sURLVariables = sPageURL.split('&');
  let sParameterName = new Array();
  for (let i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
};

let btn2view = {
  btn1: '#ABTview',
  btn2: '#MSAview',
  btn3: '#STAview',
  btn4: '#IMGview',
  btn5: '#DATview',
  btn6: '#SPEview',
  btn7: '#couplings',
  btn8: '#UMAPview',
  link1: '#DATview',
};

$(document).ready(function() {
  // some say this works for FF and Chrome only so we're providing FILE input control as well
  document.documentElement.ondragover = function() {
    return false;
  };
  document.documentElement.ondragend = function() {
    return false;
  };
  document.documentElement.ondrop = handleFileSelect;
  const fileInput = document.getElementById('files');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect, false);
  }

  const weightFileInput = document.getElementById('customdata');
  if (weightFileInput) {
    weightFileInput.addEventListener('change', handleCustomFileSelect, false);
  }

  const couplingFileInput = document.getElementById('customdata2');
  if (couplingFileInput) {
    couplingFileInput.addEventListener('change', handleCustomFileSelectCouplings, false);
  }

  // on-click computing pair-wise identity
  $('#pairwise_start_btn').click(function(event) {
    msa.togglePairwiseIdentity();
  });

  const grapthSliderDflt = 0.7;
  $('#graphSlider').slider({
    max: 1,
    min: 0,
    step: 0.01,
    value: grapthSliderDflt,
    slide: function(event, ui) {
      $('#graphSliderVal').html(ui.value ? ui.value.toString() : '');
    },
  });
  $('#graphSliderVal').html(grapthSliderDflt.toString());

  // --- jQuery is awesome -------------
  $('[id^=btn]').click(function(event) {
    const view = btn2view[event.target.id]; // button id --> view id
    if ($(view).is(':visible')) {
      return;
    } // already active, do nothing
    $('[id$=view]')
      .not(view)
      .hide(); // select all views except current, hide
    $(view).show(); // show current
    $(event.target)
      .removeClass('btnReleased')
      .addClass('btnPressed');
    $('[id^=btn]')
      .not(event.target)
      .removeClass('btnPressed')
      .addClass('btnReleased');
  });

  $('#order').change(reloadMSA);

  $('#graphApply')
    .button()
    .click(function() {
      if (d3fg) {
        d3fg.clear();
      }
      initForceGraph();
    })
    .prop('disabled', false)
    .button('refresh');

  $('#graphClear')
    .button()
    .click(function() {
      if (d3fg) {
        d3fg.clear();
      }
    })
    .prop('disabled', false)
    .button('refresh');

  $('#colorSlider').slider({
    max: 1,
    min: 0,
    step: 0.01,
    value: colorSliderDflt,
    slide: function(event, ui) {
      $('#colorSliderVal').html(ui.value ? ui.value.toString() : '');
      msa.setColorThresh(ui.value);
    },
  });
  $('#colorSliderVal').html(colorSliderDflt.toString());
  $('#colorApply')
    .button()
    .click(reloadMSA);

  // --- filtering --------------------------

  $('#sliderFilterIdent').slider({
    max: 100,
    min: 0,
    step: 1,
    value: filterIdent,
    slide: function(event, ui) {
      $('#sliderFilterIdentVal').html(ui.value + '%');
    },
  });
  $('#sliderFilterIdentVal').html(filterIdent + '%');

  $('#sliderFilterGaps').slider({
    max: 100,
    min: 0,
    step: 1,
    value: filterGaps,
    slide: function(event, ui) {
      $('#sliderFilterGapsVal').html(ui.value + '%');
    },
  });
  $('#sliderFilterGapsVal').html(filterGaps + '%');

  // https://www.w3schools.com/tags/att_input_checked.asp
  $('#CHKrfgaps').removeAttr('checked');

  $('#filterStatus').html('');
  $('#filterApply')
    .button()
    .click(function() {
      filterGaps = $('#sliderFilterGaps').slider('option', 'value');
      filterIdent = $('#sliderFilterIdent').slider('option', 'value');
      filterRSgaps = $('#CHKrfgaps').is(':checked');
      const orderby = $('#order').val();
      msa.reRender(msaPage, orderby, filterGaps, filterIdent, filterRSgaps);
    });
  $('#filterExport')
    .button()
    .click(function() {
      const valGaps = $('#sliderFilterGaps').slider('option', 'value');
      const valIdent = $('#sliderFilterIdent').slider('option', 'value');
      const varRSgaps = $('#CHKrfgaps').is(':checked');
      msa.applyExport(valGaps, valIdent, false);
    });

  // image view controls -----------------------
  $('#imageApply')
    .button()
    .click(drawMsaImage);
  $('#imageResidWSlider').slider({
    max: 10,
    min: 1,
    step: 1,
    value: imageSliderDflt.w,
    slide: function(event, ui) {
      $('#imageResidW').html(ui.value ? ui.value.toString() : '');
    },
  });
  $('#imageResidW').html(imageSliderDflt.w.toString());
  $('#imageResidHSlider').slider({
    max: 10,
    min: 1,
    step: 1,
    value: imageSliderDflt.h,
    slide: function(event, ui) {
      $('#imageResidH').html(ui.value ? ui.value.toString() : '');
    },
  });
  $('#imageResidH').html(imageSliderDflt.h.toString());

  // checkboxes to control annotation columns
  $('#CHKspecies').attr('checked', '');
  $('#CHKinfo').attr('checked', '');
  $('#CHKcustom').attr('checked', '');
  $('#CHKpfam').attr('checked', '');
  $('#CHKconservation').attr('checked', '');
  $('#CHKseqlogo').attr('checked', '');
  $('#CHKspecies').change(function() {
    $('[id^=MSAspecies]').toggle();
  });
  $('#CHKinfo').change(function() {
    $('[id^=MSAinfo]').toggle();
  });
  $('#CHKpfam').change(function() {
    $('[id^=MSApfam]').toggle();
  });
  $('#CHKcustom').change(function() {
    $('#MSAcustomA').toggle();
    $('#MSAcustomAH').toggle();
  });
  $('#CHKcustom').change(function() {
    $('#MSAcustomB').toggle();
    $('#MSAcustomBH').toggle();
  });
  $('#CHKconservation').change(function() {
    $('#labeled_plot_canvas').toggle();
  });
  $('#CHKseqlogo').change(function() {
    $('#seqlogo').toggle();
  });

  // Read MSA from URL
  const originURL = getUrlParameter('url');

  console.log(`originURL: ${originURL}`);

  if (originURL !== undefined && typeof originURL === 'string') {
    $('#progress')
      .show()
      .html('Fetching file...');
    $.get(originURL, function(data) {
      loadNewMSA(data);
    });
  }
});

// causes re-rendering of conservation_plot/ruler/msa sequence table
function forceMsaRerender() {
  // some web comments report that children must be rerendered explicitly rather than relying on cascade
  const plot_canvas = document.getElementById('plot_canvas');
  const seqlogo = document.getElementById('seqlogo');
  const ruler = document.getElementById('MSAruler');
  const seqs = document.getElementById('MSAseqs');
  const msatable = document.getElementById('MSAview');

  if (!plot_canvas || !seqlogo || !ruler || !seqs || !msatable) {
    return;
  }

  plot_canvas.style.display = 'none';
  seqlogo.style.display = 'none';
  ruler.style.display = 'none';
  seqs.style.display = 'none';
  plot_canvas.style.display = 'block';
  seqlogo.style.display = 'block';
  ruler.style.display = 'block';
  seqs.style.display = 'block';
  msatable.style.display = 'none';
  msatable.style.display = 'block';
}

// causes re-rendering of conservation plot and sequence logo if zoom causes change in MSA text width
function zoomEventWatchdog() {
  if (!$('#MSAview').is(':visible')) {
    return;
  }
  if (msaTextblockWidth === null) {
    return;
  }
  if (msaTextblockWidth === 0) {
    return;
  }
  const msaWidth = $('#MSAseqs').width();
  if (msaWidth && Math.abs(msaWidth - msaTextblockWidth) > 5) {
    //	console.log('logo width reset:' + msaTextblockWidth + ' ' + $('#MSAseqs').width() + ' mismatch');
    $('#seqlogo').html('');
    $('#plot_canvas').html('');
    forceMsaRerender();
    msaTextblockWidth = $('#MSAseqs').width();
    const alignmentData = msa.getNormalizedColumnProportions();
    msa.redrawConservationPlot('#plot_canvas', msaTextblockWidth);
    const logoDiagram = new SequenceLogoDiagramD3(
      { elementId: 'seqlogo', elementWidth: msaTextblockWidth, elementHeight: 48 },
      alignmentData,
    );
    logoDiagram.initDiagram();
  }
}

// This gets called on msa reload only!
function switchToMsaView() {
  // Clear entire msa html (12 divs) before switching to MSA view to avoid big pause for large alignments while old msa redraws.
  $('#MSAnames').html('');
  $('#MSAinfo').html('');
  $('#MSAcustomA').html('');
  $('#MSAcustomB').html('');
  $('#MSAspecies').html('');
  $('#MSApfam').html('');
  $('#MSAident1').html('');
  $('#MSAident2').html('');
  $('#MSAgaps').html('');
  $('#MSArows').html('');
  $('#MSArows2').html('');
  $('#plot_canvas').html('');
  $('#seqlogo').html('');
  $('#MSAruler').html('');
  $('#MSAseqs').html('');
  forceMsaRerender();
  $('#STAview').hide();
  $('#IMGview').hide();
  $('#ABTview').hide();
  $('#DATview').hide();
  $('#couplings').hide();
  $('#SPEview').hide();
  $('#UMAPview').hide();
  $('#MSAview').show();
  // TODO: doable with one wildcard selector
  $('#btn1')
    .removeClass('btnPressed')
    .addClass('btnReleased');
  $('#btn2')
    .removeClass('btnReleased')
    .addClass('btnPressed');
  $('#btn3')
    .removeClass('btnPressed')
    .addClass('btnReleased');
  $('#btn4')
    .removeClass('btnPressed')
    .addClass('btnReleased');
  $('#btn5')
    .removeClass('btnPressed')
    .addClass('btnReleased');
  $('#btn6')
    .removeClass('btnPressed')
    .addClass('btnReleased');
  $('#btn7')
    .removeClass('btnPressed')
    .addClass('btnReleased');
  $('#btn8')
    .removeClass('btnPressed')
    .addClass('btnReleased')
    .click(() => {
      LoadUMAP();
    });
  $('#link1').click(() => {
    // Shamelessly copying above jquery code.
    const view = btn2view['link1']; // button id --> view id
    if ($(view).is(':visible')) {
      return;
    } // already active, do nothing
    $('[id$=view]')
      .not(view)
      .hide(); // select all views except current, hide
    $(view).show(); // show current
    $('[id^=btn]')
      .removeClass('btnPressed')
      .addClass('btnReleased');
    $('#btn5')
      .removeClass('btnReleased')
      .addClass('btnPressed');
  });
}

// -------------------------------------------------------------------------- msa callbacks -------------
let msaCallback = {
  // msa reading callbacks

  progress: function(msg) {
    $('#progress').html(msg);
  },
  fail: function(msg) {
    $('#progress').html(msg);
  },
  doneReading: function(msg) {
    // msa fully parsed
    console.log('doneReading...');
    $('#MSAnames').html(msa.hnames);
    $('#MSAspecies').html(msa.hspecies);
    $('#MSAinfo').html(msa.hinfo);
    $('#MSAcustomA').html(msa.hcustomwA);
    $('#MSAcustomB').html(msa.hcustomwB);
    $('#MSApfam').html(msa.hpfam);
    $('#MSAident1').html(msa.hident1);
    $('#MSAident2').html(msa.hident2);
    $('#MSAgaps').html(msa.hgaps);
    $('#MSArows').html(msa.hrows);
    $('#MSArows2').html(msa.hrows2);
    $('#MSAseqs').html(msa.hseqs);
    $('#MSAruler').html(msa.hruler);
    $('#MSAview').show();
    msaTextblockWidth = null; // turn off zoom change watchdog
    if (msa.rerenderQ) {
      /*
                    // TODO: hiding gapping columns not working, comment out for now
                    //
                    // in case if msa width changes need to get a chance for dom to update before getting msa div width
                    setTimeout(function() {
                        var w = $('#MSAseqs').width();		// need to redraw plot in case columns got filtered out
                        msa.redrawConservationPlot('#plot_canvas', w);
                    }, 100);
                    */
      $('#progress').hide();
      return;
    }
    //	console.log('hnames=' + msa.hnames.length + ' hident=' + msa.hident1.length + ' hgaps=' + msa.hgaps.length +
    //				'hrows=' + msa.hrows.length + ' hseqs=' + msa.hseqs.length + ' hruler=' + msa.hruler.length);
    $('#progress').html('computing conservation...');
    setTimeout('msa.asyncComputeConservation()', msa.asyncTimeout);
    $('#buttons').show();
  },
  doneComputing: function(msg) {
    // top charts computed -- gaps and identity
    console.log('doneComputing .......');
    forceMsaRerender();
    msaTextblockWidth = $('#MSAseqs').width();
    const alignmentData = msa.getNormalizedColumnProportions();
    msa.redrawConservationPlot('#plot_canvas', msaTextblockWidth);
    const logoDiagram = new SequenceLogoDiagramD3(
      { elementId: 'seqlogo', elementWidth: msaTextblockWidth, elementHeight: 48 },
      alignmentData,
    );
    logoDiagram.initDiagram();
    setInterval(function() {
      zoomEventWatchdog();
    }, 1269);
    UpdateStatsPlot();
    UpdatePairwisePlot(); // this will clear pairwise plot on new msa loading
    resetMsaImage();
    UpdateSpeciesDiagram();
    if (msa.page.validQ) {
      $('#pagingCtrl').show();
      const np = msa.page.pages;
      const val = msa.page.getstr(msaPage) + ' out of ' + msa.h;
      // paging slider ------------------------------
      $('#sliderPage').slider({
        min: 1,
        max: np,
        step: 1,
        value: 1,
        slide: function(event, ui) {
          msaPage = ui.value ? ui.value - 1 : 0;
          const sliderPageVal = msa.page.getstr(msaPage) + ' out of ' + msa.h;
          $('#sliderPageVal').html(sliderPageVal);
        },
        stop: function(event, ui) {
          msaPage = ui.value ? ui.value - 1 : 0;
          reloadMSA();
        },
      });
      $('#sliderPageVal').html(val);
    } else {
      $('#pagingCtrl').hide();
    }
    $('#progress').hide();
  },
};

let msaPairwise = {
  // pairwise identity computation callback
  start: function() {
    $('#pairwise_status').html('');
    $('#pairwise_start_btn').html('cancel');
    $('#pairwise_start_btn').click(function(event) {
      $.proxy(msa.togglePairwiseIdentity, msa);
    });
  },
  progress: function(msg) {
    $('#pairwise_status').html(msg);
  },
  done: function(completeQ) {
    console.log(completeQ);
    if (completeQ) {
      $('#pairwise_start_btn').html('');
      const txt =
        "<b><span class='tc2'>max</span>/<span style='color:#f5a742'>average</span>/<span class='tc0'>min</span></b> (sorted by ranking)";
      $('#pairwise_status').html(txt);
      $('#MSApairwise').removeClass('plot_border');
      UpdatePairwisePlot();
    } else {
      $('#pairwise_status').html(' (takes a while for large alignments)');
      $('#pairwise_start_btn').html('calculate');
      $('#pairwise_start_btn').click(function(event) {
        $.proxy(msa.togglePairwiseIdentity, msa);
      });
    }
  },
};

// ---------------------------------------------------------- global UI functions ---------------------

function reloadMSA() {
  $('#progress')
    .show()
    .html('updating html...');
  const orderby = $('#order').val();
  msa.reRender(msaPage, orderby, filterGaps, filterIdent, filterRSgaps);
}

function loadNewMSA(data) {
  console.log('loadNewMSA');
  $('#progress')
    .show()
    .html('updating html...');
  switchToMsaView();
  $('#pairwise_start_btn').html('calculate');
  $('#pairwise_start_btn').click(function(event) {
    $.proxy(msa.togglePairwiseIdentity, msa);
  });
  $('#pairwise_status').html(' (takes a while for large alignments)');
  $('[id^=inp_]').val('');
  $('#MSApairwise').addClass('plot_border');
  $('#colorSliderVal').html(colorSliderDflt.toString());
  $('#colorSlider').slider('option', 'value', colorSliderDflt);
  $('#order').val('orderOrig');
  $('#customdata').val(''); // clear path in custom data file control
  $('#customdata2').val(''); // clear path in custom data file control
  $('#order option[value="orderCustomAW"]').remove(); // remove sorting option from msa order dropdown
  $('#order option[value="orderCustomBW"]').remove(); // remove sorting option from msa order dropdown
  $('#MSAcustomAH').text('');
  $('#MSAcustomBH').text('');

  //Remove If ##ROC##
  //if (!msa) {
  msa = new MultipleSequenceAlignment();
  //}
  msa.asyncRead(data, msaCallback, msaPairwise);
}

// --- pulling msa example from the server --------------------------------------------------------------

function PullMsaExample() {
  let url = '/example/1bkr_A.1-108.msa.txt';
  console.log(url);
  $.get(url, function(data) {
    loadNewMSA(data);
  });
}

// --- canvas --------------------------------------------------------------------------------------------

function drawMsaImage() {
  $('#msaImage').html('');
  /** @type {HTMLCanvasElement | null} */
  const div = (document.getElementById('msaImage'));
  if (!div) {
    return;
  }
  const ca = div.getContext('2d');
  msaImage = createMsaImageCanvas(div, ca);
  let currentFilteredSequenceCount = msa.h;
  const filteredSequenceOrder = msa.getCurrentFilteredSequenceOrder();
  if (filteredSequenceOrder != null) {
    currentFilteredSequenceCount = filteredSequenceOrder.length;
  }
  const rw = $('#imageResidW').text();
  const rh = $('#imageResidH').text();
  const msaImgClrSelect = $('#msaImgClrSelect').val();
  msaImgColorType = msaImgClrSelect ? parseInt(msaImgClrSelect.toString(), 10) : 0;
  msaImage.init(rw, rh, msa.w, currentFilteredSequenceCount);
  drawImageNSeq = 0;
  console.log('init msa image...');
  setTimeout('asyncDrawMsaImage()', 0); //0<-msaImageTimeout
}

function asyncDrawMsaImage() {
  const filteredSequenceOrder = msa.getCurrentFilteredSequenceOrder();
  if (filteredSequenceOrder == null || filteredSequenceOrder.length === 0) {
    return;
  }
  if (drawImageNSeq === filteredSequenceOrder.length) {
    return;
  }
  for (let col = 0; col < msa.w; col++) {
    const sequenceIndex = filteredSequenceOrder[drawImageNSeq];
    const aa = msa.seqs[sequenceIndex].charAt(col);
    if (aa === '.' || aa === '-') {
      continue;
    }

    let clr = '';
    console.log(msaImgColorType);
    if (msaImgColorType === 1) {
      clr = getResidColor('mview', aa);
    } else if (msaImgColorType === 2) {
      clr = getResidColor('clustal', aa);
    } else if (msaImgColorType === 3) {
      clr = getResidHydroColor(aa);
    }else if (msaImgColorType === 4) {
      clr = getResidColor('mview', aa);

      if (msa.seqs[sequenceIndex].charAt(col) === msa.seqs[0].charAt(col)) {
        //Reducing opacity instead of preventing any disply

        const color = clr;
        const percent = 0.9; //How much transparency 0-> full color; 1-> white

        //Applying the transparency layer to the obtained color
        const f = parseInt(color.slice(1), 16);
        const t = percent < 0 ? 0 : 255;
        const p = percent < 0 ? percent * -1 : percent;
        // tslint:disable: no-bitwise
        const R = f >> 16;
        const G = (f >> 8) & 0x00ff;
        const B = f & 0x0000ff;
        // tslint:enable: no-bitwise
        clr =
          '#' +
          (
            0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B)
          )
            .toString(16)
            .slice(1);
      } //clr = '#DCDCDC' //#D3D3D3 //For "greying" the non-mutated amino acids
    } else {
      console.log('Invalid option, something went wrong');
    }
    msaImage.paintCell(col, drawImageNSeq, clr);
  }
  drawImageNSeq++;
  setTimeout('asyncDrawMsaImage()', msaImageTimeout);
}

function resetMsaImage() {
  if (!msaImage) {
    return;
  }
  msaImage.init(1, 1, 100, 100);
}

// ---- stats view plota ---------------------------------------------------------------------------------
function UpdateStatsPlot() {
  const wi = 750;
  const he = 350;
  if (d3StatsPlots) {
    d3StatsPlots.remove();
  } else {
    d3StatsPlots = d3
      .select('#MSAstats')
      .append('svg')
      .attr('width', wi)
      .attr('height', he);
  }
  const plot = createPlot();
  // ref.seq not included //-30:roc
  plot.drawGrid(d3StatsPlots, wi, he, getRange(1, msa.h - 1, 10), getRange(0, 1, 10), '#9899c9');
  plot.addCurve('#f5a742', 4, msa.identS1.slice(1));
  plot.addCurve('#7879a9', 4, msa.gapsS.slice(1));
  $('#inp_gaps').val(msa.gapsMax);
  $('#inp_ident_min').val(msa.identR.min);
  $('#inp_ident_max').val(msa.identR.max);
}

function clearPlots() {
  if (d3PairwiseIdentityPlot) {
    d3PairwiseIdentityPlot.remove();
  }
  if (pwMap) {
    pwMap.clear();
  }
  if (d3fg) {
    d3fg.clear();
  }
}

function UpdatePairwisePlot() {
  if (!msa.pwseqminS.length) {
    clearPlots();
    return;
  }
  const wi = 750;
  const he = 350;
  if (d3PairwiseIdentityPlot) {
    clearPlots();
  }
  if (d3PairwiseIdentityPlot) {
    d3PairwiseIdentityPlot.remove();
  } else {
    d3PairwiseIdentityPlot = d3
      .select('#MSApairwise')
      .append('svg')
      .attr('width', wi)
      .attr('height', he);
  }
  const p = createPlot();
  p.drawGrid(d3PairwiseIdentityPlot, wi, he, getRange(1, msa.h, 10), getRange(0, 1, 10), '#9899c9');
  p.addCurve('#3e3f61', 4, msa.pwseqminS);
  p.addCurve('#f5a742', 4, msa.pwseqavgS);
  p.addCurve('#7792ba', 4, msa.pwseqmaxS);
  $('#inp_pwmin_min').val(msa.pwminR.min);
  $('#inp_pwmin_max').val(msa.pwminR.max);
  $('#inp_pwmax_min').val(msa.pwmaxR.min);
  $('#inp_pwmax_max').val(msa.pwmaxR.max);
  $('#inp_pwavg_min').val(msa.pwavgR.min);
  $('#inp_pwavg_max').val(msa.pwavgR.max);
  initPairwiseMap(wi);
}

function initPairwiseMap(w) {
  if (!pwMap) {
    /** @type {HTMLCanvasElement | null} */
    const div = (document.getElementById('MSApairwiseMap'));
    if (div) {
      const ca = div.getContext('2d');
      pwMap = createPairwiseMapCanvas(ca);
    }
  }
  pwMap.initMap(w, msa.h);
  pwMapNSeq = 0;
  console.log('init pairwise map...');
  setTimeout('asyncDrawPairwiseMap()', msa.asyncTimeout);
}

function asyncDrawPairwiseMap() {
  if (pwMapNSeq === msa.h) {
    return;
  } // pairwise identity completed
  for (let j = 0; j < msa.h; j++) {
    if (pwMapNSeq === j) {
      continue;
    }
    const i = msa.getPairIdentity(pwMapNSeq, j);
    const c = Math.floor(255 * (1 - i));
    const q = c.toString(16);
    const hex = (c < 16 ? '0' : '') + q;
    //	var clr = '#' + (i<0.333 ? hex+'00ff' : (i<0.666 ? '00'+hex+'ff' : hex+hex+'ff'));
    const clr = '#' + hex + hex + 'ff';
    pwMap.paintCell(pwMapNSeq, j, clr);
  }
  pwMapNSeq++;
  setTimeout('asyncDrawPairwiseMap()', msa.asyncTimeout);
}

function initForceGraph() {
  if (!msa.pwdoneQ) {
    return;
  } // compute pairwise identity first
  const val = $('#graphSlider').slider('option', 'value');
  pwGraph = msa.buildPairwiseIdentityGraph(val);
  if (typeof d3fg === 'undefined') {
    d3fg = createForceGraph();
  }
  d3fg.init('#MSApairwiseGraph', 700, 700, pwGraph);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  const f = evt.target.files ? evt.target.files[0] : evt.dataTransfer.files[0];
  if (!f) {
    return;
  }
  $('#progress')
    .show()
    .html('reading the file...');
  const r = new FileReader();
  r.onload = function(e) {
    loadNewMSA(r.result);
  };
  r.readAsText(f);
  return false;
}

function handleCustomFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  const f = evt.target.files ? evt.target.files[0] : evt.dataTransfer.files[0];
  if (!f) {
    return;
  }
  const r = new FileReader();
  r.onload = function(e) {
    msa.loadCustomMsaDataFile(r.result, function() {
      if (!msa.seqorder.cweightsA.length) {
        return;
      }
      $('#MSAcustomA').html(msa.hcustomwA);
      $('#MSAcustomB').html(msa.hcustomwB);
      $('#cdatStatus').html('mapped ' + msa.customweightsN + ' out of ' + msa.customweightsA.length + ' sequences');
      $('#order option[value="orderCustomAW"]').remove();
      $('#order option[value="orderCustomBW"]').remove();
      $("<option value='orderCustomAW'>custom order A</option>").appendTo('#order');
      $("<option value='orderCustomBW'>custom order B</option>").appendTo('#order');
      $('#MSAcustomAH').text('custom data A');
      $('#MSAcustomBH').text('custom data B');
      console.log($('#MSAcustomAH').text);
      console.log('>>> got some sorted custom weights....');
    });
  };
  r.readAsText(f);
  return false;
}

function handleCustomFileSelectCouplings(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  const f = evt.target.files ? evt.target.files[0] : evt.dataTransfer.files[0];
  if (!f) {
    return;
  }
  const r = new FileReader();
  r.onload = function(e) {
    msa.loadCouplingsDataFile(r.result, function() {
      $('#cdatStatus2').html('mapped ' + msa.couplingsN);
      console.log('>>> got the couplings');
      const aux = {};
      aux.A = msa.A;
      aux.B = msa.B;
      console.log(msa.A);
      console.log(aux.B);
      const len = msa.getNormalizedColumnProportions().length;
      const couplingsLogoDiagram = new CouplingsLogoDiagramD3(
        { elementId: 'couplingslogo', elementWidth: msaTextblockWidth, elementHeight: 30 },
        aux,
        len,
      );
      couplingsLogoDiagram.initDiagram();
    });
  };
  r.readAsText(f);
  return false;
}

function UpdateSpeciesDiagram() {
  const width = 700;
  const height = 600;
  const radius = Math.min(width, height) / 2 - 50;
  const color = d3.scale.category20();
  //	color = {E:'#00e000', A:'#e00000', B:'#0000e0', V:'#228888'};

  const svg = d3
    .select('#specburst')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height * 0.52 + ')');

  const partition = d3.layout
    .partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) {
      return 1;
    });

  const arc = d3.svg
    .arc()
    .startAngle(function(d) {
      return d.x;
    })
    .endAngle(function(d) {
      return d.x + d.dx;
    })
    .innerRadius(function(d) {
      return Math.sqrt(d.y);
    })
    .outerRadius(function(d) {
      return Math.sqrt(d.y + d.dy);
    });

  const testobj = {
    name: 'flare',
    children: [
      { name: 'sdsdfsdf', size: 2, children: [{ name: 'a', size: 23 }, { name: 'b', size: 12 }] },
      {
        name: 'qweqwecv',
        size: 3,
        children: [{ name: 'c', size: 35 }, { name: 'd', size: 53 }, { name: 'e', size: 2 }],
      },
    ],
  };

  const obj = { name: 'species', children: new Array() }; // have to convert object (hash-table) to array
  console.log(msa.specdist.children);
  for (const e of Object.keys(msa.specdist.children)) {
    const o = msa.specdist.children[e];
    const v = { name: o.name, size: o.size, children: new Array() };
    for (const c of Object.keys(o.children)) {
      const o2 = o.children[c];
      const v2 = { name: o2.name, size: o2.size };
      v.children.push(v2);
    }
    obj.children.push(v);
  }
  const path = svg
    .datum(obj)
    .selectAll('path')
    .data(partition.nodes)
    .enter()
    .append('path')
    .attr('display', function(d) {
      return d.depth ? null : 'none';
    }) // hide inner ring
    .attr('d', arc)
    .style('stroke', '#fff')
    .style('fill', function(d) {
      return color((d.children ? d : d.parent).name); /*color.hasOwnProperty(d.name) ? color[d.name] : 'grey'; */
    })
    .style('fill-rule', 'evenodd')
    .each(stash);

  path
    .data(
      partition.value(function(d) {
        return d.size;
      }).nodes,
    )
    .transition()
    .duration(1500)
    .attrTween('d', arcTween);

  function stash(d) {
    d.x0 = d.x;
    d.dx0 = d.dx;
  } // Stash the old values for transition
  function arcTween(a) {
    // Interpolate the arcs in data space
    const i = d3.interpolate({ x: a.x0, dx: a.dx0 }, a);
    return function(t) {
      const b = i(t);
      a.x0 = b.x;
      a.dx0 = b.dx;
      return arc(b);
    };
  }
  d3.select(self.frameElement).style('height', height + 'px');
}

function LoadUMAP() {
  // Casting for TypeScript compiler autocomplete goodness.
  /** @type {HTMLIFrameElement | null} */
  const iframe = (document.getElementById('bb-viz-iframe'));
  const { customweightsA, names, seqs } = msa;

  if (msa !== prevMsa) {
    if (iframe && iframe.contentWindow) {
      iframe.setAttribute('src', './bb-viz/bioblocks.html');
      iframe.setAttribute('allow', 'fullscreen');
      window.addEventListener('message', e => {
        console.log(`Message from bb-viz: ${JSON.stringify(e)}`);
      });

      $('#num-umap-seqs').text(seqs.length <= 4000 ? seqs.length : '4000 randomly selected');
      iframe.addEventListener('load', e => {
        if (!iframe.contentWindow) {
          console.log('No content window for bb-viz, unable to render!');
          return;
        }
        iframe.contentWindow.postMessage(
          {
            annotations: customweightsA.map(weight => weight.v),
            names,
            seqs,
            viz: 'UMAP Sequence',
          },
          '*',
        );
      });
    }
  }

  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(
      {
        annotations: customweightsA.map(weight => weight.v),
        names,
        seqs,
        viz: 'UMAP Sequence',
      },
      '*',
    );
    if (msa.customweightsA && msa.customweightsA.length >= 1) {
      iframe.style.marginLeft = 'calc(50vw - 350px)';
      iframe.style.width = '700px';
    } else {
      iframe.style.marginLeft = 'calc(50vw - 262)';
      iframe.style.width = '525px';
    }
    iframe.style.height = '581px';

    prevMsa = msa;
  }
}
