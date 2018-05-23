FROM cannin/nodejs-http-server

RUN mkdir /alignmentviewer
COPY * /alignmentviewer/

CMD http-server .
