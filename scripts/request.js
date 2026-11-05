const textElement = document.getElementById("how-to-card");
const numberOfRequests = document.getElementById("number-of-requests");
const requestColor = document.getElementById("request-color")
let request = 11

function setRequestText() {
    if (request < 10) {
        numberOfRequests.innerText = request.toString()
        textElement.innerHTML = underTenRequests(); 
        requestColor.classList.remove("number-of-requests-not-ok");
        requestColor.classList.add("number-of-requests-ok");
    } else {
        request = 10
        numberOfRequests.innerText = request.toString()
        textElement.innerHTML = overTenRequests(); 
        requestColor.classList.remove("number-of-requests-ok");
        requestColor.classList.add("number-of-requests-not-ok");
    }
}