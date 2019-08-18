class KMinsClustering {
  constructor() {
    this.clusters = []; // list of data point indicies per cluster
    this.centroids = [];
    this.sumsqua = 0; // sum of squares of distances to each centroid after current iteration
    this.minsumsqua = 0; // minimizing sum of squares
    this.bbox = undefined; // data bounding box
    this.data = false; // reference to user data
    this.clu = {}; // saved clustering
  }

  initCentroids(N, data) {
    this.data = data;
    this.clusters = [];
    this.centroids = [];
    const hash = {};
    for (let k = 0; k < N; k++) {
      const i = Math.floor(Math.random() * data.length);
      if (isset(hash[data[i]])) {
        continue;
      }
      this.centroids.push(data[i]);
      hash[data[i]] = 1;
    }
    console.log('number of centroids = ' + this.centroids.length);
  }

  // N - number of clusters
  initRandomCentroids(N, data) {
    this.data = data;
    this.bbox = getRangeUpdate();
    for (let k = 0; k < data.length; k++) {
      this.bbox.update(data[k]);
    }
    for (let k = 0; k < N; k++) {
      const p = this.bbox.min + Math.random() * this.bbox.width;
      //	if (k==0) p = 2.8; else if (k==1) p = 7.2;
      this.centroids.push(p);
    }
  }

  assign() {
    // assign() changes amount of clusters and centroids
    this.clusters = [];
    for (let i = 0; i < Object.keys(this.centroids).length; ++i) {
      this.clusters.push(new Array());
    }

    for (const k of Object.keys(this.data)) {
      let dist = 1e6;
      let nearest = 0;
      for (const c of Object.keys(this.centroids)) {
        const d = Math.abs(this.centroids[c] - this.data[k]);
        if (d < dist) {
          dist = d;
          nearest = this.centroids[c];
        }
      }
      // console.log(`nearest for point #${k}, ${this.data[k]} --> cluster #${nearest}, cent=${this.centroids[nearest]}`);
      this.clusters[nearest].push(k);
    }
    // delete empty clusters
    for (let k = this.clusters.length - 1; k >= 0; k--) {
      if (this.clusters[k].length) {
        continue;
      }
      this.clusters.splice(k, 1);
      this.centroids.splice(k, 1);
    }
  }

  getNewCentroids() {
    let anyoneMovedQ = false;
    for (const c of Object.keys(this.clusters)) {
      let avg = 0;
      for (const k of Object.keys(this.clusters[c])) {
        avg += this.data[this.clusters[c][k]];
      }
      avg /= this.clusters[c].length;
      if (Math.abs(this.centroids[c] - avg) > 1e-6) {
        anyoneMovedQ = true;
      }
      this.centroids[c] = avg;
    }
    return anyoneMovedQ;
  }

  getSumOfSquares() {
    this.sumsqua = 0;
    for (const c of Object.keys(this.clusters)) {
      let sum = 0;
      for (const k of Object.keys(this.clusters[c])) {
        sum += (this.data[this.clusters[c][k]] - this.centroids[c]) * (this.data[this.clusters[c][k]] - this.centroids[c]);
      }
      this.sumsqua += sum;
    }
    return this.sumsqua;
  }

  runOneIteration() {
    while (true) {
      this.assign();
      if (!this.getNewCentroids()) {
        break;
      }
    }
  }

  runAllIterations(Nclu, data) {
    this.minsumsqua = 1e6;
    for (let n = Nclu; n > 0; n--) {
      console.log('------- iteration Nclu=' + n + '----------');
      this.initCentroids(n, data);
      this.runOneIteration();
      const sum = this.getSumOfSquares();
      console.log(this.getClusteringStr());
      const diff = sum - this.minsumsqua;
      if (diff < 1e-6) {
        // less OR equal pick current
        this.minsumsqua = sum;
        this.saveCurrentClu();
      }
    }
    this.restoreClu();
  }

  // --------------------------------- utils ------------------
  saveCurrentClu() {
    this.clu.clusters = this.clusters.slice();
    this.clu.centroids = this.centroids.slice();
    this.clu.sumsqua = this.sumsqua;
  }

  restoreClu() {
    this.clusters = this.clu.clusters.slice();
    this.centroids = this.clu.centroids.slice();
    this.sumsqua = this.clu.sumsqua;
  }

  getClusteringStr() {
    let out = '';
    for (const c of Object.keys(this.clusters)) {
      out += 'clu #' + c + ' : cent=' + this.centroids[c] + ' [ ';
      for (const k of Object.keys(this.clusters[c])) {
        out += this.data[this.clusters[c][k]] + ' ';
      }
      out += ']\n';
    }
    out += 'sum of squares == ' + this.sumsqua + '\n';
    return out;
  }
}
