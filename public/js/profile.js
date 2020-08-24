$(document).ready(() => {
  // performs a get request when loading to gather all the data to populate the profile modal
  $.get("/api/profile").then(data => {
    $("#avatar").attr("src", "/uploads/" + data.avatar);
    $("#bio").val(data.bio);
    $("#location").val(data.location);
    $("#likes").val(data.likes);
    $("#email").val(data.email);
    $("#phone").val(data.phone);
  });

  $("#uploadForm").submit(function() {
    event.preventDefault();
    $("#status")
      .empty()
      .text("File is uploading...");

    $(this).ajaxSubmit({
      error: function(xhr) {
        status("Error: " + xhr.status);
      },

      success: function(response) {
        console.log(response);
        if (response.avatar) {
          $("#avatar").attr("src", "/uploads/" + response.avatar);
        } else if (response.err) {
          $("#status")
            .empty()
            .text(response.err);
        }
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
      url: "/api/updateUser",
      data: userInfo
    });
  });
});
