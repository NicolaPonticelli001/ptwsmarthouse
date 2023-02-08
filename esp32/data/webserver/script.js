let requestDelay = 5000
let networkIntervalObj;

function extractIdNetwork(fullId) {
  const splitArray = fullId.split("-")
  return splitArray[splitArray.length - 1]
}

function deleteInput(buttonId) {
  let networkId = extractIdNetwork(buttonId)
  document.getElementById("password-" + networkId).value = ""
}

function showPasswordBox(infoBoxId) {
  let networkId = extractIdNetwork(infoBoxId)
  let passwordBoxElement = document.getElementById("passwordBox-" + networkId);

  document.querySelectorAll(".passwordBox").forEach( element => {
    if (element.id != passwordBoxElement.id) element.classList.add("hide")
  })
  passwordBoxElement.classList.toggle("hide")
  if (passwordBoxElement.classList.contains("hide")) networkIntervalObj = setInterval(getNetworks, requestDelay)
  else clearInterval(networkIntervalObj)
}

function onBodyLoad() {

  getNetworks()
  networkIntervalObj = setInterval(getNetworks, requestDelay)
}

function getNetworks() {
  const xhttp = new XMLHttpRequest()
  xhttp.onload = function() {
    let networkListContainer = document.querySelector("#network-list-container")
    networkListContainer.textContent = ""

    if (this.responseText == "{}") networkListContainer.textContent = "No network found"
    else {
      const jsonObj = JSON.parse(this.responseText)
      let separatorTemplate = document.querySelector("#separator-template")
      let networkTemplate = document.querySelector("#network-list-template")


      for (let i = 0, total = parseInt(jsonObj["total"]); i < total; i++) {
        let singleNetworkContainer = networkTemplate.content.cloneNode(true);

        let toCompleteId = singleNetworkContainer.querySelectorAll("[data-completeId]")
        for (let j = 0; j< toCompleteId.length; j++) {
          toCompleteId[j].id += "-" + i
          toCompleteId[j].removeAttribute("data-completeId")
        }

        let toParseData = singleNetworkContainer.querySelectorAll("[data-parseData]")
        for (let j = 0; j < toParseData.length; j++) {
          toParseData[j].textContent = jsonObj[i.toString()][toParseData[j].id.toLowerCase()]
          toParseData[j].id += "-" + i
          toParseData[j].removeAttribute("data-parseData")
        }

        networkListContainer.appendChild(singleNetworkContainer)
        if (i != total-1) networkListContainer.appendChild(separatorTemplate.content.cloneNode(true))
      }
    }
  }
  xhttp.open("POST", "networkscan")
  xhttp.send()
}
