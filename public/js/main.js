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
  let usercolor = 8;

  let connected = false;
  let typing = false;
  let lastTypingTime;
  let $currentInput = $usernameInput.focus();

  // variables for private chat.
  let chattype = "public";
  let sendToUserID = null;
  let sendToUserName = null;

  let colorArray = [
    "#ffc107",
    "007bff",
    "#6610f2",
    "#e83e8c",
    "#dc3545",
    "#fd7e14",
    "#28a745",
    "#20c997",
    "#17a2b8",
    "#fff",
    "#6c757d",
    "#343a40",
    "#007bff",
    "#6c757d",
    "#28a745",
    "17a2b8",
    "#ffc107",
    "#dc3545",
    "#f8f9fa",
    "#343a40",
  ];
  const socket = io();

  const setPublicChatStatus = () => {
    chattype = "public";
    sendToUserID = null;
    sendToUserName = null;
    $(".chatStatus").text("You are broadcasting to everyone!");
    $(".return").css("visibility", "hidden");
    addNotificationMessage("Everyone can see your messages", "white");
  };

  $(".return").on("click", () => {
    // reset chat type
    setPublicChatStatus();
  });

  // display profile information for various user

  $("#users").on("mouseover", ".userList", (e) => {
    // get the user id
    let getThisUser = $(e.currentTarget)[0].text;
    // ok now fetch the users profile
    $.getJSON("api/otheruser/" + getThisUser, (data) => {
      console.log(data);
 
    });
  });

  //display modal for user details
  
  $("#users").on("mouseover", "img", () => {
        $("#userModal").modal("show");
  });

  // send private message to user when user element is selected.
  $("#users").on("click", ".userList", (e) => {
    chattype = "private";

    // get the id of the sender and the username
    sendToUserID = $(e.currentTarget).data("id");

    sendToUserName = $(e.currentTarget)[0].text;

    $(".chatStatus").text("Sending private messages to : " + sendToUserName);
    $(".return").css("visibility", "visible");
    addNotificationMessage(
      "Only " + sendToUserName + " can see your messages",
      "green"
    );
    // set the css of the sender to something idk what

    $(e.currentTarget).css("color", "white");

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
    // recieved global message - post it
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
    addNotificationMessage(message, "none");
  };

  const sendMessage = () => {
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
        usercolor: usercolor,
      });
      // tell server to execute 'new message' and send along one parameter

      if (chattype == "private") {
        const sendThis = {
          toid: sendToUserID,
          message: message,
          username: username,
          usercolor: usercolor,
        };
        socket.emit("getMsg", sendThis);
      } else {
        socket.emit("new message", {
          userid: socket.id,
          message: message,
          username: username,
          usercolor: usercolor,
        });
      }
    }
  };

  // when the user closes their profile page
  // execute a broad callout to let all users know
  // that this has happened and also to update the user
  // profile
  
  $("#updateBtnClose").on("click", () => {
    socket.emit("update userlist");
  })

  function processUsers(data) {
    $(".users").empty();

    $.getJSON("/api/getAvatars", (theUsers) => {
      console.log(theUsers);
      for (i = 0; i < data.length; i++) {
        const result = theUsers.find(({ username }) => username === data[i][0]);
        console.log(result.avatar);
        $(".users").append(
          '<li><a href="#" class="userList" data-id="' +
            data[i][1] +
            '"><img src="/uploads/' +
            result.avatar +
            '" width="50px" height="50px">' +
            data[i][0] +
            " </a></li>"
        );
      }
    });
  }

  const addNotificationMessage = (data, typeOfAlert) => {
    let popUpMessages = $("#popUpMessages");

    if (popUpMessages[0].childElementCount > 2) {
      popUpMessages[0].firstChild.remove();
    }

    let yellowAlert = null;
    // workout request and provide appropriate alert type.

    yellowAlert = "/img/Broadcast.png";
    if (typeOfAlert == null || typeOfAlert !== "white") {
      yellowAlert;
    }
    if (typeOfAlert == "green") {
      yellowAlert = "/img/Private.png";
    }

    if (data) {
      const thisNotification = $("<div>");

      if (typeOfAlert !== "none") {
        thisNotification
          .text(data)
          .css(`background-image`, `url(${yellowAlert})`)
          .css("background-repeat", "no-repeat")
          .css("background-position", "220px 0")
          .css("background-size", "contain")
          .attr("src", "/img/alarm.png");
      } else {
        thisNotification.text(data);
      }

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
      .css("color", colorArray[data.usercolor]);

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


  const resetColorScheme = () => {
    $(".username").each(function() {
      // check if this userid is the same as the poster changing the color
      if (this.id == socket.id) {
        $($(this)).css("color", colorArray[usercolor]);
      }
    });
  };

  $window.keydown((event) => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // 38 is up - 40 is down.

    // When the client hits up on their keyboard
    if (event.which == 38) {
      // add the current user color
      usercolor++;
    }

    // When the client hits down on their keyboard
    if (event.which == 40) {
      // reduce the current user color
      usercolor--;
    }

    if (usercolor < 0) {
      usercolor = colorArray.length;
    }
    if (usercolor > colorArray.length) {
      usercolor = 0;
    }
    // reset the display to present colors as the user wants.
    if (event.which == 40 || event.which == 38) {
      resetColorScheme();
    }

    if (event.which === 13) {
      if (username) {
        // dont forward null
        if ($inputMessage.val() !== "") {
          sendMessage();
        }
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

  // Click event

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
      avatar = data.avatar;

      // console.log(avatar);
      $chatPage.show();

      $currentInput = $inputMessage.focus();
      // sending this user information over to the server to add to array
      userID = socket.id;
      socket.emit("add user", username, userID, avatar);
      socket.emit("update userlist", username, userID, avatar);

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
    if (data.username !== null) {
    addNotificationMessage(data.username + " joined");
    addParticipantsMessage(data);
      }
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", (data) => {
    addNotificationMessage(data.username + " left", "white");
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
    addNotificationMessage("you have been disconnected", "white");
  });

  socket.on("user list", (data) => {
    // have recieved updated userlist - add it to the user panel
    processUsers(data);
  });

  socket.on("reconnect", () => {
    addNotificationMessage("you have been reconnected");
    connection = true;

    if (username) {
      userID = socket.id;
      socket.emit("add user", username, userID, avatar);
    }
  });

  socket.on("reconnect_error", () => {
    addNotificationMessage("attempt to reconnect has failed", "white");
    socket.emit("hi", "everyone");
  });
});

// eslint-disable-next-line quotes
$('[data-toggle="tooltip"]').tooltip();