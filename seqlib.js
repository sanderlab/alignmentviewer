	//
	// multiple sequence alignment analysis and visualization library
	// relies on jQuery, d3 and external css 'seqlib.css'
	// written and maintained by Yevgeniy Antipin at Memorial Sloan Kettering Cancer Center, 2012
	//
	var nl = "\n";
	function isset(a) { return typeof a!=='undefined'; }	// yay php
	var AA = { 'A':0,'C':0,'D':0,'E':0,'F':0,'G':0,'H':0,'I':0,'K':0,'L':0,'M':0,'N':0,'P':0,'Q':0,'R':0,'S':0,'T':0,'V':0,'W':0,'Y':0,'-':0 };
	var aaclr = {	// amino-acid coloring, colors defined in css
		mview	: { '.':'gr', '-':'gr', 'G':'c0', 'A':'c0', 'I':'c0', 'V':'c0', 'L':'c0', 'M':'c0', 'F':'c1', 'Y':'c1', 'W':'c1', 'H':'c1', 'C':'c2', 'P':'c3', 'K':'c4', 'R':'c4', 'D':'c5', 'E':'c5', 'Q':'c6', 'N':'c6', 'S':'c7', 'T':'c7', 'B':'c8', 'Z':'c8', 'X':'c8', '?':'c9', '*':'c8', 'U':'bl' },
		multalin: { '.':'gr', '-':'gr', 'G':'m1', 'A':'bl', 'I':'m0', 'V':'bl', 'L':'bl', 'M':'bl', 'F':'bl', 'Y':'bl', 'W':'m1', 'H':'bl', 'C':'m1', 'P':'bl', 'K':'bl', 'R':'bl', 'D':'bl', 'E':'bl', 'Q':'bl', 'N':'m0', 'S':'bl', 'T':'bl', 'B':'bl', 'Z':'bl', 'X':'bl', '?':'bl', '*':'bl', 'U':'bl' },
		taylor	: { '.':'gr', '-':'gr', 'A':'t0', 'R':'t1', 'N':'t2', 'D':'t3', 'C':'t4', 'Q':'t5', 'E':'t6', 'G':'t7', 'H':'t8', 'I':'t9', 'L':'t10', 'K':'t11', 'M':'t12', 'F':'t13', 'P':'t14', 'S':'t15', 'T':'t16', 'W':'t17', 'Y':'t18', 'V':'t19' },
		pcp	: { '.':'gr', '-':'gr', 'R':'pc1', 'H':'pc1', 'K':'pc1', 'D':'pc2', 'E':'pc2', 'S':'pc3', 'T':'pc3', 'N':'pc3', 'Q':'pc3', 'C':'pc4', 'U':'pc4', 'G':'pc4', 'P':'pc4', 'A':'pc5', 'V':'pc5', 'I':'pc5', 'L':'pc5', 'M':'pc5', 'F':'pc5', 'Y':'pc5', 'W':'pc5' },
		hydro	: { 'F':'m1', 'I':'m1', 'W':'m1', 'L':'m1', 'V':'m1', 'M':'m1',		// very hydrophobic
				'Y':'c1', 'C':'c1', 'A':'c1',					// hydrohobic
				'T':'gr', 'H':'gr', 'G':'gr', 'S':'gr', 'Q':'gr',		// neutral
				'R':'m0', 'K':'m0', 'N':'m0', 'E':'m0', 'P':'m0', 'D':'m0'	// hydrohpilic
			}
		};
	// hydrophobicity at ph 7' relative to Glycine
	// source: http://www.sigmaaldrich.com/life-science/metabolomics/learning-center/amino-acid-reference-chart.html
	//
	var AAhydro = {
			'F':100, 'I':99, 'W':97, 'L':97, 'V':76, 'M':74,			// very
			'Y':63, 'C':49, 'A':41,							// hydrophobic
			'T':13,	'H':8, 'G':0, 'S':-5, 'Q':-10,					// neutral
			'R':-14, 'K':-23, 'N':-28, 'E':-31, 'P':-46, 'D':-55,			// hydrophilic
			'max':100, 'min':-55
		};
	// have to duplicate actual colors defined in CSS here because AFAIK there is no way
	// to access UNATTACHED style and look into its properties! if you know how please drop me a line
	var aacolors = {
		mview : { gr:'grey', bl:'black', m0:'blue', m1:'red', c0:'#33cc00', c1:'#009900', c2:'#ffff00', c3:'#33cc00', c4:'#cc0000', c5:'#0033ff',
			c6:'#6600cc', c7:'#0099ff', c8:'#666666', c9:'#999999', t0:'#5858a7', t1:'#6b6b94', t2:'#64649b', t3:'#2121de', t4:'#9d9d62', t5:'#8c8c73',
			t6:'#0000ff', t7:'#4949b6', t8:'#60609f', t9:'#ecec13', t10:'#b2b24d', t11:'#4747b8', t12:'#82827d', t13:'#c2c23d', t14:'#2323dc', t15:'#4949b6',
			t16:'#9d9d62', t17:'#c0c03f', t18:'#d3d32c', t19:'#ffff00'
			}
		};
	$.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
	function getResidColor(style, aa) {
		if (!aaclr.hasOwnProperty(style) || !aaclr[style][aa]) return '';
		var code = aaclr[style][aa];
		if (!aacolors.hasOwnProperty(style)) return '';
		return aacolors[style][code];
	}
	// hydrophobic - red, hydrophilic - blue
	function getResidHydroColor(aa) {
		if (!AAhydro.hasOwnProperty(aa)) return '';
		var h = AAhydro[aa];
		var c = 255 - h>0 ? Math.floor(255 * h/AAhydro.max) : Math.floor(255 * h/AAhydro.min);
		var q = c.toString(16);
		q = (c<16?'0':'') + q;
		if (h>0) return '#ff'+q+q;
		return '#'+q+q+'ff';
	}
	function getBioLink(type, id, text) {
		switch(type){
		case 'uniprot': return "<a href='http://www.uniprot.org/uniprot/" + id + "' target='_blank'>" + text + "</a>"; break;
		case 'pfam': return "<a href='http://pfam.xfam.org/protein/" + id + "' target='_blank'>" + text + "</a>"; break;
		default: return '';
		}
	}
	// this parses sequence name and returns object with 8 members :
	//	seq.name, html <a href> (if uniprot name is detected), uniprot organism suffix, protein region from, to, uniprot organism code, any text after ID, link to Pfam page
	// sequence name is assumed to be Uniprot in PFam or HHblits format
	// text after first space considered annotation and not part of sequence name in msa
	//	Pfam: EGFR_HUMAN/712-968
	// HHblits:	tr|F4CCT7|F4CCT7_SPHS2 NAD(P)H-quinone oxidoreductase subunit 2 ....
	//
	function ParseSeqName(sequenceIdLine) {
		var info = '';
		var sequenceId = sequenceIdLine;
		var spaceIndex = sequenceIdLine.indexOf(' ');
		if (spaceIndex!=-1) {
			info = sequenceIdLine.substr(spaceIndex+1);
			sequenceId = sequenceIdLine.substr(0, spaceIndex);	// name is seq.name before first space
		}
		var slashFrom = 1;
		var slashTo = 0;
		var slashSplit = sequenceId.split('/');
		if (slashSplit.length>2) { //unrecognized format: excessive slashes
			return { name:sequenceId, link:sequenceId, org:'', from:slashFrom, to:slashTo, info:info, pfam:'' };
		}
		if (slashSplit.length==2) { // slash notation, such as in pfam alignments : EGFR_HUMAN/712-968
			var dashSplit = slashSplit[1].split('-');
			if (dashSplit.length==2) {
				slashFrom = parseInt(dashSplit[0]);
				slashTo = parseInt(dashSplit[1]);
				if (slashFrom == NaN || slashTo == NaN) {
					slashFrom = 1;
					slashTo = 0;
				}
			}
		}
		var fullSequenceId = slashSplit[0];
		var barSplit = fullSequenceId.split('|');
		var basicSequenceId = barSplit[barSplit.length - 1];
		var underscoreSplit = basicSequenceId.split('_'); //split the last part of the ID such as with sp|P01112|RASH_HUMAN ... split is {'RASH' , 'HUMAN'}
		var idStem = underscoreSplit[0];
		var idSpecies = underscoreSplit[1];
		var idIsUniprot = (underscoreSplit.length == 2 && idSpecies.length > 2 && idSpecies.length < 6 && ((idStem.length > 0 && idStem.length < 7) || idStem.length == 10));
		if (idIsUniprot) {
			var uniprotLinkField = getBioLink('uniprot',basicSequenceId,fullSequenceId) + (slashSplit.length == 2 ? "/" + slashSplit[1] : '');
			var pfamLinkField = getBioLink('pfam',basicSequenceId,'pfam');
			return { name:sequenceId, link:uniprotLinkField, org:idSpecies, from:slashFrom, to:slashTo, info:info, pfam:pfamLinkField };
		} else {
			return { name:sequenceId, link:sequenceId, org:'', from:slashFrom, to:slashTo, info:info, pfam:'' };
		}
	}
	function cri(v) { return Math.floor(v)+0.5; }	// crisp shape edges in Raphael -- except for paths!
	function mf(v) { return Math.floor(v); }
	function fillinc(ary, len) { for(var p=0; p<len; p++) ary.push(p); } // make sure ary is an empty array before calling
	function getBox(w, h, margin) { return { l:margin, t:margin, r:w-margin, b:h-margin, w:w-2*margin, h:h-2*margin } }
	function getRange(from, to, steps) { return { from:from, to:to, steps:steps, w:to-from }; }
	function getRangeUpdate() { return {
		min:1e+6, max:-1e+6, width:0,
		update: function(v) { if (v>this.max) this.max = v; if (v<this.min) this.min = v; this.width = this.max-this.min; }}}
	function sort(values, indices) {	// sort by values and maintain indices in parallel order
		if (values.length!=indices.length) return false;
		var l = [];
		for(var k=0; k<values.length; k++) l.push({ v:values[k], i:indices[k] });
		l.sort(function(a,b){ return b.v-a.v });
		values = []; indices = [];
		for(var k=0; k<l.length; k++) { values.push(l.v[k]); indices.push(l.i[k]) };
		return true;
	}
	function createMsaImageCanvas(div, canvas) {
	return {
		div : div,
		ca : canvas,
		init : function(rw, rh, msaw, msah) {	// residue w x h in pixels, msa dimensions w x h)
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
		clear : function() { this.ca.clearRect(0, 0, this.w, this.h); },
		paintCell : function(x, y, color) {	// x,y zero based
			this.ca.fillStyle = color;
			this.ca.fillRect(this.rw * x, this.rh * y, this.rw, this.rh);
		}
	}}
	function createPairwiseMapCanvas(canvas) {
	return {
		ca : canvas,
		// square bitmap w pixels width and height
		initMap : function(w, nsamples) {
			this.w = w; this.n = nsamples; this.d = w/nsamples;
		},
		clear : function() { this.ca.clearRect(0, 0, this.w, this.w); },
		paintCell : function(i, j, color) {
			this.ca.fillStyle = color;
			this.ca.fillRect(this.d * i, this.d * j, this.d, this.d);
		}
	}}
	function createPlot() {
	return {
		d3plotselect:0,
		box:0,			// internal plot bbox
		rx:0, ry:0,		// range objects
		wx:0, wy:0,		// grid steps in pixels
		sx:0, sy:0,		// grid steps in specified range space
		// initialize and draw grid for regular plot
		// range variables -- { from:0, to:1, steps:10 }
		// gridsty -- style name
		drawGrid : function(d3plotselect, w, h, rangeX, rangeY, color) {
			var mrg = 26;	// margin
			this.d3plotselect = d3plotselect;
			this.box = getBox(w, h, mrg);
			this.rx = rangeX;
			this.ry = rangeY;
			this.wx = this.box.w/this.rx.steps;
			this.wy = this.box.h/this.ry.steps;
			var pstr = '';
			this.sx = (this.rx.to - this.rx.from) / this.rx.steps;
			for(var x=0; x<=this.rx.steps; x++) {
				var xr = (this.rx.from + this.sx*x).toFixed(0);
				var xp = mf(this.box.l+x*this.wx);
				pstr += 'M'+xp+' '+this.box.t+'L'+xp+' '+this.box.b;
				this.d3plotselect.append("text")
					.attr("x",xp)
					.attr("y",this.box.b + 10)
					.attr("font-size", "10px")
					.attr("fill", "black")
					.text(xr);
			}
			this.sy = (this.ry.to - this.ry.from) / this.ry.steps;
			for(var y=0; y<=this.ry.steps; y++) {
				var yr = (this.ry.from + this.sy*y).toFixed(1);
				var yp = this.box.b - y * this.wy;
				pstr += 'M'+this.box.l+' '+yp+'L'+this.box.r+' '+yp;
//				if ($.browser.chrome) yp /= 2;	// weird? you bet! i have no idea why text is shifting in chrome... 2014_02_26: not shifting with d3 apparently
				this.d3plotselect.append("text")
					.attr("x",this.box.l-5)
					.attr("y", yp + 2)
					.attr("font-size", "10px")
					.attr("fill", "black")
					.attr("text-anchor", "end")
					.text(yr);
			}
			this.d3plotselect.append("path")
				.attr("d",pstr)
				.attr("stroke", color)
				.attr("stroke-width", 1)
				.attr("stroke-dasharray", ['. ']);
		},
		// ary is normal ary or its items could be objects { i:index, v:value }
		addCurve : function(color, width, ary) {
			if (ary.length<1) return;
			var vQ = isset(ary[0].v);
			var path='';
			var sx = this.box.w / (ary.length-1);
			for(var i=0; i<ary.length; i++) {
				var v = vQ ? ary[i].v : ary[i];
				var x = this.box.l + sx*i;
				var f = (v - this.ry.from) / this.ry.w;
				var y = this.box.b - this.box.h*v;
				path += (i?'L':'M') + x + ' ' + y;
			}
			this.d3plotselect.append("path")
				.attr("d", path)
				.attr("stroke", color)
				.attr("stroke-width", width)
				.attr("stroke-linecap", "round")
				.attr("fill", "none");
		}
	}}
	// ---------------------------------- multiple sequence alignment reader/visualizer ---------------------
	function createMSA() {
	return {
		clrSeqLimit : 0,		// color only first N sequences in msa ( 0=everything )
		forceupperQ	: false,	// force upper case for sequences
		forcedashQ	: false,	// replace dots with dashes
		colorThresh : 0,		// conservation coloring threshold, color everything at 0
		setColorThresh : function(thresh) { this.colorThresh = thresh; },
		asyncTimeout : 2,
		cb	: false,		// callback obj
		raH	: 160,			// msa plot height
		ra	: false,		// raphael on top of msa - entropy/gaps
		// current selection of sequences based on applied filters -- work in progress
		seqorder : [],			// filtering/sorting alignment sequences, default order is 0,1,2,3,...
		// pairwise identity stuff
		cbpw : false,			// pairwise callback obj
		pwhash : {},			// hash: "i,j" --> count
		pwseqmin : [],			// array: seq.index --> min pairwise identity for a given sequence
		pwseqmax : [],			// array: seq.index --> max pairwise identity for a given sequence
		pwseqavg : [],			// array: seq.index --> average pairwise identity for a given sequence
		pairi:0, pairj:0, pairn:0, pairt:0, pwQ:false, pwdoneQ:false,
		// paging: current page of visible sequences
		// from = idx * len;
		page : { from:0, idx:0, len:1000 },
		// starts reading/parsing 'text' asynchronously
		// cb -- callback object, must have 3 functions: { progress(), done(), fail() }
		// cbpw -- callback for pairwise computing, see comments on startPairwiseIdentity() for details
		//
		asyncRead : function(text, cb, cbpw) {
			if (cb) this.cb = cb;
			if (cbpw) this.cbpw = cbpw;
			this.resetPairwise();
			this.rerenderQ = false;
			this.readyQ = false;
			this.h = this.w = 0;		// sequences x columns
			this.fastaQ = false;
			this.names = [];			// seq IDs with links
			this.seqs = [];
			this.ident1 = [];
			this.ident2 = [];
			this.gaps = [];
			this.customweightsA = [];	// how many read from user file
			this.customweightsB = [];	// how many read from user file
			this.customweightsN = 0;	// how many actually mapped to msa names
			this.pwseqminS = [];
			this.pwseqmaxS = [];
			this.pwseqavgS = [];
			this.identS1 = [];			// identity sorted
			this.identS2 = [];			// identity sorted
			this.gapsS = [];			// gaps sorted
			this.gapsMax = '';
			this.identR = { min:'', max:'' };
			this.pwmaxR = { min:'', max:'' };
			this.pwminR = { min:'', max:'' };
			this.pwavgR = { min:'', max:'' };
			this.entropyPerCol = [];
			this.entropyRange = getRangeUpdate();
			this.gapsPerCol = [];
			this.symColHash = [];
			this.fileLines = [];
			this.seqname2idx = {};		// map: seq.name --> seq.index
			this.seqorder = { orig:[], ident1:[], ident2:[] };
			this.specdist = { name:'species', children: {} };		// species distribution object for species diagram
			// rendered html for each div
			this.hruler = this.hseqs = this.hnames = this.hinfo = this.hspecies =
				this.hgaps = this.hident1 = this.hident2 = this.hrows = this.hrows2 = this.hpfam = this.hcustomwA  = this.hcustomwB = '';
			this.refseqIdx = 0;
			this.refseqProtFrom = 1;
			this.asyncCurrSeq = 0;
			this.asyncConsCol = 0;
			this.asyncParseStop = 51;
			this.asyncConsStop = 50;
			this.asyncParseLineN = 0;
			this.fileLines = text.split(nl);
			this.orderbyStr = 'orderOrig';
			console.log('parsing msa ' + this.fileLines.length + ' lines total');
//			if (this.ra) { this.ra.clear(); this.ra.setSize(5,5); }		// shrink current Raphael to allow parent div resize according to new msa width
			if (!this.fileLines.length) { if (this.cb) this.cb.done(); return; }
			if (this.cb) this.cb.progress('reading MSA...');
			setTimeout($.proxy(this.asyncParse, this), this.asyncTimeout);
		},
		getNormalizedColumnProportions : function() {
			var returnValue = [];
			if (this.symColHash == null) {return returnValue;}
			for (var col = 0; col < this.symColHash.length; col++) {
				var newHash = {};
				for (var key in this.symColHash[col]) {
					newHash[key] = this.symColHash[col][key] / this.h;
				}
				returnValue.push(newHash);
			}
			return returnValue;
		},
		initPaging : function() {
			if (!this.h) return;
			var h = this.h;
			this.page = {
				from: 0, to:0, len:1800, pages:1, last:h-1, rangestr:[], validQ:true,
				set: function(n) {	// set current page, n is 0-based!
					var h = this.last+1;
					if (this.len >= h) { this.to = h-1; this.validQ = false; return 0; }	// page size is bigger than entire thing
					this.pages = Math.ceil(h / this.len);
					if (n+1 > this.pages) n = this.pages-1;	// set on last page
					this.from = n * this.len;
					this.to = this.from + this.len - 1;
					if (this.to>this.last) this.to = this.last;
					return n;	// current page
				},
				getstr : function(n) { return this.rangestr[n]; }
			};
			for(var k=0; k<this.page.pages; k++) {
				this.page.set(k);
				this.page.rangestr.push((this.page.from+1) + '..' + (this.page.to+1));
			}
			this.page.set(0);
		},
		// --- parsing MSA -- plain text / fasta / stockholm supported, optionally dots converted to dashes, optionally uppercase forced ----------------------
		//
		asyncParse : function() {
			for (var currN=0; this.asyncParseLineN<this.fileLines.length
						&& currN<this.asyncParseStop; this.asyncParseLineN++, currN++) {
				var i = this.asyncParseLineN;
				if (this.fileLines[i].length<2) continue;
				var ch = this.fileLines[i].charAt(0);
				if (ch=='#' || ch=='/') continue;	// STOCKHOLM comments
				if (ch=='>') this.fastaQ = true;
				if (this.fastaQ) {					// FASTA
					if (ch=='>') {
						this.names.push(this.fileLines[i].substr(1).trim());
						this.seqs.push("");
					} else {
						var seq = this.fileLines[i].trim();
						if (this.forceupperQ) seq = seq.toUpperCase();
						if (this.forcedashQ) seq = seq.replace('.', '-');
						this.seqs[this.seqs.length-1] += seq;
					}
				} else {							// STOCKHOLM or plain text
					var t = this.fileLines[i].trim().split(/[\s\t]+/);
					if (t.length!=2) {
						if (this.cb) this.cb.fail('Cannot parse MSA line #' + i);
						return false;
					}
					var seq = t[1];
					if (this.forceupperQ) seq = seq.toUpperCase();
					if (this.forcedashQ) seq = seq.replace('.', '-');
					this.names.push(t[0]);
					this.seqs.push(seq);
				}
				if (this.cb) this.cb.progress('reading MSA, line ' + this.asyncParseLineN);
			}
			if (this.asyncParseLineN<this.fileLines.length) { setTimeout($.proxy(this.asyncParse, this), this.asyncTimeout); return; }
			if (!this.seqs.length || !this.names.length) {
				if (this.cb) this.cb.fail();
				return false;
			}
			this.w = this.seqs[0].length;
			this.h = this.seqs.length;
			this.columns = []; fillinc(this.columns, this.w);
			this.seqorder.orig = []; fillinc(this.seqorder.orig, this.h);
			this.orderby = this.seqorder.orig;	// orderby is just a reference to one of seqorder arrays
			this.asyncParseLineN = 0;
			this.asyncCurrSeq = 0;	// index in one of this.seqorder arrays!
			console.log('msa parsing done, w:' + this.w + ' h:' + this.h);
			this.initPaging();
			setTimeout($.proxy(this.asyncRender, this), this.asyncTimeout);
		},
		// --- figure out protein names, insert links, count gaps and identity, color-code residues, update divs html ------------
		//
		// TODO: remove gaps calculation from here!
		//
		parseSeqAndRenderHtml : function(pageQ, clrQ) {		// writes directly to this.hseqs
			var i = this.orderby[this.asyncCurrSeq];
			var gaps = 0, last = '', entrQ = this.entropyPerCol.length>0;
			for(var p in this.columns) {
				var col = this.columns[p];
				var ch = this.seqs[i].charAt(col);
				if (ch=='-') gaps++;
				if (!pageQ) continue;
				var consQ = true;
				if (entrQ) {
					var ent = (this.entropyPerCol[col] - this.entropyRange.min) / this.entropyRange.width;
					consQ = ent >= this.colorThresh;
				}
				if (consQ && clrQ && aaclr.mview.hasOwnProperty(ch)) {
					var news = aaclr.mview[ch];
					if (news!=last) {
						this.hseqs += last.length ? '</span>' : ''; last = news;
						this.hseqs += "<span class='" + last + "'>" + ch;
					} else {
						this.hseqs += ch;
					}
				} else {
					if (last.length!=0) this.hseqs += '</span>';
					this.hseqs += ch;
					last = '';
				}
			}
			if (last.length!=0) this.hseqs += '</span>';
			if (pageQ) this.hseqs += '<br>';
			return gaps;
		},
		//
		// order changed | coloring threshold changed | filtering by gaps/identity changed
		//
		reRender : function(msaPage, orderby, filterGaps, filterIdent, filterRSgaps) {
			this.orderbyStr = orderby;
			this.hseqs = this.hnames = this.hinfo = this.hspecies =
				this.hgaps = this.hident1 = this.hident2 = this.hrows = this.hrows2 = this.hpfam = this.hcustomwA  = this.hcustomwB = '';
			this.rerenderQ = true;
			var which = null;
			switch(orderby){
			case 'orderCustomAW': which = this.seqorder.cweightsA; break;
			case 'orderCustomBW': which = this.seqorder.cweightsB; break;
			case 'orderIdent1': which = this.seqorder.ident1; break;
			case 'orderIdent2': which = this.seqorder.ident2; break;
			case 'orderOrig': default: which = this.seqorder.orig; break;
			}
			this.applyFiltering(which, filterGaps, filterIdent, filterRSgaps);
			this.asyncCurrSeq = 0;
			this.page.set(msaPage);
			this.asyncRender();
		},
		getNonGappyRScolumns : function() {
			var columns = [];
			for(var p=0; p<this.w; p++) {
				var ch = this.seqs[0].charAt(p);
				if (ch=='-'||ch=='.') continue;
				columns.push(p);
			}
			return columns;
		},
		applyFiltering : function(orderAry, filterGaps, filterIdent, filterRSgaps) {
			this.columns = [];
			if (filterRSgaps) this.columns = this.getNonGappyRScolumns();
			else fillinc(this.columns, this.w);	// restore column visibility
			this.orderby = [];
			for(var i in orderAry) {
				var seq = orderAry[i];
				if (seq!=0 && (this.gaps[seq].v*100 > filterGaps || this.ident1[seq].v*100 < filterIdent)) continue;
				this.orderby.push(seq);
			}
		},
		getCurrentFilteredSequenceOrder : function() {
			return this.orderby;
		},
		applyExport : function(valGaps, valIdent, filterRSgaps) {	// write FASTA msa
			var win = window.open('','msa|viewer.org --> export','');
			win.document.open('text/html', 'replace');
			win.document.write('<pre>\n');
			var columns = this.columns;
			if (filterRSgaps && this.columns.length==this.w) // possibly not applied yet
				columns = this.getNonGappyRScolumns();
			for(var s in this.seqs) {
				if (s!=0 && (this.gaps[s].v*100 > valGaps || this.ident1[s].v*100 < valIdent)) continue;
				win.document.write('> ' + this.names[s] + nl);
				var seq = this.seqs[s];
				if (this.columns.length!=this.w) {
					seq = '';
					for(var p in this.columns)
						seq += this.seqs[s].charAt(this.columns[p]);
				}
				for(p=0; p<seq.length; p+=70) {
					win.document.write(seq.substr(p, 70) + nl);
				}
				win.document.write(nl);
			}
			win.document.write('</pre>\n');
			win.document.close();
		},
		//
		// TODO: gaps and identity computations should be moved out of asyncRender() into separate async function !!!
		//
		asyncRender : function() {
			for (var currN=0; this.asyncCurrSeq<this.orderby.length && currN<this.asyncParseStop; this.asyncCurrSeq++, currN++) {
				var pageQ = this.asyncCurrSeq >= this.page.from && this.asyncCurrSeq <= this.page.to;
				var i = this.orderby[this.asyncCurrSeq];
				if (i && this.seqs[i].length!=this.seqs[i-1].length) {
					if (this.cb) this.cb.fail('Parsing error: sequence #' + i + ' has different length');
					return false;
				}
				var clrQ = this.clrSeqLimit ? i<this.clrSeqLimit : true;
				var gaps = this.parseSeqAndRenderHtml(pageQ, clrQ);
				var namelink = ParseSeqName(this.names[i]);		// object returned
				if (isset(speclist)) {		// species object has to be loaded (speclist.2012_09.js)
					var s = '';
					if (isset(speclist[namelink.org])) {
						var code = speclist[namelink.org].k;
						s += code + ' ' + speclist[namelink.org].e;
						if (!this.rerenderQ) {
							if (!this.specdist.children.hasOwnProperty(code)) {
								this.specdist.children[code] = { name:code, size:1, children:{} };
								this.specdist.children[code].children[namelink.org] = { name:namelink.org, size:1 };
							} else {
								this.specdist.children[code].size++;
								if (!this.specdist.children[code].children.hasOwnProperty(namelink.org))
									this.specdist.children[code].children[namelink.org] = { name:namelink.org, size:1 };
								else this.specdist.children[code].children[namelink.org].size++;
							}
						}
					}
					if (pageQ) this.hspecies += s + '<br>';
				}
				if (pageQ) {
					this.hnames += (namelink.link + '<br>');
					this.hinfo += namelink.info + '<br>';
					this.hpfam += namelink.pfam + '<br>';
					this.hrows += (i+1) + '<br>';
					this.hrows2 += (this.asyncCurrSeq+1) + '<br>';
				}
				var f1,f2,ga;
				if (this.rerenderQ) {						// redrawing loaded msa, gaps and identity already calculated
					ga = 100*this.gaps[i].v;
					fi1 = 100*this.ident1[i].v;
					fi2 = 100*this.ident2[i].v;
				} else {									// new msa - calculate
					this.seqname2idx[namelink.name] = i;
					if (i==this.refseqIdx) this.refseqProtFrom = namelink.from;
					var ident=0;
					if (i!=this.refseqIdx) {
						for(var k=0; k<this.w; k++) {
							if (this.seqs[this.refseqIdx].charAt(k)=='-' || this.seqs[i].charAt(k)=='-') continue;
							if (this.seqs[this.refseqIdx].charAt(k)==this.seqs[i].charAt(k)) ident++;
						}
					}
					var rga = gaps/this.w;
					var rfi1 = ident/this.w;			// identity of ref.seq length
					var rfi2 = ident/(this.w-gaps);		// identity of second sequence length
					ga = 100*rga;
					fi1 = 100*rfi1;
					fi2 = 100*rfi2;
					this.ident1.push({i:i, v:rfi1});
					this.ident2.push({i:i, v:rfi2});
					this.gaps.push({i:i, v:rga});
				}
				if (pageQ) {
					if (i==this.refseqIdx) {
						var a = '<span class="tc1 tblheader" style="text-align:middle">ref.seq</span><br>';
						this.hident1 += a; this.hident2 += a;
					} else {
						this.hident1 += fi1.toFixed(1) + '<br>';
						this.hident2 += fi2.toFixed(1) + '<br>';
					}
					if (this.customweightsA.length)
						this.hcustomwA += this.customweightsA[i].v + '<br>';
					if (this.customweightsB.length)
						this.hcustomwB += this.customweightsB[i].v + '<br>';
					this.hgaps += ga.toFixed(1) + '<br>';
				}
				var prc = Math.floor(100*this.asyncCurrSeq/this.h);
				if (this.cb) this.cb.progress('rendering MSA .. ' + prc + '%');
			}
			if (this.asyncCurrSeq<this.orderby.length) { setTimeout($.proxy(this.asyncRender, this), this.asyncTimeout); return; }
			this.finalizeRender();
		},
		finalizeRender : function() {
			this.generateRuler();
			if (!this.identS1.length) {		// call this once on loading new msa only
				// sorted descending gaps,identity; keep refseq first
				this.identS1 = [].concat(this.ident1[0], this.ident1.slice(1).sort(function(a,b){return b.v-a.v}));
				this.identS2 = [].concat(this.ident2[0], this.ident2.slice(1).sort(function(a,b){return b.v-a.v}));
				this.gapsS = [].concat(this.gaps[0], this.gaps.slice(1).sort(function(a,b){return b.v-a.v}));
				this.gapsMax = this.gapsS[1].v;
				this.identR = { min:this.identS1[this.identS1.length-1].v, max:this.identS1[1].v };
				this.seqorder.ident1 = [];
				this.seqorder.ident2 = [];
				for(var k=0; k<this.identS1.length; k++) {
					this.seqorder.ident1.push(this.identS1[k].i);
					this.seqorder.ident2.push(this.identS2[k].i);
				}
			}
			if (this.cb) {
				this.cb.progress('updating html...');
				// let progress window update, otherwise it's stuck at ugly 98% for couple of secs
				setTimeout($.proxy(this.cb.doneReading, this), this.asyncTimeout);
			}
		},
		generateRuler : function() {
			var s = '';		// should be a better way to do this to be honest
			for(var p=1; p<=this.columns.length; p++) {
				var i = this.refseqProtFrom+p-1;
				var Q = i%10==0;
				var Q5 = !Q && i%5==0;
				s += Q ? '|' : (Q5 ? ':' : '.');
				if (!Q) continue;
				var sn = ''+i;
				var np = s.length-sn.length-1;		// where num starts
				if (np<0) continue;
				s = s.substr(0,np) + sn + '|';
			}
			this.hruler = s; // this.hruler = s.replace(/ /g, '.');
		},
		// --- custom weights for sequences to allow custom sorting/annotations -------------------------------
		//
		// since weights file is trivial to simplify things we're not going to run it asynchronously
		// This function has duplicate code within itself (too much dependencies to program it using loops)
		loadCustomMsaDataFile : function(text, UIcallback) {
			this.customweightsN = 0;	// how many mapped
			if (!this.h) return;
			var t = text.split(/[\r\n]/g);
			if (!t.length) return;
			this.seqorder.cweightsA = [];
			this.seqorder.cweightsB = [];
			this.customweightsA = new Array(this.h);
			this.customweightsB = new Array(this.h);
			for(var row in t) {
				var w = t[row].split("\t");
				if (w.length < 2 || w.length > 3) continue;
				if (!this.seqname2idx.hasOwnProperty(w[0])) continue;
				var i = this.seqname2idx[w[0]];
				this.customweightsA[i] = w[1];
				this.customweightsB[i] = w[2];
			}



			var n_customweightsB = 0; // I have not decided a function for non 100% matching sequences between A and B
			for(var k=0; k<this.h; k++) {
				if (!isset(this.customweightsA[k])) this.customweightsA[k] = {i:k, v:''};
				else { this.customweightsN++; this.customweightsA[k] = { i:k, v:this.customweightsA[k] }; }
				if (!isset(this.customweightsB[k])) this.customweightsB[k] = {i:k, v:''};
				else { n_customweightsB++; this.customweightsB[k] = { i:k, v:this.customweightsB[k] }; }
			}

			// custom weights sorted A
			this.cweightsS = [].concat(this.customweightsA[0], this.customweightsA.slice(1).sort(function(a,b){return isNaN(b.v)||isNaN(a.v) ? b.v<a.v : b.v-a.v}));
			for(var k=0; k<this.cweightsS.length; k++)
				this.seqorder.cweightsA.push(this.cweightsS[k].i);
			this.hcustomwA = '';
			for(var i=this.page.from; i<this.page.to; i++)		// this.orderby.length
				this.hcustomwA += this.customweightsA[this.orderby[i]].v + '<br>';

			// custom weights sorted B
			this.cweightsS = [].concat(this.customweightsB[0], this.customweightsB.slice(1).sort(function(a,b){return isNaN(b.v)||isNaN(a.v) ? b.v<a.v : b.v-a.v}));
			for(var k=0; k<this.cweightsS.length; k++)
				this.seqorder.cweightsB.push(this.cweightsS[k].i);
			this.hcustomwB = '';
			for(var i=this.page.from; i<this.page.to; i++)		// this.orderby.length
				this.hcustomwB += this.customweightsB[this.orderby[i]].v + '<br>';

			UIcallback();
		},
		// --- Load couplings for the alignment -------------------------------
		//
		// It loads the couplings sorted by importance to the user
		//
		loadCouplingsDataFile : function(text, UIcallback) {
			this.couplingsN = 0;	// how many mapped
			if (!this.h) return;
			var t = text.split(/[\r\n]/g);
			if (!t.length) return;
			this.couplings.A = new Array(this.h);
			this.couplings.B = new Array(this.h);
			var i = 0;
			for(var row in t) {
				var w = t[row].split("\t");
				if (w.length < 2 || w.length > 3) continue;
				if (!this.seqname2idx.hasOwnProperty(w[0])) continue;
				this.couplings.A[i] = w[1];
				this.couplings.B[i] = w[2];
				i = i + 1;
			}


			UIcallback();
		},
		// --- conservation -----------------------------------------------------------------------------------
		asyncComputeConservation : function() {
			var ch = '';
			for (var currN=0; this.asyncConsCol<this.w && currN<this.asyncConsStop; this.asyncConsCol++, currN++) {
				var i = this.asyncConsCol;
				this.gapsPerCol[i] = 0;
				this.entropyPerCol[i] = 0;
				this.symColHash[i] = { };
				for(var p=0; p<this.h; p++) {
					ch = this.seqs[p].charAt(i);
					if (ch=='-') { this.gapsPerCol[i]++; continue; }		// gaps not included into conservation
					if (!AA.hasOwnProperty(ch)) continue;
					if (this.symColHash[i].hasOwnProperty(ch)) this.symColHash[i][ch]++;
					else this.symColHash[i][ch] = 1;
				}
				var func = 0;
				for(var key in this.symColHash[i]) {
					// entropy -- uses count instead of frequency (probability) to capture amount of information
					var freq = this.symColHash[i][key];
					func += freq * Math.log(freq);
				}
				this.entropyPerCol[i] = func;
				this.entropyRange.update(func);
			}
			if (this.cb) this.cb.progress('computing conservation, column ' + this.asyncConsCol + ' / ' + this.w);
			if (this.asyncConsCol<this.w) { setTimeout($.proxy(this.asyncComputeConservation, this), this.asyncTimeout); return; }
			this.readyQ = true;
			// let progress window update, otherwise it's stuck at incomplete column progress for couple of secs
			if (this.cb) setTimeout($.proxy(this.cb.doneComputing, this), this.asyncTimeout);
		},
		// --- plot on top of msa --------------------------------------------------------------------
		redrawConservationPlot : function(plot_div_id, width) {
			if (!this.readyQ || !this.entropyPerCol.length) return;
			var conservationPlotElement = d3.select(plot_div_id);
			var svg = conservationPlotElement.append("svg").attr("width",width).attr("height",this.raH);
			var rowW = width / this.columns.length;		// .w;
			var rowWL = rowW / 3;
			var rowWR = 2 * rowWL;
			var y=0;
			for(var p=0; p<=10; p++) {	// grid
				y = Math.floor(this.raH*p/10) + 0.5;
				svg.append("line")
					.attr("x1", 0)
					.attr("y1", y)
					.attr("x2", width)
					.attr("y2", y)
					.attr("stroke-width", 0.5)
					.attr("stroke", "slateblue");
				//this.ra.path('M0 '+y+' L '+width+' '+y).attr({ stroke: '#b1b4dd', 'stroke-width':'1px' });
			}
			//	if (p==3) console.log('entropy:' + rt + ' bar:' + barH + ' total:' + this.raH);
			for(var p in this.columns) {
				var barH = this.raH * (msa.gapsPerCol[this.columns[p]] / msa.h);
				svg.append("rect")
					.attr("x", p * rowW)
					.attr("y", this.raH - barH)
					.attr("width", rowWL)
					.attr("height", this.raH)
					.attr("fill", "#a1b4cc");
//				this.ra.rect(p * rowW, this.raH-barH, rowWL, this.raH).attr({ stroke: 'none', fill: '#a1b4cc', shapeRendering: 'crispEdges' });
				var rt = (msa.entropyPerCol[this.columns[p]] - msa.entropyRange.min) / msa.entropyRange.width;
				barH = this.raH * rt;
				svg.append("rect")
					.attr("x", p * rowW + rowWL)
					.attr("y", this.raH - barH)
					.attr("width", rowWR-1)
					.attr("height", this.raH)
					.attr("fill", "#585989");
//				var b = { l:p * rowW + rowWL, t:this.raH-barH, w:rowWR-1, h:this.raH }
//				this.ra.rect(b.l, b.t, b.w, b.h).attr({ stroke: 'none', fill: '#585989', shapeRendering: 'crispEdges' });
			}
		},
		/* ---- welcome to d3. not working. svg is empty. any idea why?
		redrawConservationPlot : function(plot_div_id, width) {
			var data = this.entropyPerCol;
			var data = [4, 5, 8, 20, 40, 2, 49, 20 ];
			var w = 20; // width;
			var h = 20; // this.raH;
			var xs = d3.scale.ordinal().domain([0, data.length]).rangeRoundBands([0, w]);
			var ys = d3.scale.linear().domain(d3.extent(data)).range([h, 0]);
			var svg = d3.select(plot_div_id).attr("width", w).attr("height", h)
						.append("g")
						.attr("transform", "translate(0,0)");
			// svg.selectAll().exit().remove();
			var line = d3.svg.line().x(xs).y(ys);
			svg.append("path").attr("d", line(data));
			// gridlines
			svg.selectAll("line.y").data(ys.ticks(10)).enter().append("line").attr("class", "y grid")
				.attr("x1", 0).attr("x2", w).attr("y1", ys).attr("y2", ys);
			svg.selectAll(".bar")
				.data(data)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function(d, i) { return xs(i); })
				.attr("width", 10)								// xs.rangeBand()
				.attr("y", function(d) { return ys(d); })
				.attr("height", function(d) { return height-ys(d); });
		},	*/
		// --- msa pairwise identity --------------------------------------------------------------------------
		resetPairwise : function() {
			this.pwhash = {};
			this.pwseqmin = [];
			this.pwseqmax = [];
			this.pwseqavg = [];
			this.pairi = this.pairj = this.pairn = this.pairt = 0;
			this.pwQ = this.pwdoneQ = false;
		},
		// cbpw -- callback object, has to implement { function start(), function progress(), function done(flag) }
		// flag indicates if job is 100% completed, false if canceled in the middle
		startPairwiseIdentity : function() {
			this.pwhash = {};
			this.pairi = this.pairn = 0;
			this.pairj = 1;
			this.pairt = Math.floor(this.h * (this.h-1) / 2);
			this.pwQ = true;	// pairwise running flag
			setTimeout($.proxy(this.anyncPairwiseIdentity, this), this.asyncTimeout);
			if (this.cbpw) this.cbpw.start();
		},
		togglePairwiseIdentity : function() {
			if (this.pwQ) { this.pwQ = false; this.resetPairwise(); if (this.cbpw) this.cbpw.done(false); }
			else this.startPairwiseIdentity();
		},
		anyncPairwiseIdentity : function() {
			if (!this.pwQ) return;
			var doneQ = false;
			for (var np=0; np<this.asyncConsStop; np++) {
				var ident=0;
				for(var p=0; p<this.w; p++) {
					var ch1 = this.seqs[this.pairi].charAt(p);
					var ch2 = this.seqs[this.pairj].charAt(p);
					if (ch1=='-' || ch2=='-') continue;
					if (!aaclr.mview.hasOwnProperty(ch1) || !aaclr.mview.hasOwnProperty(ch2)) continue;	// both are valid AA
					if (ch1==ch2) ident++;
				}
				var id = this.pairi+','+this.pairj;
				this.pwhash[id] = ident/this.w;
				this.pairn++;
				if (this.pairj+1!=this.h) this.pairj++;
				else if (this.pairi+1!=this.h-1) { this.pairi++; this.pairj = this.pairi+1; }
				else { doneQ = true; break; }
			}
			var f = (100 * this.pairn/this.pairt).toFixed(0);
			if (this.cbpw) this.cbpw.progress(' ... pass1 : '+msa.pairn+'/'+msa.pairt+' pairs');
			if (!doneQ) { setTimeout($.proxy(this.anyncPairwiseIdentity, this), this.asyncTimeout); return; }
			this.pairi = this.pairj = this.pairn = 0;
			this.anyncPairwiseIdentityPass2();
		},
		getPairIdentity : function(i, j) {
			var id = i > j ? j+','+i : i+','+j;
			return this.pwhash[id];
		},
		// computes min,max,avg identity for each sequence
		anyncPairwiseIdentityPass2 : function() {
			if (!this.pwQ) return;
			var avg=0;
			var r = getRangeUpdate();
			for (var j=0; j<this.h; j++) {
				if (j == this.pairi) continue;
				var id = this.pairi > j ? j+','+this.pairi : this.pairi+','+j;
				if (!this.pwhash.hasOwnProperty(id)) { concole.log('FATAL error, pairwise hash ID not found: ' + id); this.pwQ = false; return false; }
				var idnt = this.pwhash[id];
				r.update(idnt);
				avg += idnt/(this.h-1);
			}
			this.pwseqmin[this.pairi] = r.min;
			this.pwseqmax[this.pairi] = r.max;
			this.pwseqavg[this.pairi] = avg;
			if (this.cbpw) this.cbpw.progress(' ... pass2 : '+msa.pairi);
			this.pairi++;
			if (this.pairi<msa.h) { setTimeout($.proxy(this.anyncPairwiseIdentityPass2, this), this.asyncTimeout); return; }
			console.log('sorting pairwise plots... ' + this.pwseqmin.length + ',' + this.pwseqmax.length + ',' + this.pwseqavg.length);
			this.pwseqminS = this.pwseqmin.slice().sort(function(a,b){return b-a});
			this.pwseqmaxS = this.pwseqmax.slice().sort(function(a,b){return b-a});
			this.pwseqavgS = this.pwseqavg.slice().sort(function(a,b){return b-a});
			this.pwminR = { min:this.pwseqminS[this.pwseqminS.length-1], max:this.pwseqminS[0] };
			this.pwmaxR = { min:this.pwseqmaxS[this.pwseqmaxS.length-1], max:this.pwseqmaxS[0] };
			this.pwavgR = { min:this.pwseqavgS[this.pwseqavgS.length-1], max:this.pwseqavgS[0] };
			this.pwQ = false;
			this.pwdoneQ = true;
			if (this.cbpw) this.cbpw.done(true);
		},
		// identThr - threshold to link nodes
		// unconnected nodes not shown
		buildPairwiseIdentityGraph : function(identThr) {
			if (!this.pwseqmin.length) return false;
			var gra = { nodes : [], links : [] };
			var map = {};	// skipping unconnected nodes, sequence index --> node index
			var mapIdx = 0;
			for(var id in this.pwhash) {
				if (this.pwhash[id]<identThr) continue;
				var w = id.split(',');
				var s1 = +w[0], s2 = +w[1], i1, i2;
				if (!map.hasOwnProperty(s1)) { i1 = mapIdx++; map[s1] = i1; gra.nodes.push({}); } else i1 = map[s1];
				if (!map.hasOwnProperty(s2)) { i2 = mapIdx++; map[s2] = i2; gra.nodes.push({}); } else i2 = map[s2];
				gra.links.push({ source: i1 , target: i2, value: this.pwhash[id] });
			}
			return gra;
		}
		};
	}
	// ---------- d3 force graph -----------------------------------------------------------------------
	function createForceGraph() {
		return {
		w:700, h:700,
		node : false,
		link : false,
		vis : false,
		force : false,
		Q : false,
		linkdist : { min:10, max:100 },
		gra : false,	// reference to user graph
		sampleGraph : {
			nodes : [ {}, {}, {}, {} ],
			links : [ { source:0, target:1, value:0.2 }, { source:0, target:2, value:0.5 }, { source:0, target:3, value:1 } ]
		},
		init : function(divID, w, h, gra) {
			this.w = w; this.h = h;
			this.gra = gra ? gra : this.sampleGraph;
			if (!this.Q) {
				this.vis = d3.select(divID).append("svg:svg").attr("width", this.w).attr("height", this.h);
				this.force = d3.layout.force().on("tick", $.proxy(this.tick, this)).size([this.w, this.h]);
				this.Q = true;
			}
			this.force.linkdist = this.linkdist;	// so linkDistance() callback can access
			this.linkdist.w = this.linkdist.max - this.linkdist.min;
			this.update();
		},
		clear : function() {
			if (!this.Q) return;
			this.gra.nodes = [];
			this.gra.links = [];
			this.update();
		},
		update : function() {
		var nodes = this.gra.nodes;
		var links = this.gra.links;
		this.force
			.linkDistance(function(d) { return this.linkdist.min + this.linkdist.w * d.value; })
			.nodes(nodes)
			.links(links)
			.start();
		// update the links
		this.link = this.vis.selectAll("line.link").data(links, function(d) { return d.target.id; });
		// enter any new links
		this.link
			.enter().insert("svg:line", ".node")
			.attr("class", "link")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		// exit any old links
		this.link.exit().remove();
		// update the nodes
		this.node = this.vis.selectAll("circle.node")
			.data(nodes, function(d) { return d.id; })
			.style("fill", this.color);		// $.proxy(this.color, this)
			// enter any new nodes
		this.node
			.enter().append("svg:circle")
			.attr("class", "node")
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
			.attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
			.style("fill", this.color)
			.on("click", this.click)
			.call(this.force.drag);
		// exit any old nodes
		this.node.exit().remove();
	},
	color : function(d) {
		return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
	},
	tick : function() {
		this.link
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		this.node
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	},
	// toggle children on click... or not
	click : function(d) {
		/*
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		this.update();	*/
	}};
	}
	// ---------- kMins clustering ----- work in progress -------------------------------------------------------
	function testkMinsClustering() {
		var Nclu = 4;
		var data = [ 1,2,3,7,8,9 ];
		var kmc = kMinsClustering();
		kmc.runAllIterations(Nclu, data);
		console.log('------- FINAL ------------');
		console.log(kmc.getClusteringStr());
	}
	function kMinsClustering() {
		return {
			clusters : [],		// list of data point indicies per cluster
			centroids : [],
			sumsqua : 0,		// sum of squares of distances to each centroid after current iteration
			minsumsqua : 0,		// minimizing sum of squares
			bbox : false,		// data bounding box
			data : false,		// reference to user data
			clu : {},			// saved clustering
			initCentroids : function(N, data) {
				this.data = data;
				this.clusters = [];
				this.centroids = [];
				var hash = {};
				for(var k=0; k<N; k++) {
					var i = Math.floor(Math.random() * data.length);
					if (isset(hash[data[i]])) continue;
					this.centroids.push(data[i]);
					hash[data[i]] = 1;
				}
				console.log('number of centroids = ' + this.centroids.length);
			},
			// N - number of clusters
			initRandomCentroids : function(N, data) {
				this.data = data;
				this.bbox = getRangeUpdate();
				for(var k=0; k<data.length; k++) this.bbox.update(data[k]);
				for(var k=0; k<N; k++) {
					var p = this.bbox.min + Math.random() * this.bbox.width;
				//	if (k==0) p = 2.8; else if (k==1) p = 7.2;
					this.centroids.push(p);
				}
			},
			assign : function() {		// assign() changes amount of clusters and centroids
				this.clusters = [];
				for(var c in this.centroids) this.clusters.push([]);
				for(var k in this.data) {
					var dist = 1e+6;
					var nearest = 0;
					for (var c in this.centroids) {
						var d = Math.abs(this.centroids[c] - this.data[k]);
						if (d<dist) { dist = d; nearest = c; }
					}
				//	console.log('nearest for point #' + k + ', ' + this.data[k] + ' --> cluster #' + nearest + ', cent=' + this.centroids[nearest]);
					this.clusters[nearest].push(k);
				}
				// delete empty clusters
				for(var k=this.clusters.length-1; k>=0; k--) {
					if (this.clusters[k].length) continue;
					this.clusters.splice(k, 1);
					this.centroids.splice(k, 1);
				}
			},
			getNewCentroids : function() {
				var anyoneMovedQ = false;
				for(var c in this.clusters) {
					var avg = 0;
					for(var k in this.clusters[c]) avg += this.data[ this.clusters[c][k] ];
					avg /= this.clusters[c].length;
					if (Math.abs(this.centroids[c] - avg) > 1e-6) anyoneMovedQ = true;
					this.centroids[c] = avg;
				}
				return anyoneMovedQ;
			},
			getSumOfSquares : function() {
				this.sumsqua = 0;
				for(var c in this.clusters) {
					var sum = 0;
					for(k in this.clusters[c])
						sum += (this.data[ this.clusters[c][k] ] - this.centroids[c]) * (this.data[ this.clusters[c][k] ] - this.centroids[c]);
					this.sumsqua += sum;
				}
				return this.sumsqua;
			},
			runOneIteration : function() {
				while (true) {
					this.assign();
					if (!this.getNewCentroids()) break;
				}
			},
			runAllIterations : function(Nclu, data) {
				this.minsumsqua = 1e+6;
				for(var n=Nclu; n>0; n--) {
					console.log('------- iteration Nclu=' + n + '----------');
					this.initCentroids(n, data);
					this.runOneIteration();
					var sum = this.getSumOfSquares();
					console.log(this.getClusteringStr());
					var diff = sum - this.minsumsqua;
					if (diff < 1e-6) {		// less OR equal pick current
						this.minsumsqua = sum;
						this.saveCurrentClu();
					}
				}
				this.restoreClu();
			},
			// --------------------------------- utils ------------------
			saveCurrentClu : function() {
				this.clu.clusters = this.clusters.slice();
				this.clu.centroids = this.centroids.slice();
				this.clu.sumsqua = this.sumsqua;
			},
			restoreClu : function() {
				this.clusters = this.clu.clusters.slice();
				this.centroids = this.clu.centroids.slice();
				this.sumsqua = this.clu.sumsqua;
			},
			getClusteringStr : function() {
				var out = '';
				for(var c in this.clusters) {
					out += 'clu #' + c + " : cent=" + this.centroids[c] + " [ ";
					for(var k in this.clusters[c]) out += this.data[ this.clusters[c][k] ] + ' ';
					out += ']\n';
				}
				out += 'sum of squares == ' + this.sumsqua + '\n';
				return out;
			},
		}
	}
