module.exports = function(io) {
  let numUsers = 0;
  onlineUsers = [];

  io.on("connection", socket => {
    // when the client emits 'add user', this listens and executes
   
  
    socket.on("add user", (username, socketID) => {
      // we add the user to a globalvariable of online users.
     
      if (username !== null && username !== "null") {
        onlineUsers.push([username, socketID]);
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
        socketAddress: socketID
      });

      socket.broadcast.emit("user list", onlineUsers);

    });

    // when the client emits 'typing', we broadcast it to others
    socket.on("typing", () => {
      socket.broadcast.emit("typing", {
        username: socket.username
      });
    });

  
   socket.on("update userlist", () => {
   // socket.broadcast.emit("user list", onlineUsers);
   io.emit("user list", onlineUsers);
  });

 // when the client emits 'typing', we broadcast it to others
    socket.on("new message", (data) => {
      console.log("new message recieved - bradcasting");
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
        console.log("Deleting" + socket.username);
        onlineUsers = onlineUsers.filter(item => item[0] !== socket.username);
        console.log(onlineUsers);
        }

        socket.broadcast.emit("user list", onlineUsers);

        // echo globally that this client has left
        socket.broadcast.emit("user left", {
          username: socket.username,
          numUsers: numUsers
        });
      }
    });
    socket.on("getMsg", data => {
      console.log("recieved getMSG file");
      console.log(data);
      socket.broadcast.to(data.toid).emit("recievedMessage", {
        toid : data.toid,
        message: data.message,
        username: data.username
      });
    });

    

  });
};
