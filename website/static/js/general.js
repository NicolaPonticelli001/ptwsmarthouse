window.addEventListener('load', afterWindowLoad());

// Operations to be executed after page loaded
function afterWindowLoad() {

}

function getUrlParameters() {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    return urlParams
}
