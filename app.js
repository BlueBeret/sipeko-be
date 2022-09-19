const express = require("express");
var bodyParser = require('body-parser')
const db = require('./src/db.js') 
const fileUpload = require('express-fileupload');

var app = express();
const HTTP_PORT = 8000

app.use(fileUpload({
    createParentPath: true
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 
  


app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});

app.get("/", (req, res) => {
    res.status(200).json('ok')
})

// route /event

app.get("/event", (req, res) => {
    db.all("SELECT * FROM event ", (err, row) => {
        if (err) {
            res.status(400).json({ 'err': err.message })
            return
        }
        res.status(200).json(row)
    })
})

app.get("/event/:id", (req, res) => {
    db.get("SELECT * FROM event where eid = ?", [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ 'error': err.message })
            return
        }
        res.status(200).json(row)
    })
})

app.post("/event/add", (req, res) => {
    const { eid, nama, thn_pmlh, jml_pmlh } = req.body
    const query = "INSERT INTO event('eid', 'nama', 'thn_pmlh', 'jml_pmlh') VALUES(?,?,?,?)"
    db.run(query, [eid, nama, thn_pmlh, jml_pmlh], (err, row) => {
        if (err) {
            res.status(500).json({ 'err': err.message })
            return
        }
        res.status(200).json('ok')
    })
})

app.delete("/event/:id", (req, res) => {
    db.run('DELETE FROM event where eid = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ 'err': err.message })
            return
        }
        res.status(200).json('ok')
    })
})


// route siswa
app.get("/siswa", (req, res) => {
    db.all('SELECT * FROM SISWA WHERE npsn = ?', [1], (err, row) => {
        if (err) {
            res.status(500).json({ 'err': err.message })
            return
        }
        res.status(200).json(row)
    } )
})

app.post("/siswa", (req, res) => {
    // datasiswa
    const buffer = req.files.datasiswa.data.toString()
    const data = JSON.parse(buffer)
})