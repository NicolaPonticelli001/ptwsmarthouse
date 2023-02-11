window.addEventListener("load", scriptBodyLoad)

function scriptBodyLoad() {
  let deleteButtons = document.querySelectorAll(".delete-btn");
  for (let button of deleteButtons) button.addEventListener("click", function(e) { deleteInput(e.target || e.srcElement) })
}

function deleteInput(element, isButtonWithSibling = true) {
  if (isButtonWithSibling) element.previousElementSibling.value = ""
  else element.value = ""
}
