function toggleApartment() {
  let icon = document.getElementById('apartment-icon');

  if (icon.getAttribute('class').includes('plus')) icon.setAttribute('class','bi bi-dash-circle-fill');
  else icon.setAttribute('class','bi bi-plus-circle-fill');
}


function deleteInputContent(input) { document.getElementById(input).value = ''; }


function togglePassword(passwordInput) {
  let input = document.getElementById(passwordInput);
  let eyeIcon;
  let passwordShow = false;

  if (input.getAttribute('type') == 'password') {
    input.setAttribute('type', 'text');
    passwordShow = true;
  } else {
    input.setAttribute('type', 'password');
    passwordShow = false;
  }

  if (passwordInput.includes('repeat')) eyeIcon = document.getElementById('repeat-password-eye');
  else eyeIcon = document.getElementById('password-eye');

  if (passwordShow) eyeIcon.setAttribute('class', 'bi bi-eye-slash-fill');
  else eyeIcon.setAttribute('class', 'bi bi-eye-fill');
}
