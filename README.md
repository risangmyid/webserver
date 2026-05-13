
# Web Server dengan Fastify

Webserver untuk nodejs. bisa multi port.




## Features

- Include Web Socket, Socket.IO
- Body Bisa Buffer atau Bisa terima File Upload
- Multiple PORT
- Auto response type

## Installation

Install my-project with npm

```bash
  npm install risang-server
```
    
## Usage/Examples

Index.js

```javascript

const web = require('risang-webserver');
const path = require('path');

const main = new web.Init({
    id: 'MAIN',
    port: 3006,
    socketIO: true,
    jwt: {
        secret: 'main'
    },
    cookie: {
        secret: 'main'
    },
    static: [
        {
            root: path.join(process.cwd(), 'assets'),
            prefix: '/assets/',
        },
        {
            root: path.join(process.cwd(), 'tmp/script'),
            prefix: '/scripts/',
            decorateReply: false
        }
    ]
})

const test = new web.Init({
    id: 'TEST',
    port: 3008,
    socketIO: true,
    jwt: {
        secret: 'test'
    },
    cookie: {
        secret: 'test'
    },
    static: [
        {
            root: path.join(process.cwd(), 'assets'),
            prefix: '/assets/',
        },
        {
            root: path.join(process.cwd(), 'tmp/script'),
            prefix: '/scripts/',
            decorateReply: false
        }
    ]
})

```

Setup File Route:

```javascript

const web = require("risang-webserver");

const main = web("MAIN");
const fastifyMain = main.fastify;

fastifyMain.get('/', ()=> ...);
.....

const test = web("TEST");
const fastifytest = test.fastify;

fastifytest.get('/', ()=> ...);
.....


//Run Server
main.start((err, addr) => {
  console.log("main", addr);
});

test.start((err, addr) => {
  console.log("test", addr);
});

```
