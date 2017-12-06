FROM cannin/nodejs-http-server

COPY * /src/

CMD http-server .
