function underTenRequests() {
  return `
<div class="how-to-text">
            <div>
              <h2 class="request-h2">
                Easily create a ticket by sending a <br> request — no extra steps
                needed.
              </h2>
              <p class="request-text margin-bottom-24">
                On this platform, you can submit your feature requests via a
                request form. Our AI system will automatically generate a ticket
                with a deadline and priority level.
              </p>
              <p class="request-text">
                A total of 10 requests can be created per day. After this limit,
                request can still be sent, but they will be manually reviewed by
                our team instead of generating AI tickets.
              </p>
            </div>

            <img class="request-img" src="./assets/icons/request_ok.svg" alt="" />
          </div>
          <button class="request-button create-request-button" onclick="window.location.href='request_form.html'">Create request <img class="create-request-img" src="./assets/icons/check_light.svg" alt="" /></button>
    `;
}

function overTenRequests() {
  return `
            <div class="how-to-text">
            <div>
              <p class="request-error">
                The daily 10-request limit has been reached! 
              </p>
              
              <p class="request-text-no-request">
                Need more? No worries — you can still send requests, but our team will review them manually instead of using AI to create tickets.
              </p>
              <button class="request-button create-request-button  margin-top-32" onclick="window.location.href='request_form.html'">Create request <img class="create-request-img" src="./assets/icons/check_light.svg" alt="" /></button>
            </div>

            <img class="request-img" src="./assets/icons/request_not_ok.svg" alt="" />
          </div>
    `;
}
