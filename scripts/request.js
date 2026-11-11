const textElement = document.getElementById("how-to-card");
const numberOfRequests = document.getElementById("number-of-requests");
const requestColor = document.getElementById("request-color");
const succsesDialog = document.getElementById("succses-request-dialog")
let numberOfRequest = 11;

function setRequestText() {
  if (numberOfRequest < 10) {
    numberOfRequests.innerText = request.toString();
    textElement.innerHTML = underTenRequests();
    requestColor.classList.remove("number-of-requests-not-ok");
    requestColor.classList.add("number-of-requests-ok");
  } else {
    numberOfRequest = 10;
    numberOfRequests.innerText = numberOfRequest.toString();
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

  if (!nameRegex.test(name))
    return "Invalid name.";
  if (!emailRegex.test(email))
    return "Invalid email.";
  if (!subjectRegex.test(subject))
    return "Minimum 3 characters.";
  if (!textRegex.test(text))
    return "Minimum 10 characters.";

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

function sendRequest(event) {
  event.preventDefault();

  const request = {
    name: document.getElementById("request-name").value,
    email: document.getElementById("request-email").value,
    subject: document.getElementById("request-subject").value,
    text: document.getElementById("request-text").value,
  };

  console.log({
    request,
  });
  succsesDialog.showModal()
}