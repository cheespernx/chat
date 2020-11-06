const express = require('express');
const path = require('path');

const bodyParser = require("body-parser");
const routes = express.Router();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const firebase = require('./public/config/firebase');
const { Router } = require('express');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(routes);

var user;

routes.get('/login', (req, res) => {
  res.render('login.html');
});

routes.get('/logout', (req, res) => {
  firebase.auth().signOut().then(function() {
    res.redirect('/login')
  }).catch(function(error) {
    console.log(error)
  });
});

routes.get('/register', (req, res) => {
  res.render('register.html');
});

routes.post('/register-account', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    if(errorCode || errorMessage){
      res.send(errorCode);
    }
  });
})

routes.post('/login-process', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  firebase.auth().signInWithEmailAndPassword(email, password)
  .then(data => {
    if (data.user) {
      user = data.user;
      res.send(user)
    } else {
      user = null;
    }
  }).catch(error => {
    var errorCode = error.code;
    if(error){
      res.send(errorCode);
    }    
  });

  
})

routes.get('/me', (req, res) =>{
  var user = firebase.auth().currentUser;

  if (user) {
    res.json({
      'auth': true,
      'user': user
    })
  } else {
    res.json({
      'auth': false
    })
  }
})

routes.get('/', (req, res) => {
  if(user.uid){
    res.render('index.html').send(user);
  } else {
    res.redirect('/login')
  }
});


io.on('connection', socket => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('sendMessage', data => { // Envio da mensagem
    firebase.database().ref().child('messages').push(data);
  });

  firebase.database().ref('messages').once('value').then(function(snapshot) {
    snapshot.forEach(item => {
      socket.emit('previousMessages', item.val());
    });
  });
  
});

server.listen(3000);