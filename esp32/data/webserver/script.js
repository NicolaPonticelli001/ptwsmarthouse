function extractIdNetwork(fullId) {
  const splitArray = fullId.split("-")
  return splitArray[splitArray.length - 1]
}

function deleteInput(buttonId) {
  let networkId = extractIdNetwork(buttonId)
  document.getElementById("pw-" + networkId).value = ""
}

function showPasswordBox(infoBoxId) {
  let networkId = extractIdNetwork(infoBoxId)
  let passwordBoxElement = document.getElementById("passwordBox-" + networkId);
  passwordBoxElement.classList.toggle("hide")

}
