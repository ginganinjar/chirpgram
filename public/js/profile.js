$(document).ready(() => {
  // This file just does a GET request to figure out which user is logged in
  // and updates the HTML on the page
  $.get("/api/profile").then(data => {
    $("#avatar").attr("src", data.avatar);
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
});
