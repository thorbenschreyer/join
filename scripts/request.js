const textElement = document.getElementById("how-to-card");
const numberOfRequests = document.getElementById("number-of-requests");
const numberOfRequestsMobile = document.getElementById("number-of-requests-mobile");
const requestColor = document.getElementById("request-color");
const requestColorMobile = document.getElementById("request-color-mobile");
const succsesDialog = document.getElementById("succses-request-dialog")
let numberOfRequest = 0;

async function loadAiUsage() {
  try {
    const response = await fetch("http://localhost:5678/webhook/join-ai-usage");
    if (!response.ok) {throw new Error("KI-Zähler konnte nicht geladen werden");}
    const data = await response.json();
    numberOfRequest = Math.min(10, Math.max(0, Number(data.used) || 0));
    setRequestText();
  } catch (error) {console.error("Fehler beim Laden des KI-Zählers:", error);}
}

function setRequestText() {
  if (numberOfRequest < 10) {
    numberOfRequests.innerText = numberOfRequest.toString();
    numberOfRequestsMobile.innerText = numberOfRequest.toString();
    textElement.innerHTML = underTenRequests();
    requestColor.classList.remove("number-of-requests-not-ok");
    requestColor.classList.add("number-of-requests-ok");
    requestColorMobile.classList.remove("number-of-requests-not-ok");
    requestColorMobile.classList.add("number-of-requests-ok");
  } else {
    numberOfRequest = 10;
    numberOfRequests.innerText = numberOfRequest.toString();
    numberOfRequestsMobile.innerText = numberOfRequest.toString();
    textElement.innerHTML = overTenRequests();
    requestColor.classList.remove("number-of-requests-ok");
    requestColor.classList.add("number-of-requests-not-ok");
    requestColorMobile.classList.remove("number-of-requests-ok");
    requestColorMobile.classList.add("number-of-requests-not-ok");
  }
}

// Call this after the page elements have been initialized.
loadAiUsage();

function validateRequest(name, email, subject, text) {
  const nameRegex = /^[A-Za-zÄÖÜäöüß\s'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const subjectRegex = /^.{3,}$/;
  const textRegex = /^[\s\S]{10,}$/;

  if (!nameRegex.test(name))
    return "Invalid name.";
  if (!emailRegex.test(email))
    return "Invalid email. Need @ and domain.";
  if (!subjectRegex.test(subject))
    return "Subject need min. 3 characters.";
  if (!textRegex.test(text))
    return "Request need min. 10 characters.";

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


async function sendRequest(event) {
  event.preventDefault();

  const request = {
    name: document.getElementById("request-name").value.trim(),
    email: document.getElementById("request-email").value.trim(),
    subject: document.getElementById("request-subject").value.trim(),
    text: document.getElementById("request-text").value.trim(),
  };

  const webhookUrl = "http://localhost:5678/webhook/contact-request";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Webhook konnte nicht erreicht werden.");
    }

    const result = await response.json();

    if (result.success !== true) {
      throw new Error("Anfrage wurde nicht bestätigt.");
    }

    succsesDialog.showModal();

  } catch (error) {
    console.error("Fehler beim Senden:", error);
    alert("Deine Anfrage konnte nicht gesendet werden.");
  }
}
