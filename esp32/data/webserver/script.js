let requestDelay = 5000
let networkIntervalObj;

window.addEventListener("load", onBodyLoad);

function showManualConnection() {
  let container = document.getElementById("credentials-fixed-container").classList.toggle("hide")
  if (container.classList.contains("hide")) networkIntervalObj = setInterval(getNetworks, requestDelay)
  else clearInterval(networkIntervalObj)
}

function deleteInput(buttonElement) {
  buttonElement.previousElementSibling.value = ""
}

function showPasswordBox(networkNumber) {
  let passwordBoxElement = document.getElementById("passwordBox-" + networkNumber);

  document.querySelectorAll(".passwordBox").forEach( element => {
    if (element.id != passwordBoxElement.id) element.classList.add("hide")
  })
  passwordBoxElement.classList.toggle("hide")
  if (passwordBoxElement.classList.contains("hide")) networkIntervalObj = setInterval(getNetworks, requestDelay)
  else clearInterval(networkIntervalObj)
}

function onBodyLoad() {
  document.getElementById("manualConnectionBtn").addEventListener("click", showManualConnection)
  let deleteButtons = document.getElementsByClassName("delete-btn")
  for (let i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].addEventListener("click", function() { deleteInput(deleteButtons[i]) })
  }
  getNetworks()
  networkIntervalObj = setInterval(getNetworks, requestDelay)
}

function getNetworks() {
  const xhttp = new XMLHttpRequest()
  xhttp.onload = function() {
    //let test = '{"total":2,"0":{"rssi":-65,"ssid":"sassari","auth":3},"1":{"rssi":-34,"ssid":"palermo","auth":0}}'
    let networkListContainer = document.querySelector("#network-list-container")
    networkListContainer.textContent = ""

    if (this.responseText == "{}") networkListContainer.textContent = "No network found"
    else {
      const jsonObj = JSON.parse(this.responseText)
      let separatorTemplate = document.querySelector("#separator-template")
      let networkTemplate = document.querySelector("#network-list-template")


      for (let i = 0, total = parseInt(jsonObj["total"]); i < total; i++) {
        let singleNetworkContainer = networkTemplate.content.cloneNode(true);

        //Get the elements that need the id to be completed with the network number
        let toCompleteId = singleNetworkContainer.querySelectorAll("[data-completeId]")
        for (let j = 0; j< toCompleteId.length; j++) {
          if (toCompleteId[j].id == "delete") toCompleteId[j].addEventListener("click", function() { deleteInput(toCompleteId[j]) })
          if (toCompleteId[j].id == "infoBox") toCompleteId[j].addEventListener("click", function() { showPasswordBox(i) })
          toCompleteId[j].id += "-" + i
          toCompleteId[j].removeAttribute("data-completeId")
        }

        //Get the elements that are gonna contains the json data
        let toParseData = singleNetworkContainer.querySelectorAll("[data-parseData]")
        for (let j = 0; j < toParseData.length; j++) {
          toParseData[j].textContent = jsonObj[i.toString()][toParseData[j].id.toLowerCase()]
          toParseData[j].id += "-" + i
          toParseData[j].removeAttribute("data-parseData")
        }

        //Set the value of hidden input ssid
        let hiddenInputSsid = singleNetworkContainer.querySelector('input[name="ssid"]')
        console.log(hiddenInputSsid)
        hiddenInputSsid.setAttribute("value", jsonObj[i.toString()]["ssid"])

        networkListContainer.appendChild(singleNetworkContainer)
        if (i != total-1) networkListContainer.appendChild(separatorTemplate.content.cloneNode(true))
      }
    }
  }
  xhttp.open("POST", "networkscan")
  xhttp.send()
}
