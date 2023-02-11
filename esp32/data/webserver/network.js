window.addEventListener("load", networkBodyLoad);

const valuetimerJsonNetworkRequest = 5000
const valuetimerCheckWifiConnection = 3000
let timerJsonNetworkRequest = setInterval(getNetworksJson, valuetimerJsonNetworkRequest)
let timeoutCheckWifiConnection

function checkWifiConnected(networkNumber) {
  let divError = document.getElementById((networkNumber == -1) ? "connection-status-manual" : "connection-status")
  let inputSsid = document.getElementById((networkNumber == -1) ? "ssid-manual" : ("ssid-"+networkNumber))
  let inputPassword = document.getElementById((networkNumber == -1) ? "password-manual" : ("password-"+networkNumber))
  if (networkNumber == -1) console.log(inputSsid.value)
  else console.log(inputSsid.textContent)
  console.log(inputPassword.value)
  const xhttp = new XMLHttpRequest()
  xhttp.onload = function() {
    switch (this.responseText)  {
      case "progress":
        divError.innerHTML = "Connection..."
        timeoutCheckWifiConnection = setTimeout(checkWifiConnected.bind(null, networkNumber), valuetimerCheckWifiConnection)
        break;

      case "success":
        divError.innerHTML = "Connected!"
        location.replace("credentials")
        break;

      case "fail":
        divError.innerHTML = "Wrong credentials"
        break;
      case "network not found":
        divError.innerHTML = "The network has not been found"
      default:
        divError.innerHTML = "General error. Value: " + this.responseText
    }
  }
  xhttp.open("POST", "connectToNetwork")
  xhttp.setRequestHeader("Content-type", "text/plain")
  xhttp.send(
    "ssid=" + ((networkNumber == -1) ? inputSsid.value : inputSsid.textContent)
    + "&password=" + inputPassword.value
  )
}

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
  document.querySelector("#credentials-fixed-container form").addEventListener("submit", function(e) { e.preventDefault(); checkWifiConnected(-1) })
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
  //jsonStr = '{"total":2,"0":{"rssi":-65,"ssid":"sassari","auth":3},"1":{"rssi":-34,"ssid":"palermo","auth":0}}'
  if (jsonStr == "{}") document.getElementById("network-list-container").innerHTML = "No network found"
  else {
    const jsonObj = JSON.parse(jsonStr)
    document.getElementById("network-list-container").innerHTML = ""

    for (let i = 0, total = parseInt(jsonObj["total"]); i < total; i++) {
      let networkObject = new NetworkElement(
        document.getElementById("network-template"),
        document.getElementById("network-list-container"),
        i
      );
      const separatorElement = new TemplateElement(
        document.getElementById("separator-template"),
        document.getElementById("network-list-container")
      );
      networkObject.attachSingleJsonObj(jsonObj[String(i)])
      if (i != total-1) separatorElement.appendTemplate()
      document.getElementById("infoBox-"+i).addEventListener("click", function() { showPasswordBox(i) })
      networkObject.getFormElement().addEventListener("submit", function(e) { e.preventDefault(); checkWifiConnected(i) })
    }
  }
}
