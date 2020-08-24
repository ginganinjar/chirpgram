$(document).ready(() => {
  // Getting references to our form and inputs
  const loginForm = $("form.login");
  const usernameInput = $("input#username-input");
  const passwordInput = $("input#password-input");
  const $accessDenied = $("#accessDenied");

  // When the form is submitted, we validate there's an username and password entered
  loginForm.on("submit", event => {
    event.preventDefault();
    const userData = {
      username: usernameInput.val().trim(),
      password: passwordInput.val().trim()
    };

    if (!userData.username || !userData.password) {
      return;
    }

    // If we have an username and password we run the loginUser function and clear the form
    loginUser(userData.username, userData.password);
    usernameInput.val("");
    passwordInput.val("");
  });

  // loginUser does a post to our "api/login" route and if successful, redirects us the the members page
  function loginUser(username, password) {
    $.post("/api/login", {
      username: username,
      password: password
    })
      .then(() => {
        window.location.replace("/members");
        // If there's an error, log the error
      })
      .catch(err => {
        console.log(err);
        $accessDenied.removeAttr("hidden");
        usernameInput.css("border-bottom", "3px solid crimson");
        passwordInput.css("border-bottom", "3px solid crimson");
        setTimeout(() => {
          $accessDenied.attr("hidden", true);
          usernameInput.css("border-bottom", "3px solid silver");
          passwordInput.css("border-bottom", "3px solid silver");
        }, 2500);
      });
  }
});
