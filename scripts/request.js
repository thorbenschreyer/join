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

function validateRequest(name, email, text) {
  const nameRegex = /^[A-Za-zÄÖÜäöüß\s'\-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.(de|com|org|net)$/;
  const textRegex = /^(?=.*[a-zA-Z])(?=.*\d).{10,}$/;

  if (!nameRegex.test(name)) return "Invalid name. Only letters and hyphens allowed.";
  if (!emailRegex.test(email)) return "Invalid email. “@” and valid domain required.";
  if (!textRegex.test(text)) return "The text must consist of at least 10 characters.";

  return null;
}

function checkContactFormValidity() {
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const phone = document.getElementById("contact-phone").value.trim();
  const button = document.getElementById("add-contact-button");

  if (!name || !email || !phone) {
    button.disabled = true;
  } else {
    button.disabled = false;
  }
}