const db = require("../models");

module.exports = function(io) {
  let numUsers = 0;
  let onlineUsers = [];
  let addedUser = false;
  const username = "undefined";

  io.on("connection", socket => {
    // when the client emits 'add user', this listens and executes

    socket.on("add user", (username, socketID, avatar) => {
      if (username !== null && username !== "null") {
        onlineUsers.push([username, socketID, avatar]);
      }

      // we store the username in the socket session for this client
      socket.username = username;
      socket.id = socketID;
      ++numUsers;
      addedUser = true;
      socket.emit("login", {
        numUsers: onlineUsers.length
      });
      // echo globally (all clients) that a person has connected

      socket.broadcast.emit("user joined", {
        username: socket.username,
        numUsers: onlineUsers.length,
        socketAddress: socketID,
        avatar: avatar
      });

      socket.broadcast.emit("user list", onlineUsers);
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on("typing", () => {
      socket.broadcast.emit("typing", {
        username: socket.username
      });
    });

    // request from client for new user object
    socket.on("update userlist", () => {
      // we add the user to a globalvariable of online users.
      // here we are going to itterate through each user. We will update the avatar on the fly
      // note the users profile will update when another user enters the chat
      // until then the profile pic will not change.

      db.User.findAll().then(data => {
        for (i = 0; i < data.length; i++) {
          for (x = i; x < onlineUsers.length; x++) {
            // eslint-disable-next-line eqeqeq
            if (data[i].username == onlineUsers[x][0]) {
              onlineUsers[x][2] = data[i].avatar;
            }
          }
        }
        io.emit("user list", onlineUsers);
      });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on("new message", data => {
      // new message recieved - broadcasting
      socket.broadcast.emit("public message", data);
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on("stop typing", () => {
      socket.broadcast.emit("stop typing", {
        username: socket.username
      });
    });

    // when the user disconnects.. perform this
    socket.on("disconnect", () => {
      if (addedUser) {
        --numUsers;

        // remove user from array
        if (socket.username !== null && socket.username !== "null") {
          // reset online user array
          onlineUsers = onlineUsers.filter(item => item[0] !== socket.username);
        }

        socket.broadcast.emit("user list", onlineUsers);

        // echo globally that this client has left
        // if a connection has been lost and authorisation is null, the username is returned as undefined
        // don't report this.
        if (username !== "undefined") {
          socket.broadcast.emit("user left", {
            username: socket.username,
            numUsers: numUsers
          });
        }
      }
    });

    
    socket.on("getMsg", data => {
      // recieved private message request - now broadcast to said user.
      socket.broadcast.to(data.toid).emit("recievedMessage", {
        toid: data.toid,
        message: data.message,
        username: data.username,
        usercolor: data.usercolor
      });
    });
  });
};
