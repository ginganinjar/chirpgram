// Requiring necessary npm packages

const dotenv = require('dotenv').config();

const express = require("express");
// Creating express app and configuring middleware needed for authentication
const app = express();

const session = require("express-session");
// Requiring passport as we've configured it
const passport = require("./config/passport");

// Setting up port and requiring models for syncing
const PORT = process.env.PORT || 8080;
const db = require("./models");

const server = require('http').createServer(app);
const io = require('socket.io')(server);


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Routing
app.use(express.static('public'));

// We need to use sessions to keep track of our user's login status
app.use(
  session({ secret: "keyboard cat", resave: true, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

// Requiring our routes
require("./routes/html-routes.js")(app);
require("./routes/api-routes.js")(app);

// Syncing our database and logging a message to the user upon success
db.sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(
      "==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
      PORT,
      PORT
    );
  });
});

var numUsers = 0;
onlineUsers = [];

io.on('connection', (socket) => {

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username, socketID) => {

    // we add the user to a globalvariable of online users.
    onlineUsers.push([username, socketID]);
    console.log(onlineUsers);

    // we store the username in the socket session for this client
    socket.username = username;
    socket.id = socketID;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: onlineUsers.length
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: onlineUsers.length,
      socketAddress : socketID

    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;
      
      // remove user from array
      console.log("Deleting" + socket.username);
       onlineUsers = onlineUsers.filter(item => item[0] !== socket.username);
      console.log(onlineUsers);

      // echo globally that this client has left
         socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});