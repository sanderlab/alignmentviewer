// ---------------------------------- multiple sequence alignment reader/visualizer ---------------------
class MultipleSequenceAlignment {
    constructor() {
        this.clrSeqLimit = 0; // color only first N sequences in msa ( 0=everything )
        this.forceupperQ = false; // force upper case for sequences
        this.forcedashQ = false; // replace dots with dashes
        this.colorThresh = 0; // conservation coloring threshold, color everything at 0
        this.asyncTimeout = 2;
        this.cb = {
            done: (...args) => {
                return;
            },
            progress: (...args) => {
                return;
            },
        }; // callback obj
        this.raH = 160; // msa plot height
        this.ra = false; // raphael on top of msa - entropy/gaps
        // current selection of sequences based on applied filters -- work in progress

        // filtering/sorting alignment sequences, default order is 0,1,2,3,...
        this.seqorder = { orig: new Array(), ident1: new Array(), ident2: new Array() };

        // pairwise identity stuff
        this.cbpw = {
            start: () => {
                return;
            },
        }; // pairwise callback obj
        this.pwhash = {}; // hash: "i,j" --> count
        this.pwseqmin = new Array(); // array: seq.index --> min pairwise identity for a given sequence
        this.pwseqmax = new Array(); // array: seq.index --> max pairwise identity for a given sequence
        this.pwseqavg = new Array(); // array: seq.index --> average pairwise identity for a given sequence
        this.pairi = 0;
        this.pairj = 0;
        this.pairn = 0;
        this.pairt = 0;
        this.pwQ = false;
        this.pwdoneQ = false;
        // paging: current page of visible sequences
        // from = idx * len;
        this.page = { from: 0, idx: 0, len: 1000 };
        // starts reading/parsing 'text' asynchronously
        // cb -- callback object, must have 3 functions: { progress(), done(), fail() }
        // cbpw -- callback for pairwise computing, see comments on startPairwiseIdentity() for details
        //

        this.rerenderQ = false;
        this.readyQ = false;
        // sequences x columns
        this.h = 0;
        this.w = 0;
        this.fastaQ = false;
        this.names = new Array(); // seq IDs with links
        this.seqs = new Array();
        this.ident1 = new Array();
        this.ident2 = new Array();
        this.gaps = new Array();
        this.customweightsA = new Array(); // how many read from user file
        this.customweightsB = new Array(); // how many read from user file
        this.customweightsN = 0; // how many actually mapped to msa names
        this.pwseqminS = new Array();
        this.pwseqmaxS = new Array();
        this.pwseqavgS = new Array();
        this.identS1 = new Array(); // identity sorted
        this.identS2 = new Array(); // identity sorted
        this.gapsS = new Array(); // gaps sorted
        this.gapsMax = '';
        this.identR = { min: '', max: '' };
        this.pwmaxR = { min: '', max: '' };
        this.pwminR = { min: '', max: '' };
        this.pwavgR = { min: '', max: '' };
        this.entropyRange = getRangeUpdate();
        this.entropyPerCol = new Array();
        this.gapsPerCol = new Array();
        this.symColHash = new Array();
        this.fileLines = new Array();
        this.columns = new Array();
        this.seqname2idx = {}; // map: seq.name --> seq.index
        this.specdist = { name: 'species', children: {} }; // species distribution object for species diagram
        // rendered html for each div
        this.hruler = '';
        this.hseqs = '';
        this.hnames = '';
        this.hinfo = '';
        this.hspecies = '';
        this.hgaps = '';
        this.hident1 = '';
        this.hident2 = '';
        this.hrows = '';
        this.hrows2 = '';
        this.hpfam = '';
        this.hcustomwA = '';
        this.hcustomwB = '';

        this.refseqIdx = 0;
        this.refseqProtFrom = 1;
        this.asyncCurrSeq = 0;
        this.asyncConsCol = 0;
        this.asyncParseStop = 51;
        this.asyncConsStop = 50;
        this.asyncParseLineN = 0;
        this.orderbyStr = 'orderOrig';
        this.orderby = this.seqorder.orig; // orderby is just a reference to one of seqorder arrays
    }

    asyncRead(text, cb, cbpw) {
        if (cb) {
            this.cb = cb;
        }
        if (cbpw) {
            this.cbpw = cbpw;
        }
        this.resetPairwise();

        this.fileLines = text.split(nl);
        console.log('parsing msa ' + this.fileLines.length + ' lines total');
        // Shrink current Raphael to allow parent div resize according to new msa width
        // if (this.ra) { this.ra.clear(); this.ra.setSize(5,5); }
        if (!this.fileLines.length) {
            if (this.cb) {
                this.cb.done();
            }
            return;
        }
        if (this.cb) {
            this.cb.progress('reading MSA...');
        }
        setTimeout($.proxy(this.asyncParse, this), this.asyncTimeout);
    }

    setColorThresh(thresh) {
        this.colorThresh = thresh;
    }

    getNormalizedColumnProportions() {
        const returnValue = new Array();
        if (this.symColHash == null) {
            return returnValue;
        }
        for (let col = 0; col < this.symColHash.length; col++) {
            const newHash = {};
            for (const key of Object.keys(this.symColHash[col])) {
                newHash[key] = this.symColHash[col][key] / this.h;
            }
            returnValue.push(newHash);
        }
        return returnValue;
    }

    initPaging() {
        if (!this.h) {
            return;
        }
        const h = this.h;
        this.page = {
            from: 0,
            to: 0,
            len: 1800,
            idx: 0, // from / len,
            pages: 1,
            last: h - 1,
            rangestr: new Array(),
            validQ: true,
            set: function(n) {
                // set current page, n is 0-based!
                const currentPage = this.last + 1;
                if (this.len >= currentPage) {
                    this.to = currentPage - 1;
                    this.validQ = false;
                    return 0;
                } // page size is bigger than entire thing
                this.pages = Math.ceil(currentPage / this.len);
                if (n + 1 > this.pages) {
                    n = this.pages - 1; // set on last page
                }
                this.from = n * this.len;
                this.to = this.from + this.len - 1;
                if (this.to > this.last) {
                    this.to = this.last;
                }
                return n; // current page
            },
            getstr: function(n) {
                return this.rangestr[n];
            },
        };
        for (let k = 0; k < this.page.pages; k++) {
            this.page.set(k);
            this.page.rangestr.push(this.page.from + 1 + '..' + (this.page.to + 1));
        }
        this.page.set(0);
    }

    /**
     * Parsing MSA
     * - Plain text / FASTA / Stockholm supported.
     * - Optionally dots converted to dashes.
     * - Optionally uppercase forced.
     */
    asyncParse() {
        for (
            let currN = 0;
            this.asyncParseLineN < this.fileLines.length && currN < this.asyncParseStop;
            this.asyncParseLineN++, currN++
        ) {
            const i = this.asyncParseLineN;
            if (this.fileLines[i].length < 2) {
                continue;
            }
            const ch = this.fileLines[i].charAt(0);
            if (ch === '#' || ch === '/') {
                continue; // STOCKHOLM comments
            }
            if (ch === '>') {
                this.fastaQ = true;
            }
            if (this.fastaQ) {
                // FASTA
                if (ch === '>') {
                    this.names.push(this.fileLines[i].substr(1).trim());
                    this.seqs.push('');
                } else {
                    let seq = this.fileLines[i].trim();
                    if (this.forceupperQ) {
                        seq = seq.toUpperCase();
                    }
                    if (this.forcedashQ) {
                        seq = seq.replace('.', '-');
                    }
                    this.seqs[this.seqs.length - 1] += seq;
                }
            } else {
                // STOCKHOLM or plain text
                const t = this.fileLines[i].trim().split(/[\s\t]+/);
                if (t.length !== 2) {
                    if (this.cb) {
                        this.cb.fail('Cannot parse MSA line #' + i);
                    }
                    return false;
                }
                let seq = t[1];
                if (this.forceupperQ) {
                    seq = seq.toUpperCase();
                }
                if (this.forcedashQ) {
                    seq = seq.replace('.', '-');
                }
                this.names.push(t[0]);
                this.seqs.push(seq);
            }
            if (this.cb) {
                this.cb.progress('reading MSA, line ' + this.asyncParseLineN);
            }
        }
        if (this.asyncParseLineN < this.fileLines.length) {
            setTimeout($.proxy(this.asyncParse, this), this.asyncTimeout);
            return;
        }
        if (!this.seqs.length || !this.names.length) {
            if (this.cb) {
                this.cb.fail();
            }
            return false;
        }
        this.w = this.seqs[0].length;
        this.h = this.seqs.length;
        this.columns = new Array();
        fillinc(this.columns, this.w);
        this.seqorder.orig = new Array();
        fillinc(this.seqorder.orig, this.h);
        this.orderby = this.seqorder.orig; // orderby is just a reference to one of seqorder arrays
        this.asyncParseLineN = 0;
        this.asyncCurrSeq = 0; // index in one of this.seqorder arrays!
        console.log('msa parsing done, w:' + this.w + ' h:' + this.h);
        this.initPaging();
        setTimeout($.proxy(this.asyncRender, this), this.asyncTimeout);
    }

    // --- figure out protein names, insert links, count gaps and identity, color-code residues, update divs html ------------
    // TODO: remove gaps calculation from here!
    parseSeqAndRenderHtml(pageQ, clrQ) {
        // writes directly to this.hseqs
        const i = this.orderby[this.asyncCurrSeq];
        let gaps = 0;
        let last = '';
        const entrQ = this.entropyPerCol.length > 0;
        for (const p of Object.keys(this.columns)) {
            const col = this.columns[p];
            const ch = this.seqs[i].charAt(col);
            if (ch === '-') {
                gaps++;
            }
            if (!pageQ) {
                continue;
            }
            let consQ = true;
            if (entrQ) {
                const ent = (this.entropyPerCol[col] - this.entropyRange.min) / this.entropyRange.width;
                consQ = ent >= this.colorThresh;
            }
            if (consQ && clrQ && aaclr.defaultClasses.hasOwnProperty(ch)) {
                const news = aaclr.defaultClasses[ch];
                if (news !== last) {
                    this.hseqs += last.length ? '</span>' : '';
                    last = news;
                    this.hseqs += "<span class='" + last + "'>" + ch;
                } else {
                    this.hseqs += ch;
                }
            } else {
                if (last.length !== 0) {
                    this.hseqs += '</span>';
                }
                this.hseqs += ch;
                last = '';
            }
        }
        if (last.length !== 0) {
            this.hseqs += '</span>';
        }
        if (pageQ) {
            this.hseqs += '<br>';
        }
        return gaps;
    }

    //
    // order changed | coloring threshold changed | filtering by gaps/identity changed
    //
    reRender(msaPage, orderby, filterGaps, filterIdent, filterRSgaps) {
        this.orderbyStr = orderby;
        this.hseqs = '';
        this.hnames = '';
        this.hinfo = '';
        this.hspecies = '';
        this.hgaps = '';
        this.hident1 = '';
        this.hident2 = '';
        this.hrows = '';
        this.hrows2 = '';
        this.hpfam = '';
        this.hcustomwA = '';
        this.hcustomwB = '';
        this.rerenderQ = true;
        let which = null;
        switch (orderby) {
            case 'orderCustomAW':
                which = this.seqorder.cweightsA;
                break;
            case 'orderCustomBW':
                which = this.seqorder.cweightsB;
                break;
            case 'orderIdent1':
                which = this.seqorder.ident1;
                break;
            case 'orderIdent2':
                which = this.seqorder.ident2;
                break;
            case 'orderOrig':
            default:
                which = this.seqorder.orig;
                break;
        }
        this.applyFiltering(which, filterGaps, filterIdent, filterRSgaps);
        this.asyncCurrSeq = 0;
        this.page.set(msaPage);
        this.asyncRender();
    }

    getNonGappyRScolumns() {
        const columns = new Array();
        for (let p = 0; p < this.w; p++) {
            const ch = this.seqs[0].charAt(p);
            if (ch === '-' || ch === '.') {
                continue;
            }
            columns.push(p);
        }
        return columns;
    }

    applyFiltering(orderAry, filterGaps, filterIdent, filterRSgaps) {
        this.columns = new Array();
        if (filterRSgaps) {
            this.columns = this.getNonGappyRScolumns();
        } else {
            fillinc(this.columns, this.w); // restore column visibility
        }
        this.orderby = new Array();
        for (const i of Object.keys(orderAry)) {
            const seq = orderAry[i];
            if (seq !== 0 && (this.gaps[seq].v * 100 > filterGaps || this.ident1[seq].v * 100 < filterIdent)) {
                continue;
            }
            this.orderby.push(seq);
        }
    }

    getCurrentFilteredSequenceOrder() {
        return this.orderby;
    }

    applyExport(valGaps, valIdent, filterRSgaps) {
        // write FASTA msa
        const win = window.open('', 'msa|viewer.org --> export', '');
        if (!win) {
            console.log('Error exporting - window not available!');
            return;
        }
        win.document.open('text/html', 'replace');
        win.document.write('<pre>\n');
        let columns = this.columns;
        if (filterRSgaps && columns.length === this.w) {
            // possibly not applied yet
            columns = this.getNonGappyRScolumns();
        }
        for (const s in this.seqs) {
            if (this.seqs[s] !== 0 && (this.gaps[s].v * 100 > valGaps || this.ident1[s].v * 100 < valIdent)) {
                continue;
            }
            win.document.write('> ' + this.names[s] + nl);
            let seq = this.seqs[s];
            if (columns.length !== this.w) {
                seq = '';
                for (const p of Object.keys(columns)) {
                    seq += this.seqs[s].charAt(columns[p]);
                }
            }
            for (let p = 0; p < seq.length; p += 70) {
                win.document.write(seq.substr(p, 70) + nl);
            }
            win.document.write(nl);
        }
        win.document.write('</pre>\n');
        win.document.close();
    }

    //
    // TODO: gaps and identity computations should be moved out of asyncRender() into separate async function !!!
    //
    asyncRender() {
        for (let currN = 0; this.asyncCurrSeq < this.orderby.length && currN < this.asyncParseStop; this.asyncCurrSeq++, currN++) {
            const pageQ = this.asyncCurrSeq >= this.page.from && this.asyncCurrSeq <= this.page.to;
            const i = this.orderby[this.asyncCurrSeq];
            if (i && this.seqs[i].length !== this.seqs[i - 1].length) {
                if (this.cb) {
                    this.cb.fail('Parsing error: sequence #' + i + ' has different length');
                }
                return false;
            }
            const clrQ = this.clrSeqLimit ? i < this.clrSeqLimit : true;
            const gaps = this.parseSeqAndRenderHtml(pageQ, clrQ);
            const namelink = ParseSeqName(this.names[i]); // object returned
            if (isset(speclist)) {
                // species object has to be loaded (speclist.2012_09.js)
                let s = '';
                if (isset(speclist[namelink.org])) {
                    const code = speclist[namelink.org].k;
                    s += code + ' ' + speclist[namelink.org].e;
                    if (!this.rerenderQ) {
                        if (!this.specdist.children.hasOwnProperty(code)) {
                            this.specdist.children[code] = { name: code, size: 1, children: {} };
                            this.specdist.children[code].children[namelink.org] = { name: namelink.org, size: 1 };
                        } else {
                            this.specdist.children[code].size++;
                            if (!this.specdist.children[code].children.hasOwnProperty(namelink.org)) {
                                this.specdist.children[code].children[namelink.org] = { name: namelink.org, size: 1 };
                            } else {
                                this.specdist.children[code].children[namelink.org].size++;
                            }
                        }
                    }
                }
                if (pageQ) {
                    this.hspecies += s + '<br>';
                }
            }
            if (pageQ) {
                this.hnames += namelink.link + '<br>';
                this.hinfo += namelink.info + '<br>';
                this.hpfam += namelink.pfam + '<br>';
                this.hrows += i + 1 + '<br>';
                this.hrows2 += this.asyncCurrSeq + 1 + '<br>';
            }
            let ga = 0;
            let fi1 = undefined;
            let fi2 = undefined;
            if (this.rerenderQ) {
                // redrawing loaded msa, gaps and identity already calculated
                ga = 100 * this.gaps[i].v;
                fi1 = 100 * this.ident1[i].v;
                fi2 = 100 * this.ident2[i].v;
            } else {
                // new msa - calculate
                this.seqname2idx[namelink.name] = i;
                if (i === this.refseqIdx) {
                    this.refseqProtFrom = namelink.from;
                }
                let ident = 0;
                if (i !== this.refseqIdx) {
                    for (let k = 0; k < this.w; k++) {
                        if (this.seqs[this.refseqIdx].charAt(k) === '-' || this.seqs[i].charAt(k) === '-') {
                            continue;
                        }
                        if (this.seqs[this.refseqIdx].charAt(k) === this.seqs[i].charAt(k)) {
                            ident++;
                        }
                    }
                }
                const rga = gaps / this.w;
                const rfi1 = ident / this.w; // identity of ref.seq length
                const rfi2 = ident / (this.w - gaps); // identity of second sequence length
                ga = 100 * rga;
                fi1 = 100 * rfi1;
                fi2 = 100 * rfi2;
                this.ident1.push({ i: i, v: rfi1 });
                this.ident2.push({ i: i, v: rfi2 });
                this.gaps.push({ i: i, v: rga });
            }
            if (pageQ) {
                if (i === this.refseqIdx) {
                    const a = '<span class="tc1 tblheader" style="text-align:middle">ref.seq</span><br>';
                    this.hident1 += a;
                    this.hident2 += a;
                } else {
                    this.hident1 += fi1.toFixed(1) + '<br>';
                    this.hident2 += fi2.toFixed(1) + '<br>';
                }
                if (this.customweightsA.length) {
                    this.hcustomwA += this.customweightsA[i].v + '<br>';
                }
                if (this.customweightsB.length) {
                    this.hcustomwB += this.customweightsB[i].v + '<br>';
                }
                this.hgaps += ga.toFixed(1) + '<br>';
            }
            const prc = Math.floor((100 * this.asyncCurrSeq) / this.h);
            if (this.cb) {
                this.cb.progress('rendering MSA .. ' + prc + '%');
            }
        }
        if (this.asyncCurrSeq < this.orderby.length) {
            setTimeout($.proxy(this.asyncRender, this), this.asyncTimeout);
            return;
        }
        this.finalizeRender();
    }

    finalizeRender() {
        this.generateRuler();
        if (!this.identS1.length) {
            // call this once on loading new msa only
            // sorted descending gaps,identity; keep refseq first
            this.identS1 = [].concat(
                this.ident1[0],
                ...this.ident1.slice(1).sort(function(a, b) {
                    return b.v - a.v;
                }),
            );
            this.identS2 = [].concat(
                this.ident2[0],
                ...this.ident2.slice(1).sort(function(a, b) {
                    return b.v - a.v;
                }),
            );
            this.gapsS = [].concat(
                this.gaps[0],
                ...this.gaps.slice(1).sort(function(a, b) {
                    return b.v - a.v;
                }),
            );
            this.gapsMax = this.gapsS[1].v;
            this.identR = { min: this.identS1[this.identS1.length - 1].v, max: this.identS1[1].v };
            this.seqorder.ident1 = new Array();
            this.seqorder.ident2 = new Array();
            for (let k = 0; k < this.identS1.length; k++) {
                this.seqorder.ident1.push(this.identS1[k].i);
                this.seqorder.ident2.push(this.identS2[k].i);
            }
        }
        if (this.cb) {
            this.cb.progress('updating html...');
            // let progress window update, otherwise it's stuck at ugly 98% for couple of secs
            setTimeout($.proxy(this.cb.doneReading, this), this.asyncTimeout);
        }
    }

    generateRuler() {
        let s = ''; // should be a better way to do this to be honest
        for (let p = 1; p <= this.columns.length; p++) {
            const i = this.refseqProtFrom + p - 1;
            const Q = i % 10 === 0;
            const Q5 = !Q && i % 5 === 0;
            s += Q ? '|' : Q5 ? ':' : '.';
            if (!Q) {
                continue;
            }
            const sn = '' + i;
            const np = s.length - sn.length - 1; // where num starts
            if (np < 0) {
                continue;
            }
            s = s.substr(0, np) + sn + '|';
        }
        this.hruler = '.' + s;
        this.hruler = this.hruler.slice(0, -1); // this.hruler = s.replace(/ /g, '.');
    }

    // --- custom weights for sequences to allow custom sorting/annotations -------------------------------
    //
    // since weights file is trivial to simplify things we're not going to run it asynchronously
    // This function has duplicate code within itself (too much dependencies to program it using loops)
    loadCustomMsaDataFile(text, UIcallback) {
        this.customweightsN = 0; // how many mapped
        if (!this.h) {
            return;
        }
        const t = text.split(/[\r\n]/g);
        if (!t.length) {
            return;
        }
        this.seqorder.cweightsA = new Array();
        this.seqorder.cweightsB = new Array();
        this.customweightsA = new Array(this.h);
        this.customweightsB = new Array(this.h);
        for (const row of Object.keys(t)) {
            const w = t[row].split('\t');
            if (w.length < 2 || w.length > 3) {
                continue;
            }
            if (!this.seqname2idx.hasOwnProperty(w[0])) {
                continue;
            }
            const i = this.seqname2idx[w[0]];
            this.customweightsA[i] = w[1];
            this.customweightsB[i] = w[2];
        }

        let n_customweightsB = 0; // I have not decided a function for non 100% matching sequences between A and B
        for (let k = 0; k < this.h; k++) {
            if (!isset(this.customweightsA[k])) {
                this.customweightsA[k] = { i: k, v: '' };
            } else {
                this.customweightsN++;
                this.customweightsA[k] = { i: k, v: this.customweightsA[k] };
            }
            if (!isset(this.customweightsB[k])) {
                this.customweightsB[k] = { i: k, v: '' };
            } else {
                n_customweightsB++;
                this.customweightsB[k] = { i: k, v: this.customweightsB[k] };
            }
        }

        // custom weights sorted A
        this.cweightsS = [].concat(
            this.customweightsA[0],
            ...this.customweightsA.slice(1).sort(function(a, b) {
                if (isNaN(b.v) || isNaN(a.v)) {
                    return b.v < a.v ? 1 : -1;
                }
                return b.v - a.v;
            }),
        );
        for (let k = 0; k < this.cweightsS.length; k++) {
            this.seqorder.cweightsA.push(this.cweightsS[k].i);
        }
        this.hcustomwA = '';
        for (
            let i = this.page.from;
            i < this.page.to;
            i++ // this.orderby.length
        ) {
            this.hcustomwA += this.customweightsA[this.orderby[i]].v + '<br>';
        }

        // custom weights sorted B
        this.cweightsS = [].concat(
            this.customweightsB[0],
            ...this.customweightsB.slice(1).sort(function(a, b) {
                if (isNaN(b.v) || isNaN(a.v)) {
                    return b.v < a.v ? 1 : -1;
                }
                return b.v - a.v;
            }),
        );
        for (let k = 0; k < this.cweightsS.length; k++) {
            this.seqorder.cweightsB.push(this.cweightsS[k].i);
        }
        this.hcustomwB = '';
        for (
            let i = this.page.from;
            i < this.page.to;
            i++ // this.orderby.length
        ) {
            this.hcustomwB += this.customweightsB[this.orderby[i]].v + '<br>';
        }

        UIcallback();
    }

    // --- Load couplings for the alignment -------------------------------
    //
    // It loads the couplings sorted by importance to the user
    //
    loadCouplingsDataFile(text, UIcallback) {
        this.couplingsN = 0; // how many mapped
        if (!this.h) {
            return;
        }

        const rows = text.split(/\n/g);

        if (!rows || !rows.length || rows.length < 2) {
            return;
        }

        this.A = new Array();
        this.B = new Array();

        // The first row is the header
        // The last row is an empty space
        // Therefore it's L - 2
        this.couplingsN = rows.length - 2;

        rows.slice(1).forEach(row => {
            const columns = row.split(/,/g);

            if(columns.length < 9){
              return;
            }

            this.A.push(columns[0]);
            this.B.push(columns[2]);

            return;
        })

        UIcallback();
    }

    // --- conservation -----------------------------------------------------------------------------------
    asyncComputeConservation() {
        let ch = '';
        for (let currN = 0; this.asyncConsCol < this.w && currN < this.asyncConsStop; this.asyncConsCol++, currN++) {
            const i = this.asyncConsCol;
            this.gapsPerCol[i] = 0;
            this.entropyPerCol[i] = 0;
            this.symColHash[i] = {};
            for (let p = 0; p < this.h; p++) {
                ch = this.seqs[p].charAt(i);
                if (ch === '-') {
                    this.gapsPerCol[i]++;
                    continue;
                } // gaps not included into conservation
                if (!AA.hasOwnProperty(ch)) {
                    continue;
                }
                if (this.symColHash[i].hasOwnProperty(ch)) {
                    this.symColHash[i][ch]++;
                } else {
                    this.symColHash[i][ch] = 1;
                }
            }
            let func = 0;
            for (const key of Object.keys(this.symColHash[i])) {
                // entropy -- uses count instead of frequency (probability) to capture amount of information
                const freq = this.symColHash[i][key];
                func += freq * Math.log(freq);
            }
            this.entropyPerCol[i] = func;
            this.entropyRange.update(func);
        }
        if (this.cb) {
            this.cb.progress('computing conservation, column ' + this.asyncConsCol + ' / ' + this.w);
        }
        if (this.asyncConsCol < this.w) {
            setTimeout($.proxy(this.asyncComputeConservation, this), this.asyncTimeout);
            return;
        }
        this.readyQ = true;
        // let progress window update, otherwise it's stuck at incomplete column progress for couple of secs
        if (this.cb) {
            setTimeout($.proxy(this.cb.doneComputing, this), this.asyncTimeout);
        }
    }

    // --- plot on top of msa --------------------------------------------------------------------
    redrawConservationPlot(plot_div_id, width) {
        if (!this.readyQ || !this.entropyPerCol.length) {
            return;
        }
        const conservationPlotElement = d3.select(plot_div_id);
        const svg = conservationPlotElement
            .append('svg')
            .attr('width', width)
            .attr('height', this.raH);
        const rowW = width / this.columns.length; // .w;
        const rowWL = rowW / 3;
        const rowWR = 2 * rowWL;
        let y = 0;
        for (let p = 0; p <= 10; p++) {
            // grid
            y = Math.floor((this.raH * p) / 10) + 0.5;
            svg
                .append('line')
                .attr('x1', 0)
                .attr('y1', y)
                .attr('x2', width)
                .attr('y2', y)
                .attr('stroke-width', 0.5)
                .attr('stroke', 'slateblue');
            //this.ra.path('M0 '+y+' L '+width+' '+y).attr({ stroke: '#b1b4dd', 'stroke-width':'1px' });
        }
        //	if (p==3) console.log('entropy:' + rt + ' bar:' + barH + ' total:' + this.raH);
        for (const p of Object.keys(this.columns)) {
            let barH = this.raH * (msa.gapsPerCol[this.columns[p]] / msa.h);
            svg
                .append('rect')
                .attr('x', this.columns[p] * rowW)
                .attr('y', this.raH - barH)
                .attr('width', rowWL)
                .attr('height', this.raH)
                .attr('fill', '#a1b4cc');
            // this.ra.rect(p * rowW, this.raH-barH, rowWL, this.raH)
            //   .attr({ stroke: 'none', fill: '#a1b4cc', shapeRendering: 'crispEdges' });
            const rt = (msa.entropyPerCol[this.columns[p]] - msa.entropyRange.min) / msa.entropyRange.width;
            barH = this.raH * rt;
            svg
                .append('rect')
                .attr('x', this.columns[p] * rowW + rowWL)
                .attr('y', this.raH - barH)
                .attr('width', rowWR - 1)
                .attr('height', this.raH)
                .attr('fill', '#585989');
            //				var b = { l:p * rowW + rowWL, t:this.raH-barH, w:rowWR-1, h:this.raH }
            //				this.ra.rect(b.l, b.t, b.w, b.h).attr({ stroke: 'none', fill: '#585989', shapeRendering: 'crispEdges' });
        }
    }

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
    resetPairwise() {
        this.pwhash = {};
        this.pwseqmin = new Array();
        this.pwseqmax = new Array();
        this.pwseqavg = new Array();
        this.pairi = this.pairj = this.pairn = this.pairt = 0;
        this.pwQ = this.pwdoneQ = false;
    }

    // cbpw -- callback object, has to implement { function start(), function progress(), function done(flag) }
    // flag indicates if job is 100% completed, false if canceled in the middle
    startPairwiseIdentity() {
        this.pwhash = {};
        this.pairi = this.pairn = 0;
        this.pairj = 1;
        this.pairt = Math.floor((this.h * (this.h - 1)) / 2);
        this.pwQ = true; // pairwise running flag
        setTimeout($.proxy(this.anyncPairwiseIdentity, this), this.asyncTimeout);
        if (this.cbpw) {
            this.cbpw.start();
        }
    }

    togglePairwiseIdentity() {
        if (this.pwQ) {
            this.pwQ = false;
            this.resetPairwise();
            if (this.cbpw) {
                this.cbpw.done(false);
            }
        } else {
            this.startPairwiseIdentity();
        }
    }

    anyncPairwiseIdentity() {
        if (!this.pwQ) {
            return;
        }
        let doneQ = false;
        for (let np = 0; np < this.asyncConsStop; np++) {
            let ident = 0;
            for (let p = 0; p < this.w; p++) {
                const ch1 = this.seqs[this.pairi].charAt(p);
                const ch2 = this.seqs[this.pairj].charAt(p);
                if (ch1 === '-' || ch2 === '-') {
                    continue;
                }
                if (!aaclr.defaultClasses.hasOwnProperty(ch1) || !aaclr.defaultClasses.hasOwnProperty(ch2)) {
                    continue; // both are valid AA
                }
                if (ch1 === ch2) {
                    ident++;
                }
            }
            const id = this.pairi + ',' + this.pairj;
            this.pwhash[id] = ident / this.w;
            this.pairn++;
            if (this.pairj + 1 !== this.h) {
                this.pairj++;
            } else if (this.pairi + 1 !== this.h - 1) {
                this.pairi++;
                this.pairj = this.pairi + 1;
            } else {
                doneQ = true;
                break;
            }
        }
        const f = ((100 * this.pairn) / this.pairt).toFixed(0);
        if (this.cbpw) {
            this.cbpw.progress(' ... pass1 : ' + msa.pairn/msa.pairt*50 + ' %');
        }
        if (!doneQ) {
            setTimeout($.proxy(this.anyncPairwiseIdentity, this), this.asyncTimeout);
            return;
        }
        this.pairi = this.pairj = this.pairn = 0;
        this.anyncPairwiseIdentityPass2();
    }

    getPairIdentity(i, j) {
        const id = i > j ? j + ',' + i : i + ',' + j;
        return this.pwhash[id];
    }

    // computes min,max,avg identity for each sequence
    anyncPairwiseIdentityPass2() {
        if (!this.pwQ) {
            return;
        }
        let avg = 0;
        const r = getRangeUpdate();
        for (let j = 0; j < this.h; j++) {
            if (j === this.pairi) {
                continue;
            }
            const id = this.pairi > j ? j + ',' + this.pairi : this.pairi + ',' + j;
            if (!this.pwhash.hasOwnProperty(id)) {
                console.log('FATAL error, pairwise hash ID not found: ' + id);
                this.pwQ = false;
                return false;
            }
            const idnt = this.pwhash[id];
            r.update(idnt);
            avg += idnt / (this.h - 1);
        }
        this.pwseqmin[this.pairi] = r.min;
        this.pwseqmax[this.pairi] = r.max;
        this.pwseqavg[this.pairi] = avg;
        if (this.cbpw) {
            this.cbpw.progress(' ... pass2 : ' + msa.pairi/msa.h*50 + '%');
        }
        this.pairi++;
        if (this.pairi < msa.h) {
            setTimeout($.proxy(this.anyncPairwiseIdentityPass2, this), this.asyncTimeout);
            return;
        }
        console.log('sorting pairwise plots... ' + this.pwseqmin.length + ',' + this.pwseqmax.length + ',' + this.pwseqavg.length);
        this.pwseqminS = this.pwseqmin.slice().sort(function(a, b) {
            return b - a;
        });
        this.pwseqmaxS = this.pwseqmax.slice().sort(function(a, b) {
            return b - a;
        });
        this.pwseqavgS = this.pwseqavg.slice().sort(function(a, b) {
            return b - a;
        });
        this.pwminR = { min: this.pwseqminS[this.pwseqminS.length - 1], max: this.pwseqminS[0] };
        this.pwmaxR = { min: this.pwseqmaxS[this.pwseqmaxS.length - 1], max: this.pwseqmaxS[0] };
        this.pwavgR = { min: this.pwseqavgS[this.pwseqavgS.length - 1], max: this.pwseqavgS[0] };
        this.pwQ = false;
        this.pwdoneQ = true;
        if (this.cbpw) {
            this.cbpw.done(true);
        }
    }

    // identThr - threshold to link nodes
    // unconnected nodes not shown
    buildPairwiseIdentityGraph(identThr) {
        if (!this.pwseqmin.length) {
            return false;
        }
        const gra = { nodes: new Array(), links: new Array() };
        const map = {}; // skipping unconnected nodes, sequence index --> node index
        let mapIdx = 0;
        for (const id in this.pwhash) {
            if (this.pwhash[id] < identThr) {
                continue;
            }
            const w = id.split(',');
            const s1 = +w[0];
            const s2 = +w[1];
            let i1 = 0;
            let i2 = 0;
            if (!map.hasOwnProperty(s1)) {
                i1 = mapIdx++;
                map[s1] = i1;
                gra.nodes.push({});
            } else {
                i1 = map[s1];
            }
            if (!map.hasOwnProperty(s2)) {
                i2 = mapIdx++;
                map[s2] = i2;
                gra.nodes.push({});
            } else {
                i2 = map[s2];
            }
            gra.links.push({ source: i1, target: i2, value: this.pwhash[id] });
        }
        return gra;
    }
}
