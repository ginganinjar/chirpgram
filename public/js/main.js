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
  var username;

  var connected = false;
  let typing = false;
  let lastTypingTime;
  let $currentInput = $usernameInput.focus();

  const socket = io();


    // get the user details of the user
  $.getJSON("api/user_data", function(data) {
    username = data.email;
    console.log("the username is : " + username);
    $chatPage.show();

    $currentInput = $inputMessage.focus();
    console.log($currentInput);

    console.log("Adding user to server");
    socket.emit("add user", username);
    connected = true;
  });

 
  // Prompt for setting a username
 

  const addParticipantsMessage = data => {
    let message = "";
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  };

  // Sends a chat message
  const sendMessage = () => {
    console.log("inside send message");
    let message = " : " + $inputMessage.val();

    // Prevent markup from being injected into the message
    message = cleanInput(message);
    
    // check connection state and message contents
    if (message && connected) {
     
      $inputMessage.val("");
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit("new message", message);
    }
  };

  // Log a message
  const log = (message, options) => {
    const $el = $("<li>")
      .addClass("log")
      .text(message);
    addMessageElement($el, options);
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

    const $usernameDiv = $("<span class=\"username\"/>")
      .text(data.username)
      .css("color","red");

    const $messageBodyDiv = $("<span class=\"messageBody\">")
    .text(data.message)
    .css("font-style","italic");


    const typingClass = data.typing ? "typing" : "";
    const $messageDiv = $("<li class=\"message\"/>")
      .data("username", data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  };

  // Adds the visual chat typing message
  const addChatTyping = data => {
    data.typing = true;
    data.message = "is typing";
    addChatMessage(data);
  };

  // Removes the visual chat typing message
  const removeChatTyping = data => {
    getTypingMessages(data).fadeOut(function() {
      $(this).remove();
    });
  };

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
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
  const cleanInput = input => {
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
  const getTypingMessages = data => {
    return $(".typing.message").filter(function(i) {
      return $(this).data("username") === data.username;
    });
  };

  // Keyboard events

  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
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
  
  socket.on("login", data => {
    connected = true;
    // Display the welcome message
    const message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on("new message", data => {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on("user joined", data => {
    log(data.username + " joined");
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", data => {
    log(data.username + " left");
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on("typing", data => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on("stop typing", data => {
    removeChatTyping(data);
  });

  socket.on("disconnect", () => {
    log("you have been disconnected");
  });

  socket.on("reconnect", () => {
    log("you have been reconnected");
    connection = true;

    if (username) {
      socket.emit("add user", username);
    }
  });

  socket.on("reconnect_error", () => {
    log("attempt to reconnect has failed");
    socket.emit("hi", "everyone");
  });
});