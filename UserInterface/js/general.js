window.addEventListener('load', afterWindowLoad());

// Operations to be executed after page loaded
function afterWindowLoad() {
    authErrorStyle()
}

/* START AUTH ERROR
These functions check the get variable. This can be "user" or "password". It's value means
that ther has been a problem with user authentication (credentials not correct). The get parameter is necessary
for user interface error
*/
function authErrorStyle() {
      const authError = obtainGetParameter('error');
      switch (authError){
        case 'user':
          break;
        case 'password':
          break;
      }
    }

function obtainGetParameter(parameterName) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(parameterName);
}
/* END AUTH ERROR */

//This function show or hide the apartment input inside "register" page
function toggleApartment() {
  let icon = document.getElementById('apartment-icon');

  if (icon.getAttribute('class').includes('plus')) icon.setAttribute('class','bi bi-dash-circle-fill');
  else icon.setAttribute('class','bi bi-plus-circle-fill');
}
