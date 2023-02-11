document.querySelector("form").addEventListener("submit", function(e) { e.preventDefault(); checkCredentials() })

const valueTimeoutCheckCredentials = 3000
let timeoutCheckCredentials

function checkCredentials() {
  const xhttp = new XMLHttpRequest()
  const inputEmail = document.querySelector('input[name="email"]')
  const inputPassword = document.querySelector('input[name="password"]')

  xhttp.onload = function() {
    console.log(responseText)
  }

  xhttp.open("POST", "accountCredentials")
  xhttp.send("email=" + inputEmail.value + "&password=" + inputPassword.value)
}
