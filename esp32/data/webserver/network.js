window.addEventListener("load", networkBodyLoad);
const urlParams = new URLSearchParams(window.location.search);

const valuetimerJsonNetworkRequest = 5000
let timerJsonNetworkRequest = setInterval(getNetworksJson, valuetimerJsonNetworkRequest)

function showManualConnection() {
  let container = document.getElementById("credentials-fixed-container");
  container.classList.toggle("hide")
  if (container.classList.contains("hide")) timerJsonNetworkRequest = setInterval(getNetworksJson, valuetimerJsonNetworkRequest)
  else clearInterval(timerJsonNetworkRequest)
}

function showPasswordBox(networkNumber) {
  let passwordBoxElement = document.getElementById("passwordBox-" + networkNumber);

  document.querySelectorAll(".passwordBox").forEach( element => {
    if (element.id != passwordBoxElement.id) element.classList.add("hide")
  })
  passwordBoxElement.classList.toggle("hide")
  if (passwordBoxElement.classList.contains("hide")) timerJsonNetworkRequest = setInterval(getNetworksJson, valuetimerJsonNetworkRequest)
  else clearInterval(timerJsonNetworkRequest)
}



function networkBodyLoad() {
  document.getElementById("manualConnectionBtn").addEventListener("click", showManualConnection)
  getNetworksJson()
}

function getNetworksJson() {
  const xhttp = new XMLHttpRequest()
  xhttp.onload = function() {
    displayNetworkList(this.responseText)
  }
  xhttp.open("POST", "networkscan")
  xhttp.send()
}

function displayNetworkList(jsonStr) {
  //let test = '{"total":2,"0":{"rssi":-65,"ssid":"sassari","auth":3},"1":{"rssi":-34,"ssid":"palermo","auth":0}}'
  if (jsonStr == "{}") document.getElementById("network-list-container").innerHTML = "No network found"
  else {
    const jsonObj = JSON.parse(jsonStr)
    document.getElementById("network-list-container").innerHTML = ""
    const separatorElement = new TemplateElement(
      document.getElementById("separator-template"),
      document.getElementById("network-list-container")
    );
    for (let i = 0, total = parseInt(jsonObj["total"]); i < total; i++) {
      let networkObject = new NetworkElement(
        document.getElementById("network-template"),
        document.getElementById("network-list-container"),
        i
      );
      networkObject.attachSingleJsonObj(jsonObj[String(i)])
      if (i != total-1) separatorElement.appendTemplate()
      document.getElementById("infoBox-"+i).addEventListener("click", function() { showPasswordBox(i) })
    }
  }
}
