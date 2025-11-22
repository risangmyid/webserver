const { WebSocket } = require('ws');

const ws = new WebSocket('ws://127.0.0.1:9090/coba/123');//http://127.0.0.1:62954

ws.on('open', () => {
    console.log('open')
})

ws.on('close', (a) => {
    console.log('close', a)
})

ws.on('error', (a) => {
    console.log('gagal connect', a);
})