const fastify = require("fastify");
const fastifyStatic = require('@fastify/static');
const ejs = require('ejs');

const { WebSocketServer } = require("ws");

const path = require("path");
const Router = require('find-my-way');
const { Server } = require('socket.io');

const wss = new WebSocketServer({ noServer: true });
const { Readable } = require('stream');
const appendField = require('append-field').default;

const setTypeResponse = (req, reply) => {
    const accept = req.accepts();
    const ext = path.extname(req.url);

    if (ext) {
        if (ext.includes('htm')) {
            reply.type("text/html");
            req.responseType = "text/html";

            return;
        }

        if (ext.includes('css')) {
            reply.type("text/css");
            req.responseType = "text/css";

            return;
        }

        if (ext.includes('json')) {
            reply.type("application/json");
            req.responseType = "application/json";

            return;
        }

        if (ext.includes('js')) {
            reply.type("application/javascript");
            req.responseType = "application/javascript";

            return;
        }


        return;
    }

    if (accept.type("html")) {
        if (reply !== false) {
            reply.type("text/html");
            req.responseType = "text/html";

            return;
        }
    }

    if (accept.type("css") || ext.includes('css')) {
        if (reply !== false) {
            reply.type("text/css");
            req.responseType = "text/css";
            return;
        }
    }

    if (accept.type("javascript")) {
        if (reply !== false) {
            reply.type("application/javascript");
            req.responseType = "application/javascript";

            return;
        }
    }

    if (accept.type("json")) {
        if (reply !== false) {
            reply.type("application/json");
            req.responseType = "application/json";

            return;
        }
    }
};


const web = function (options) {
    const $this = this;


    fst.server.on("upgrade", (req, socket, head) => {

        if (req.url.startsWith("/socket.io/?EIO=")) {
        } else {

            const sys = web.ws(socket.localPort);

            if (!sys) {
                socket.destroy();
                return;
            }

            const match = sys.find('GET', req.url);

            if (match) {
                const store = match.store;

                match.handler(req, (valid) => {

                    if (valid instanceof Error) {
                        socket.destroy(valid);
                        return;
                    }

                    if (valid === false) {
                        socket.destroy();
                        return;
                    }

                    store.handleUpgrade(req, socket, head, (ws) => {
                        store.emit("connection", ws, req);
                    });
                })

            } else {
                socket.destroy();
                return;
            }

        }
    });

    web.servers.set(this.id, {
        port: this.port,
        fastify: fst,
        // io: io,
        uws: null,
        ws: Router()
    });

    return this;
};

web.prototype.fastify = function () {
    const fastify = web.fastify(this.id);

    return fastify;
}

web.prototype.io = function () {
    const io = web.io(this.id);

    if (io) return io;
    return false;
}

web.prototype.ws = function (path, cb) {

    const route = web.ws(this.id);

    const match = route.find('GET', path);

    if (match) {

        return match.store;

    } else {
        const ws = new WebSocketServer({ noServer: true });

        route.on('GET', path, cb, ws)

        return ws;
    }

}

web.fastify = function (id) {
    if (servers.has(id)) {
        return servers.get(id).fastify;
    }

    for (let [i, dt] of servers.entries()) {


        if (dt.port == id) {
            return dt.fastify;
        }
    }

};

web.io = function (id) {
    if (servers.has(id)) {
        return servers.get(id).io;
    }

    for (let [i, dt] of servers.entries()) {


        if (dt.port == id) {
            return dt.io;
        }
    }

};

web.ws = function (id) {
    if (servers.has(id)) {
        return servers.get(id).ws;
    }

    for (let [i, dt] of servers.entries()) {

        if (dt.port == id) {
            return dt.ws;
        }
    }

};

const servers = new Map();

const Web = function (id) {

    return servers.get(id);

}

const init = function (options) {
    const fst = fastify({
        ajv: {
            customOptions: {
                // jsonPointers: true,
                allErrors: true,
                // messages: false,
                strict: false
            },
            plugins: [require('ajv-errors')]
        }
    });

    fst.register(require('@fastify/accepts'))
    fst.register(require("@fastify/formbody"));
    fst.register(require("@fastify/multipart"));

    if (options.jwt) {
        fst.register(require("@fastify/jwt"), options.jwt);
    }

    if (options.cookie) {
        fst.register(require("@fastify/cookie"), options.cookie);
    }

    // fst.addContentTypeParser('*', function (req, payload, done) {
    fst.addContentTypeParser('application/octet-stream', function (req, payload, done) {
        done(null, payload); // payload tetap stream
    });

    if (options.static) {

        if (Array.isArray(options.static)) {

            for (let stc of options.static) {
                fst.register(fastifyStatic, stc);
            }

        } else if (typeof options.static == 'object') {
            fst.register(fastifyStatic, options.static);
        }

    }


    fst.addHook("onRequest", async (req, reply) => {
        setTypeResponse(req, reply);
    });

    fst.addHook("preHandler", async (req, reply) => {
        // console.log('handle')
    });

    // fst.addHook("preParsing", async (req, reply, payload) => {
    //     const tipe = req.headers["content-type"] || "";

    //     console.log('asasa', tipe);

    //     return payload;
    // });


    fst.addHook("preValidation", async (req, res) => {
        const tipe = req.headers["content-type"] || "";
        const body = Object.create(null);


        if (tipe.includes("multipart/form-data")) {
            const parts = req.parts();

            for await (const part of parts) {
                if (part.file) {
                } else {
                    try {
                        appendField(body, part.fieldname, part.value);
                    } catch (error) {
                        console.log('e', error.message)
                    }

                }
            }

            req.body = body;

        } else if (tipe.includes('application/octet-stream')) {

            const chunks = [];
            for await (const chunk of req.body) {
                chunks.push(chunk);
            }

            req.body = Buffer.concat(chunks);
        } else {

            if (typeof req.body == 'object') {

                for (let [obj, v] of Object.entries(req.body)) {

                    appendField(body, obj, v);
                }

                req.body = body;
            }


        }
    });

    // fst.addHook("onError", (req, reply) => {


    //     const tipe = reply.getHeader('Content-Type');
    //     console.log('on error', tipe);

    //     reply.send('On error');
    // })

    fst.setErrorHandler((error, req, reply) => {
        const tipe = req.responseType;// reply.getHeader('Content-Type');

        reply.status(500);

        if (tipe.includes('json')) {

            if (error.validation) {
                const err = error.validation[0];

                return { oke: false, message: err.message }
            }

            return error;
        }

        return "error " + error.message;
    });

    fst.setNotFoundHandler((req, reply) => {
        const tipe = reply.getHeader('Content-Type');

        reply.status(404);

        if (tipe.includes('json')) {

            if (typeof options?.error?.[404]?.json == 'function') {
                return options?.error?.[404]?.json(req.url);
            }

            return {
                oke: false,
                message: 'Page Not Found'
            }
        }

        if (tipe.includes('html')) {
            if (typeof options?.error?.[404]?.json == 'function') {
                return options?.error?.[404]?.html(req.url);
            }

            return `<h2 style="text-align: center; border-bottom: 1px solid;padding: 2rem;">Page Not Found</h2>`;
        }

        return "error " + tipe;
    });


    this.port = options.port || 0;
    this.id = options.id || this.port;
    this.fastify = fst;

    servers.set(this.id, this);

    return this;
}

init.prototype.start = function (cb) {

    this.fastify.listen({ port: this.port, host: "0.0.0.0" }, (err, addr) => {
        if (typeof cb == "function") {
            cb(err, addr);
        }
    });
};

Web.Init = init;
Web.ejs = (str, param) => {
    return ejs.render(str, param || {});
}

module.exports = Web;
