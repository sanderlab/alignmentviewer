# AlignmentViewer

Protein multiple sequence alignment visualization & analysis

# Installation

AlignmentViewer runs completely locally. There is no installation beyond downloading the files and using a compatible browser.

Clone directory locally and open "index.html"

You can also use it without cloning the repository by accessing http://alignmentviewer.org

# Quick Start
You can see how it works by using an example situated in the examples folder.

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
