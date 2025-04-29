document.addEventListener("DOMContentLoaded", function () {
  var elements = Array.from(document.getElementsByClassName("clap-count"));
  var urls = elements.map(function (el) {
    return el.getAttribute("data-url");
  });

  if (urls.length) {
    var request = new XMLHttpRequest();
    request.open("POST", "https://applause.chabouis.fr/get-multiple", true);
    request.setRequestHeader("Content-Type", "text/plain");
    request.responseType = "json";
    request.addEventListener("load", function () {
      if (request.status === 200) {
        elements.forEach(function (element) {
          var url = element
            .getAttribute("data-url")
            .replace(/^https?:\/\//, "");
          var clapCount = request.response.find(function (e) {
            return e.url === url;
          });
          if (clapCount && clapCount.claps > 0) {
            element.innerHTML = `<svg ... ></svg>`; // insert your SVG code here
            var countSpan = document.createElement("span");
            countSpan.textContent = clapCount.claps;
            element.appendChild(countSpan);
            element.style.display = "initial";
          }
        });
      } else {
        console.log(
          "POST to https://api.applause-button.com/get-multiple failed"
        );
      }
    });
    request.send(JSON.stringify(urls));
  }
});
