const textElement = document.getElementById("how-to-card");
const numberOfRequests = document.getElementById("number-of-requests");
let request = 9

function setRequestText() {
    if (request < 10) {
        numberOfRequests.innerText = request.toString()
        textElement.innerHTML = underTenRequests(); 
    } else {
        request = 10
        numberOfRequests.innerText = request.toString()
        textElement.innerHTML = overTenRequests(); 
    }
}