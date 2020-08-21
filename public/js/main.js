$(() => {
  const FADE_TIME = 150; // ms
  const TYPING_TIMER_LENGTH = 400; // ms

  // Initialize variables
  const $window = $(window);
  const $usernameInput = $(".member-name"); // Input for username
  const $messages = $(".messages"); // Messages area
  const $inputMessage = $(".inputMessage"); // Input message input box

  const $loginPage = $(".login.page"); // The login page
  const $chatPage = $(".chat.page"); // The chatroom page
  let username;

  let connected = false;
  let typing = false;
  let lastTypingTime;
  let $currentInput = $usernameInput.focus();

  // variables for private chat.
  let chattype = "public";
  let sendToUserID = null;
  let sendToUserName = null;

  const socket = io();

  const setPublicChatStatus = () => {
    chattype = "public";
    sendToUserID = null;
    sendToUserName = null;
    $(".chatStatus").text("You are broadcasting to everyone!");
    $(".return").css("visibility", "hidden");
    addNotificationMessage("Everyone can see your messages","red");
  };

  $(".return").on("click", () => {
    // reset chat type
    setPublicChatStatus();
  });

  // send private message to user when user element is selected.
  $("#users").on("click", ".userList", (e) => {
    chattype = "private";

    // get the id of the sender and the username
    sendToUserID = $(e.currentTarget).data("id");

    sendToUserName = $(e.currentTarget)[0].innerHTML;

    $(".chatStatus").text("Sending private messages to : " + sendToUserName);
    $(".return").css("visibility", "visible");
    addNotificationMessage("Only " + sendToUserName + " can see your messages","green");
    // set the css of the sender to something idk what

    $(e.currentTarget).css("color", "red");

    $(".message").each(function() {
      // if this message is not from the selected user, hide it
      if (sendToUserID !== $(this)[0].id && socket.id !== $(this)[0].id) {
        $(this).css("display", "none");
      }
    });
  });

  // group chat public message recieved
  socket.on("public message", (data) => {
    addChatMessage(data);
  });

  socket.on("recievedMessage", (data) => {
    console.log(data);
    theMSG = data.message;
    fromMSG = data.username;

    addChatMessage(data, "private");
  });

  // Prompt for setting a username

  const addParticipantsMessage = (data) => {
    let message = "";
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else if (data.numUsers > 1) {
      message += "there are " + data.numUsers + " participants";
    }
    addNotificationMessage(message);
  };

  // Sends a chat message
  const sendMessage = () => {
    // console.log("inside send message");
    let message = " : " + $inputMessage.val();

    // Prevent markup from being injected into the message
    message = cleanInput(message);

    // check connection state and message contents
    if (message && connected) {
      $inputMessage.val("");
      addChatMessage({
        userid: socket.id,
        username: username,
        message: message,
      });
      // tell server to execute 'new message' and send along one parameter

      if (chattype == "private") {
        const sendThis = {
          toid: sendToUserID,
          message: message,
          username: username,
        };
        socket.emit("getMsg", sendThis);
      } else {
        socket.emit("new message", {
          userid: socket.id,
          message: message,
          username: username,
        });
      }
    }
  };

  function processUsers(data) {
    $("#users").empty();

    // cycle through users
    for (i = 0; i < data.length; i++) {
      $("#users").append(
        '<li class="userList" data-id="' +
          data[i][1] +
          '">' +
          data[i][0] +
          "</li>"
      );
    }
  }

  const addNotificationMessage = (data, typeOfAlert) => {
    $("#popUpMessages").empty(); // clear notification

    let yellowAlert = null;
    console.log("this is the type of alert" + typeOfAlert);

    yellowAlert = "/img/zooloo.png";
    if (typeOfAlert == null || typeOfAlert !== "red") {
      yellowAlert = "/img/alarm.png";
    } 
     if (typeOfAlert == "green") {
      yellowAlert = "/img/green.png";
       } 
     
    

    if (data) {
      const thisNotification = $("<div>");
      thisNotification
        .text(data)
        .css(`background-image`, `url(${yellowAlert})`)
        .css("background-repeat", "no-repeat")
        .css("background-position", "220px 0")
        .css("background-size", "contain")
        .attr("src", "/img/alarm.png");

      $("#popUpMessages").append(thisNotification);
    }
  };

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    const $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }
    let pretext = "";

    if (options == "private") {
      pretext = " Private Msg from :";
    }

    const $usernameDiv = $('<span class="username"/ id="' + data.userid + '">')
      .text(pretext + data.username)
      .css("color", "red");

    const $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message)
      .css("font-style", "italic");

    const typingClass = data.typing ? "typing" : "";
    const $messageDiv = $('<li id="' + data.userid + '" class="message"/>')
      .data("username", data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  };

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = "is typing";
    addChatMessage(data);
  };

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function() {
      $(this).remove();
    });
  };

  // Adds a message element to the messages and scrolls to the bottom

  const addMessageElement = (el, options) => {
    const $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === "undefined") {
      options.fade = true;
    }
    if (typeof options.prepend === "undefined") {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  };

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $("<div/>")
      .text(input)
      .html();
  };

  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit("typing");
      }
      lastTypingTime = new Date().getTime();

      setTimeout(() => {
        const typingTimer = new Date().getTime();
        const timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit("stop typing");
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  };

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $(".typing.message").filter(function(i) {
      return $(this).data("username") === data.username;
    });
  };

  // Keyboard events

  $window.keydown((event) => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    console.log("Conversation type is : " + chattype);

    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit("stop typing");
        typing = false;
      } else {
        console.log("we have a problem");
      }
    }
  });

  $inputMessage.on("input", () => {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(() => {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events
  // Whenever the server emits 'login', log the login message

  socket.on("connect", () => {
    // get the user details of the user
    $.getJSON("api/user_data", (data) => {
      setPublicChatStatus();
      username = data.username;
      $chatPage.show();

      $currentInput = $inputMessage.focus();
      console.log($currentInput);

      console.log("Adding user to server");
      userID = socket.id;
      socket.emit("add user", username, userID);
      socket.emit("update userlist", username, userID);

      connected = true;
    });
  });

  socket.on("login", (data) => {
    connected = true;
    // get userlist
    socket.emit("update userlist", username, userID);
    // Display the welcome message
    const message = "Welcome to ChirpGram ";
    addParticipantsMessage(message, {
      prepend: true,
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on("new message", (data) => {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on("user joined", (data) => {
    addNotificationMessage(data.username + " joined");
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", (data) => {
    addNotificationMessage(data.username + " left", "red");
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on("typing", (data) => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on("stop typing", (data) => {
    removeChatTyping(data);
  });

  socket.on("disconnect", () => {
    addNotificationMessage("you have been disconnected", "red");
  });

  socket.on("user list", (data) => {
    console.log("in user list -> printing it out");
    console.log(data);
    processUsers(data);
  });

  socket.on("reconnect", () => {
    addNotificationMessage("you have been reconnected");
    connection = true;

    if (username) {
      userID = socket.id;
      socket.emit("add user", username, userID);
    }
  });

  socket.on("reconnect_error", () => {
    addNotificationMessage("attempt to reconnect has failed", "red");
    socket.emit("hi", "everyone");
  });
});
