const express = require("express");
let WebTorrent = require('webtorrent')
const StreamBodyParser = require('stream-body-parser')
const Transcoder = require('stream-transcoder');
const ffmpeg = require('fluent-ffmpeg')
const app = express();
const cors = require('cors');

app.use(cors());
// fix cors

const port = process.env.PORT || 8000;

const client = new WebTorrent();

app.use(express.static('static'))

app.listen(port, () => {
    console.log("PORT: " + port);
})

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})
app.post("/getMedias", async (req, res) => {
    console.log("CALL");
    let torrent;
    if (client.torrents.length == 0) {
        torrent = await torrentAddPromiseWrapper(__dirname + "/batch.torrent");
    } else {
        torrent = client.torrents[0];
    }
    const medias = torrent.files.map(file => {
        return {
            name: file.name,
            path: `/stream/${file.name}`

        }
    });

    res.json({
        medias: medias
    });
});

app.get("/stream/:index", (req, res) => {
    console.log("start")
    const index = req.params.index;
    console.log(index);

    if (!client.torrents[0]) {
        return;
    }
    let file = client.torrents[0].files[index]
    console.log(file.name);


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


})
/* app.get("/stream", (req, res) => {
    console.log("BLAM")
    const torrentId = __dirname + "/batch.torrent";
    const tor = client.get("432ee39bf5f6ffa876928cfec5ec8dd07e7eda00");
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
}); */

app.get("/debug", (req, res) => {
    console.log(client.torrents);
    res.text(client.torrent);
})

async function torrentAddPromiseWrapper(torrentId) {

    return new Promise((resolve, reject) => {
        client.add(torrentId, (torrent) => {

            resolve(torrent);
        })
    })
}