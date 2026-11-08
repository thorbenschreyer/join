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

function validateRequest(name, email, subject, text) {
  const nameRegex = /^[A-Za-zÄÖÜäöüß\s'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const subjectRegex = /^.{3,}$/;
  const textRegex = /^[\s\S]{10,}$/;

  if (!nameRegex.test(name)) return "Invalid name. Only letters and hyphens allowed.";
  if (!emailRegex.test(email)) return "Invalid email. “@” and valid domain required.";
  if (!subjectRegex.test(subject)) return "The subject must consist of at least 3 characters.";
  if (!textRegex.test(text)) return "The text must consist of at least 10 characters.";

  return null;
}

function checkRequestValidity() {
  const name = document.getElementById("request-name").value.trim();
  const email = document.getElementById("request-email").value.trim();
  const subject = document.getElementById("request-subject").value.trim();
  const text = document.getElementById("request-text").value.trim();

  const button = document.getElementById("send-request-button");
  const errorMessage = document.getElementById("request-error-text");

  const error = validateRequest(name, email, subject, text);

  button.disabled = error !== null;

  errorMessage.textContent = error || "";
}

function sendRequest() {

}