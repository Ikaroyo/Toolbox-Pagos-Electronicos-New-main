async function loadPage(url) {
  const iframe = document.createElement("iframe");
  iframe.src = "src/" + url;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.display = "block";
  iframe.style.margin = "0 auto";
  iframe.style.border = "none";
  document.getElementById("iframe-container").innerHTML = "";
  document.getElementById("iframe-container").appendChild(iframe);
}
