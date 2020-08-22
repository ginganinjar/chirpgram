$(document).ready(() => {
  // This file just does a GET request to figure out which user is logged in
  // and updates the HTML on the page
  $.get("/api/profile").then(data => {
    $("#avatar").attr("src", "/uploads/" + data.avatar);
    $("#bio").val(data.bio);
    $("#location").val(data.location);
    $("#likes").val(data.likes);
    $("#email").val(data.email);
    $("#phone").val(data.phone);
  });

  $("#uploadForm").submit(function() {
    $("#status")
      .empty()
      .text("File is uploading...");

    $(this).ajaxSubmit({
      error: function(xhr) {
        status("Error: " + xhr.status);
      },

      success: function(response) {
        console.log(response);
        $("#status")
          .empty()
          .text(response);
      }
    });

    return false;
  });

  $("#updateUser").on("submit", event => {
    event.preventDefault();

    const userInfo = {
      bio: $("#bio")
        .val()
        .trim(),
      location: $("#location")
        .val()
        .trim(),
      likes: $("#likes")
        .val()
        .trim(),
      email: $("#email")
        .val()
        .trim(),
      phone: $("#phone")
        .val()
        .trim()
    };

    $.ajax({
      method: "PUT",
      url: "/api/updateuser",
      data: userInfo
    }).then(() => {
      window.location.href = "/profile";
    });
  });
});
