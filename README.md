![alignment viewer logo](/alignlogo.png)

AlignmentViewer is multiple sequence alignment viewer for protein families with flexible visualization, analysis tools and links to protein family databases. It is directly accessible in web browsers without the need for software installation, as it is implemented in JavaScript, and does not require an internet connection to function.  It can handle protein families with tens of thousand of sequences and is particularly suitable for evolutionary coupling analysis, preparing the computation of protein 3D structures and detection of functionally constrained interactions.

# Installation

AlignmentViewer runs completely locally. There is no installation beyond downloading the files and using a compatible browser.

Clone directory locally and open "index.html"

You can also use it without cloning the repository by accessing http://alignmentviewer.org

# Quick Start
You can see how it works by using an example situated in the examples folder.

## Troubleshooting
This section will include helpful notes based on user feedback for problems encountered:

* Make sure your input file contains >= 2 sequences

# Run with Docker
```
docker rm -f alignmentviewer; docker run --name alignmentviewer -p 8080:8080 -w /src -t cannin/alignmentviewer
```

# Contributors

EVcouplings is developed in the lab of [Chris Sander](http://sanderlab.org/) at Harvard Medical School and Dana-Farber Cancer Institute.

* [Roc Reguant](mailto:alignmentviewer@gmail.com) (development lead)
* Jenya Antipin
* Rob Sheridan
* Augustin Luna
* Chris Sander
* Christian Dallago
