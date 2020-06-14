const express = require("express");
let WebTorrent = require('webtorrent')
const StreamBodyParser = require('stream-body-parser')
const Transcoder = require('stream-transcoder');
const ffmpeg = require('fluent-ffmpeg')
const app = express();

const port = process.env.PORT || 8000;

const client = new WebTorrent();

app.listen(port, "192.168.56.1", () => {
    console.log("PORT: " + port);
})

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})
app.get("/stream", (req, res) => {
    console.log("BLAM")
    const torrentId = __dirname + "/onepace.torrent";
    const tor = client.get("2140e49be7a2cef9bcb9109c1d797e17e7e2ff2b");
    if (tor) {
        console.log("sSuccessfullyAdded")
        const file = tor.files[0];
        let range = req.headers.range;
        let positions = range.replace(/bytes=/, "").split("-");
        let file_size = file.length;
        let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
        let start = parseInt(positions[0], 10);
        let chunksize = (end - start) + 1;
        let head = {
            "Content-Range": "bytes " + start + "-" + end + "/" + file_size,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mp4"
        }
        res.writeHead(206, head);
        let stream_position = {
            start: start,
            end: end
        }
        let stream = file.createReadStream(stream_position)
        stream.pipe(res);
        return;

    }
    client.add(torrentId, (torrent) => {
        console.log("sSuccessfullyAdded")
        const file = torrent.files[0];
        let range = req.headers.range;
        let positions = range.replace(/bytes=/, "").split("-");
        let file_size = file.length;
        let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
        let start = parseInt(positions[0], 10);
        let chunksize = (end - start) + 1;
        let head = {
            "Content-Range": "bytes " + start + "-" + end + "/" + file_size,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mp4"
        }
        res.writeHead(206, head);
        let stream_position = {
            start: start,
            end: end
        }
        let stream = file.createReadStream(stream_position)





        stream.pipe(res);
        console.log("done");
    });
});

app.get("/debug", (req, res) => {
    console.log(client.torrents);
    res.text(client.torrent);
})