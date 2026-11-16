const textElement = document.getElementById("how-to-card");

const numberOfRequests = document.getElementById("number-of-requests");

const numberOfRequestsMobile = document.getElementById(
  "number-of-requests-mobile",
);

const requestColor = document.getElementById("request-color");

const requestColorMobile = document.getElementById("request-color-mobile");

const succsesDialog = document.getElementById("succses-request-dialog");

let numberOfRequest = 0;

/**
 * Loads the current AI request usage from n8n.
 * The request content stays hidden until the API responds.
 */
async function loadAiUsage() {
  const placeholder = document.getElementById("ai-status-placeholder");

  const content = document.getElementById("ai-status-content");

  const loadingMessage = document.getElementById("ai-loading-message");

  if (!placeholder || !content) return;

  placeholder.hidden = false;
  content.hidden = true;

  try {
    const response = await fetch(
      "http://localhost:5678/webhook/join-ai-usage",
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("AI request counter could not be loaded");
    }

    const data = await response.json();

    const used = Number(data.used);

    if (
      data.used === null ||
      data.used === undefined ||
      !Number.isFinite(used)
    ) {
      throw new Error("Invalid AI request counter");
    }

    numberOfRequest = Math.min(10, Math.max(0, Math.trunc(used)));

    // Render the correct template and request counters.
    setRequestText();

    // Reveal the finished content.
    content.hidden = false;

    requestColor.classList.remove("ai-pending");
    requestColorMobile.classList.remove("ai-pending");

    // Hide the loading indicator.
    placeholder.hidden = true;
  } catch (error) {
    console.error("Error loading AI request counter:", error);

    // Do not show an incorrect request count.
    content.hidden = true;

    requestColor.classList.add("ai-pending");
    requestColorMobile.classList.add("ai-pending");

    // Show an error message instead.
    if (loadingMessage) {
      loadingMessage.textContent =
        "Request availability is temporarily unavailable.";
    }

    const spinner = placeholder.querySelector(".ai-spinner");

    if (spinner) {
      spinner.hidden = true;
    }
  }
}

/**
 * Updates the AI request counter and its visual state.
 */
function setRequestText() {
  const requestCount = numberOfRequest.toString();

  numberOfRequests.innerText = requestCount;
  numberOfRequestsMobile.innerText = requestCount;

  if (numberOfRequest < 10) {
    textElement.innerHTML = underTenRequests();

    requestColor.classList.remove("number-of-requests-not-ok");

    requestColor.classList.add("number-of-requests-ok");

    requestColorMobile.classList.remove("number-of-requests-not-ok");

    requestColorMobile.classList.add("number-of-requests-ok");
  } else {
    textElement.innerHTML = overTenRequests();

    requestColor.classList.remove("number-of-requests-ok");

    requestColor.classList.add("number-of-requests-not-ok");

    requestColorMobile.classList.remove("number-of-requests-ok");

    requestColorMobile.classList.add("number-of-requests-not-ok");
  }
}

/**
 * Initialize the AI counter exactly once.
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAiUsage);
} else {
  loadAiUsage();
}

/**
 * Validates the contact request.
 */
function validateRequest(name, email, subject, text) {
  const nameRegex = /^[A-Za-zÄÖÜäöüß\s'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const subjectRegex = /^.{3,}$/;
  const textRegex = /^[\s\S]{10,}$/;

  if (!nameRegex.test(name)) {
    return "Invalid name.";
  }

  if (!emailRegex.test(email)) {
    return "Invalid email. Need @ and domain.";
  }

  if (!subjectRegex.test(subject)) {
    return "Subject need min. 3 characters.";
  }

  if (!textRegex.test(text)) {
    return "Request need min. 10 characters.";
  }

  return null;
}

/**
 * Checks form validity and updates the submit button.
 */
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

/**
 * Sends the customer request to n8n.
 */
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
