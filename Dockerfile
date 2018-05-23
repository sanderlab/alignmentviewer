FROM cannin/nodejs-http-server

COPY * /alignmentviewer

CMD http-server .
