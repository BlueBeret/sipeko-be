const express = require("express");
var bodyParser = require('body-parser')
const db = require('./src/db.js')
const fileUpload = require('express-fileupload');
const { query } = require("express");

const fs = require('fs')

var app = express();
const HTTP_PORT = 8000

app.use(fileUpload({
    createParentPath: true
}));
app.use(express.static('static'))

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

// route /calon
app.post('/calon', (req, res) => {
    const { eid, sid, visi, misi } = req.body
    const img = req.files.img
    const filename = '/public/calon/' + eid + "-" + sid + ".png"
    fs.writeFileSync(__dirname+filename, img.data, (err) => {
        if (err) {
            res.status(500).json('error saving image file')
        } 
    })
    db.run("INSERT INTO calon(eid, sid, visi, misi, img) VALUES(?,?,?,?,?)", [eid, sid, visi, misi, filename], (err, row) => {
        if (err) {
            res.status(500).json({ err: err.message })
            return
        }
        res.status(200).json('ok')
    })
    
})

app.patch('/calon', (req, res) => {
    const { eid, sid, visi, misi } = req.body
    const filename = '/public/calon/' + eid + "-" + sid + ".png"
    if (req.files) {
        fs.writeFileSync(__dirname+filename, req.files.img.data, (err) => {
            if (err) {
                res.status(500).json('error saving image file')
            } 
        })
    }

    db.run("UPDATE calon SET visi = ?, misi = ? where eid = ? and sid = ?"
    [visi, misi, eid, sid],
        (err, row) => {
            if (err) res.status(500).json('error update db')
            else res.status(200).json('ok')
        }) 
})

app.get('/calon/:eid', (req, res) => {
    const eid = req.params.eid
    db.all("SELECT * FROM calon where eid = ?", [eid], (err, row) => {
        if (err) res.status(400).json({ err: err.message })
        else res.status(200).json(row)
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
    })
})

app.post("/siswa", (req, res) => {
    // datasiswa
    var data;
    try {
        const buffer = req.files.datasiswa.data.toString()
        data = JSON.parse(buffer)
    } catch (error) {
        res.status(400).json({ err: error })
        return
    }

    try {
        data.forEach((siswa) => {
            const query = 'INSERT INTO siswa(sid,nama,tahun,kodeakses) VALUES(?,?,?,?)'
            db.run(query, [siswa.sid, siswa.name, siswa.tahun, siswa.kodeakses], (err, row) => {
                if (err) {
                    if (err.errno != 19) {
                        throw err
                    }
                }
            })
        })
        res.status(200).json('ok')
    } catch (e) {
        console.log('error' + e)
        res.status(500).json({ err: e })
        return
    }
})

app.delete("/siswa/:sid", (req, res) => {
    db.run("DELETE FROM siswa WHERE sid = ?", [req.params.sid], (err, row) => {
        if (err) {
            res.status(500).json({ err: err.message })
            return
        } else {
            res.status(200).json('ok')
        }
    })
})

