const express = require("express");
var bodyParser = require('body-parser')
const db = require('./src/db.js')
const fileUpload = require('express-fileupload');
const { query } = require("express");
const session = require('express-session')
const cors = require('cors')

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

var allowedOrigins = ['http://localhost:3000',
                      'https://lurifos.dev'];app.use(cors({
  origin: function(origin, callback){    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }    return callback(null, true);
  }
}));


app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});

app.get("/", (req, res) => {
    res.status(200).json('ok')
})

app.use(session(
    {
        secret: '31984089157578521734089125089',
        resave: true,
        saveUninitialized: false
    }
))

// route /event

app.get("/event", (req, res) => {
    db.all("SELECT * FROM event where npsn = ?", [req.session.npsn], (err, row) => {
        if (err) {
            res.status(400).json({ 'err': err.message })
            return
        }
        res.status(200).json(row)
    })
})

app.get("/event/:id", (req, res) => {
    db.get("SELECT * FROM event where eid = ? AND npsn = ?", [req.params.id, req.session.npsn], (err, row) => {
        if (err) {
            res.status(400).json({ 'error': err.message })
            return
        }
        res.status(200).json(row)
    })
})

app.post("/event/add", (req, res) => {
    const { eid, nama, thn_pmlh, jml_pmlh } = req.body
    console.log(nama)
    const query = "INSERT INTO event( 'nama', 'thn_pmlh', 'jml_pmlh', 'npsn') VALUES(?,?,?,?)"
    db.run(query, [ nama, thn_pmlh, jml_pmlh, req.session.npsn], (err, row) => {
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


// TODO: check that the admin have rights
// route /calon
app.post('/calon', (req, res) => {
    const { eid, sid, visi, misi } = req.body
    const img = req.files.img
    const filename = '/public/calon/' + eid + "-" + sid + ".png"
    fs.writeFileSync(__dirname+'/static/'+filename, img.data, (err) => {
        if (err) {
            res.status(500).json('error saving image file')
            console.log(err)
        } 
    })
    db.run("INSERT INTO calon(eid, sid, visi, misi, img) VALUES(?,?,?,?,?)", [eid, sid, visi, misi, filename], (err, row) => {
        if (err) {
            res.status(500).json({ err: err.message })
            console.log(err)
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
    db.all("SELECT * FROM calon NATURAL JOIN siswa where calon.eid = ?", [eid], (err, row) => {
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
            db.run(query, [siswa.sid, siswa.name, siswa.tahun, siswa.sid], (err, row) => {
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


// route vote
app.post('/vote', (req, res) => {
    const { sidc } = req.body
    const { eid, sid } = req.session
    console.log(req.session)
    // event id, siswa id, siswa id calon
    db.run("INSERT INTO pmlh_event(eid, sid) VALUES(?,?)", [eid, sid], (err, row) => {
        if (err) res.status(500).json({ 'err': err.message })
        else {
            db.run("UPDATE calon SET score = score + 1 WHERE eid = ? AND sid = ?", [eid, sidc], (err, row) => {
                if (err) res.status(500)({ 'err': err.message })
                else {
                    res.status(200).json('ok')
                }
            })
        }
    })
})

app.get('/vote/calon', (req, res) => {
    const eid = req.session.eid
    db.all("SELECT sid, nama, visi, misi, img, eid FROM calon NATURAL JOIN siswa where calon.eid = ?", [eid], (err, row) => {
        if (err) res.status(400).json({ err: err.message })
        else res.status(200).json(row)
    })
})


app.get('/vote/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
          res.status(400).send('Unable to log out')
        } else {
          res.send('Logout successful')
        }
      });
})

app.post('/vote/login', (req, res) => {
    const { nomor_induk, kode_akses, eid } = req.body

    if (nomor_induk && kode_akses) {
        db.get('SELECT * FROM pmlh_event WHERE sid = ? AND eid = ?', [nomor_induk, eid], (err, row) => {
            if (err) res.status(500).json({ 'err': err.message })
            else  if (row){
                res.status(403).json({"err": "Anda sudah melakukan voting pada pemilihan ini"})
            } else {
                if (nomor_induk && kode_akses) {
                    db.get('SELECT * FROM siswa WHERE sid = ? AND kodeakses = ?', [nomor_induk, kode_akses], (err, row) => {
                        if (err) res.status(500).json({ 'err': err.message })
                        else  if (row){
                            req.session.loggedin = true;
                            req.session.username = nomor_induk
                            req.session.sid = nomor_induk
                            req.session.eid = eid
                            req.session.npsn = row.npsn
                            res.status(200).json('ok')
                        } else {
                            res.status(400).json({err: 'invalid username and/or password'})
                        }
                    })
                } else {
                    res.status(400).json({err: 'invalid username and/or password'})
                }
            }
        })
    } else {
        res.status(400).json({err: 'bad request'})
    }

    
})






// route auth

app.post('/auth/login', (req, res) => {
    console.log('/auth/login')
    const { username, hashpass } = req.body
    
    if (username && hashpass) {
        db.get('SELECT * FROM user WHERE username = ? AND password = ?', [username, hashpass], (err, row) => {
            if (err) res.status(500).json({ 'err': err.message })
            else  if (row){
                req.session.loggedin = true;
                req.session.username = username
                req.session.npsn = row.npsn
                res.status(200).json('ok')
            } else {
                res.status(400).json({err: 'invalid username and/or password'})
            }
        })
    } else {
        res.status(400).json({err: 'invalid username and/or password'})
    }
})

app.get('/auth/check', (req, res) => {
    res.status(200).json({
        u: req.session.username,
        npsn: req.session.npsn
    })
})