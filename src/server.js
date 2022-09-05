const config = require('./config');
require('./auth')
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongo = require("mongodb").MongoClient;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { checkUserExist, insertUser, updateUser, deleteUser, checkUser, isUserLoggedIn, createRoom, deleteRoom } = require('./auth');
const client = new OAuth2Client(config.CLIENT_ID);
const port = config.port;
const jwt = require('jsonwebtoken');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view-engine', 'ejs');
app.use(express.static('public'))

const url = config.mongoUrl;

let db,users;

mongo.connect(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    db = client.db("meethome");
    users = db.collection("user");
    console.log('Connected to Database');
  }
)

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

app.get('/', (req, res) => {
  let loggedin=false;
    isUserLoggedIn(req, res, () => {
        jwt.verify(req.cookies.auth, config.JWT_SECRET, (err, decoded) => {
          if (err) {
              res.redirect('/signin');
          } else {
              res.render('index.ejs', { loggedin: true, name: decoded.name, email: decoded.email, picture: decoded.picture, userid: decoded.userid });
          }
        });
          
    },()=>{

      res.render('index.ejs', {loggedin});
    });

});

app.get('/signin', (req, res) => {
    isUserLoggedIn(req, res, () => {
        res.redirect('/');
    },()=>{
        res.render('signin.ejs');
    });
});

app.get('/signup', (req, res) => {
  isUserLoggedIn(req, res, () => {
      res.redirect('/home');
  },()=>{
      res.render('signup.ejs');
  });
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    checkUserExist(db, { email: email }, (result) => {
        if (result) {
            checkUser(db, { email: email }, async (result) => {
                if (await bcrypt.compare(password, result.password)) {
                    const userdata = {
                      name: result.name,
                      email: result.email,
                      picture: result.picture,
                      userid: result.userid,
                      fromgoogle: false
                    };
                    const token = jwt.sign(userdata, config.JWT_SECRET);
                    res.cookie('auth', token);
                    res.redirect('/home');
                } else {
                    res.send('Wrong password');
                }
            });
        } else {
            res.send('User does not exist');
        }
    });
});

app.post('/signup', async (req, res) => {
    const { email, password, confirmPassword, name } = req.body;
    if(password === confirmPassword){
        checkUserExist(db, { email: email }, async (result) => {
            if (result) {
                res.send('User already exists');
            } else {
                const salt = await bcrypt.genSalt(10);
                const userid = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                insertUser(db, {userid: userid,name: name, email: email, password: await bcrypt.hash(password,salt), fromgoogle: false }, (result) => {
                    const userdata = {
                      name: name,
                      email: email,
                      picture: '',
                      userid: userid,
                      fromgoogle: false
                    };
                    const token = jwt.sign(userdata, config.JWT_SECRET);
                    res.cookie('auth', token);
                    res.redirect('/home');
                });
            }
        });
    }else{
        res.send('Passwords do not match');
    }

});

app.get('/home', (req, res) => {
    isUserLoggedIn(req, res, () => {
        
        jwt.verify(req.cookies.auth, config.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.redirect('/signin');
            } else {
                res.render('home.ejs', { name: decoded.name, email: decoded.email, picture: decoded.picture, userid: decoded.userid });
            }
        });
    },
    ()=>{
        res.redirect('/');
    })
});

app.get('/logout', (req, res) => {
    res.clearCookie('auth');
    res.redirect('/');
});

app.post('/google_auth', (req, res) => {
  let payload, userid;
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: config.CLIENT_ID,
        });
        payload = ticket.getPayload();
        userid = payload['sub'];
    }
    verify()
        .then( () => {
            if(payload.email_verified){
               checkUserExist(db, {email:payload.email},  (result) => {
                const userid = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                const userdata = {
                  userid: userid,
                  name: payload.name,
                  email: payload.email,
                  picture: payload.picture,
                  fromgoogle: true
                };
                if (!result){
                  insertUser(db, userdata, (result) => {

                  });
                }
                const token = jwt.sign(userdata, config.JWT_SECRET);
                res.cookie('auth', token);
                res.redirect('/');
              });
            }
        })
        .catch(console.error);
});




app.get('/newmeet', (req, res) => {
  
    isUserLoggedIn(req, res, () => {
      
      
      const id = randomString(9, 'abcdefghijklmnopqrstuvwxyz').replace(/.{3}/g, '$&-').slice(0,-1);
      jwt.verify(req.cookies.auth, config.JWT_SECRET, (err, decoded) => {
          if (err) {
              res.redirect('/signin');
            
          } else {
            createRoom(db, {roomid: id, name: decoded.name, picture: decoded.picture, hostid: decoded.userid}, () => {
              res.render('newmeet.ejs', {loggedin:true,roomid: id, name: decoded.name, picture: decoded.picture, hostid: decoded.userid});
            });
          }
      });
  },
  ()=>{
      res.redirect('/');
  })
});

app.get('/callended', (req, res) => {
  isUserLoggedIn(req, res, () => {
    let loggedin=false;
    jwt.verify(req.cookies.auth, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.redirect('/signin');
        } else {
          res.render('endcall.ejs', { loggedin:true, name: decoded.name, email: decoded.email, picture: decoded.picture, userid: decoded.userid });
        }
    });
  },
  ()=>{
      res.redirect('/signin');
  })
})


app.get('/:roomid', (req, res) => {
    isUserLoggedIn(req, res, () => {
        
      
      
      const id = randomString(9, 'abcdefghijklmnopqrstuvwxyz').replace(/.{3}/g, '$&-').slice(0,-1);
      jwt.verify(req.cookies.auth, config.JWT_SECRET, (err, decoded) => {
          if (err) {
              res.redirect('/signin');
            
            
          } else {
            res.render('room.ejs', { roomid: req.params.roomid,name:decoded.name, picture: decoded.picture , userid: decoded.userid });
          }
      });
    },
    ()=>{
        res.redirect('/');
    });
});



app.post('/:roomid', (req, res) => {
    isUserLoggedIn(req, res, () => {
        
      
      
      const id = randomString(9, 'abcdefghijklmnopqrstuvwxyz').replace(/.{3}/g, '$&-').slice(0,-1);
      jwt.verify(req.cookies.auth, config.JWT_SECRET, (err, decoded) => {
          if (err) {
              res.redirect('/signin');
            
            
          } else {
            res.render('room.ejs', { cam: req.body.cam, mic: req.body.mic, roomid: req.params.roomid,name:decoded.name, picture: decoded.picture , userid: decoded.userid });
          }
      });
    },
    ()=>{
        res.redirect('/');
    });
});



io.on('connection', (socket) => {
  let userid,roomid,username;
  console.log('a user connected');
  socket.on('saveuser',(data) => {
    userid = data.userid,
    roomid = data.roomid,
    username = data.username
  });

  socket.on('joinroom', (data) => {
    socket.join(data.roomid);
    let ndata = {
      socketid: socket.id,
      roomid: data.roomid,
      userid: data.userid,
      username: data.username,
      picture: data.picture
    }
    socket.to(data.roomid).emit('userjoined', ndata);
  });

  socket.on('offer', (data) => {
    let to = data.socketid;
    data.socketid = socket.id;
    socket.to(to).emit('offer', data);
  });

  socket.on('candidate', (data) => {
    let to = data.socketid;
    data.socketid = socket.id;
    socket.to(to).emit('candidate', data);
  });

  socket.on('answer', (data) => {
    let to = data.socketid;
    data.socketid = socket.id;
    socket.to(to).emit('answer', data);
  });

  socket.on('disconnect', () => {
    socket.to(roomid).emit('userleft', {username: username,socketid:socket.id, userid:userid, picture: ''});
    deleteRoom(db, {roomid: roomid, hostid: userid}, (result) => {
      console.log(username+'user disconnected');
    })
  });
});





http.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    
});