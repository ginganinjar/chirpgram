$(document).ready(() => {
  // Getting references to our form and input
  const signUpForm = $("form.signup");
  const usernameInput = $("input#username-input");
  const passwordInput = $("input#password-input");
  const $accessDenied = $("#accessDenied");

  // When the signup button is clicked, we validate the email and password are not blank
  signUpForm.on("submit", event => {
    event.preventDefault();
    const userData = {
      username: usernameInput.val().trim(),
      password: passwordInput.val().trim()
    };

    if (!userData.username || !userData.password) {
      return;
    }
    // If we have an email and password, run the signUpUser function
    signUpUser(userData.username, userData.password);
    usernameInput.val("");
    passwordInput.val("");
  });

  // Does a post to the signup route. If successful, we are redirected to the members page
  // Otherwise we log any errors
  function signUpUser(username, password) {
    $.post("/api/signup", {
      username: username,
      password: password
    })
      .then(() => {
        window.location.replace("/members");
        // If there's an error, handle it by throwing up a bootstrap alert
      })
      .catch(handleLoginErr);
  }

  function handleLoginErr(err) {
    console.log(err);
    $accessDenied.removeAttr("hidden");
    usernameInput.css("border-bottom", "3px solid crimson");
    passwordInput.css("border-bottom", "3px solid crimson");
    setTimeout(() => {
      $accessDenied.attr("hidden", true);
      usernameInput.css("border-bottom", "3px solid silver");
      passwordInput.css("border-bottom", "3px solid silver");
    }, 2500);
  }
});
