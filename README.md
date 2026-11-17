# JOIN – Kanban Task Management

**JOIN** is a responsive Kanban application designed to organize and manage tasks. In addition to manual ticket management, an n8n automation extends the system with AI-assisted ticket creation, email notifications, and error handling.

> **Project status: November 2026.** This documentation combines the publicly visible repository structure with separately configured and tested n8n workflows. The n8n workflows are not automatically included in this GitHub repository.

## Features

- Create, edit, and delete tasks
- Kanban board with drag-and-drop functionality and five status columns
- Categories, priorities, due dates, contacts, assignments, and subtasks
- Responsive user interface
- Ticket storage using Firebase Realtime Database
- Contact form with automated ticket creation via n8n
- Optional AI-powered ticket processing using Gemini, with a fallback mechanism
- Customer confirmation emails and internal ticket notifications
- Error notifications when Firebase storage fails
- Automatic email notifications to ticket creators whenever a ticket's status actually changes

## Kanban Workflow

| Column | Description |
|---|---|
| **Triage** | Newly submitted tickets are reviewed. |
| **To Do** | Tickets scheduled for processing. |
| **In Progress** | Tickets currently being worked on. |
| **Await Feedback** | Tickets waiting for a response or feedback. |
| **Done** | Completed tickets. |

Tickets can also be moved back to a previous column. When a ticket's status changes, its creator is notified automatically. No notification is sent if the status remains unchanged.

## Technologies

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Data Storage | Firebase Realtime Database / REST API |
| Workflow Automation | n8n |
| AI Processing | Gemini via an n8n model node |
| Notifications | SMTP email via n8n |
| Webhooks | HTTP POST between JOIN and n8n |

**Note regarding the previous README:** It references Angular, TypeScript, SCSS, and a `src/` directory structure. However, the publicly visible repository root contains HTML files and the directories `scripts/`, `styles/`, and `templates/`. The actual frontend technologies should be verified against the source code before making changes. Therefore, this README does not describe an unverified Angular build pipeline.

## Repository Structure

```text
join/
├── assets/               # Media and other assets
├── footerpages/          # Footer subpages
├── scripts/              # JavaScript files
├── styles/               # Stylesheets
├── templates/            # HTML templates
├── index.html
├── login.html
├── sign_up.html
├── request_form.html
├── request_page.html
├── standard_layout.html
├── script.js
├── style.css
└── README.md
```

This structure reflects the publicly visible entries in the `main` branch. Additional nested files are not fully documented here.

## Local Development

```bash
git clone https://github.com/thorbenschreyer/join.git
cd join
```

Run the project using a local development server, such as the **Live Server** extension in Visual Studio Code.

The previous testing environment used:

- Frontend: `http://127.0.0.1:5500`
- n8n: `http://localhost:5678`

The application requires a properly configured Firebase environment and an accessible n8n instance for its automation features.

**Important:** Credentials, SMTP passwords, and AI API keys must never be stored in the public repository.

## System Architecture

```text
                   JOIN Frontend
                 (Kanban / Forms)
                        |
             +----------+----------+
             |                     |
        Contact Form          Status Change
             |                     |
             v                     v
    n8n: contact-request     Firebase: Save Status
             |                     |
       AI / Fallback               v
             |              n8n: join-ticket-status
             v                     |
    Firebase: Create Ticket        v
             |              Status Email to Creator
       +-----+-----+
       |           |
     Success     Failure
       |           |
       v           v
  Confirmation   Internal Error Email
  and Internal   and Customer
  Ticket Emails  Notification
```

## n8n Workflow 1: Contact Form and Ticket Creation

**Webhook:** `POST /webhook/contact-request`

1. The contact form sends the user's name, email address, subject, and message to n8n.
2. n8n acknowledges the technical receipt of the request at an early stage. **This HTTP response does not confirm successful storage in Firebase.**
3. A daily AI usage counter stored in an n8n Data Table (`ai_usage`) limits model calls to **10 attempts per day**.
4. As long as the daily limit has not been reached, Gemini processes the ticket information, including its title, description, category, priority, due date, and subtasks.
5. If AI processing fails, up to **three attempts** are made. If all attempts fail or the daily limit has been reached, the workflow creates the ticket **without AI processing**.
6. n8n determines the next numerical ticket ID, builds the ticket object, and stores it using the Firebase REST API.
7. **Success path:** An internal notification and a customer confirmation email containing the ticket number are sent.
8. **Error path:** An internal email containing the contact details, original message, and error description is sent. The customer receives a separate acknowledgment explaining that the team will contact them personally, **without claiming that a ticket number was generated**.

Internal ticket notifications use a consistent JOIN HTML email design.

Firebase request failures are handled in n8n using **On Error → Continue (using error output)**.

### Example: Contact Form Payload

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "subject": "Login issue",
  "text": "I cannot log in."
}
```

### Example: Ticket Object

```json
{
  "id": 8,
  "title": "Investigate login issue",
  "description": "The customer cannot log in.",
  "category": "Technical Task",
  "priority": "medium",
  "dueDate": "",
  "subtasks": [],
  "currentTask": "triage",
  "createdBy": "Max Mustermann",
  "createdByEmail": "max@example.com",
  "ticketSource": "ai"
}
```

These values are examples. The actual field values depend on the executed workflow.

## n8n Workflow 2: Ticket Status Notifications

**Webhook:** `POST /webhook/join-ticket-status`

The function `updateFirebaseCategory(firebaseId, newCategory)` performs the following operations:

1. Retrieves the ticket's current status.
2. Compares the current status with the new status.
3. Saves the updated status to Firebase using a `PATCH` request.
4. Sends a POST request to n8n **only after the update has been saved successfully**.

The n8n workflow then sends an email to `createdByEmail` containing the ticket number, title, and updated status.

### Example: Webhook Payload

```json
{
  "firebaseId": "-O123456789",
  "ticketId": 8,
  "title": "Investigate login issue",
  "createdBy": "Max Mustermann",
  "createdByEmail": "max@example.com",
  "oldStatus": "triage",
  "newStatus": "inProgress"
}
```

**Important:** Internal status identifiers must exactly match the values stored in Firebase. The email displays user-friendly status labels using a status-to-text mapping within the n8n HTML template.

### Test and Production Webhooks

```text
Test:
http://localhost:5678/webhook-test/join-ticket-status

Production:
http://localhost:5678/webhook/join-ticket-status
```

The test webhook only works while **Listen for test event** is active.

For regular operation, the workflow must be published and activated, and the frontend must use the production webhook URL.

`localhost` is suitable for local testing only.

A publicly hosted JOIN application requires an accessible HTTPS endpoint for n8n and secure authentication for webhook requests.

## Additional n8n Endpoint

A separate endpoint provides information about daily AI usage:

```text
GET /webhook/join-ai-usage
```

The frontend uses this endpoint to display the current AI usage statistics.

## Error Handling and Limitations

| Situation | System Behavior |
|---|---|
| Daily AI limit reached | Ticket creation without AI |
| Gemini unavailable or invalid response | Retry attempts followed by fallback |
| Firebase ticket creation successful | Standard ticket and customer emails |
| Firebase ticket creation failed | Internal error notification and separate customer information |
| Ticket status unchanged | No status notification |
| Ticket status successfully updated | n8n webhook triggered and status email sent |
| Status notification webhook unavailable | Status update remains saved; error is logged in the browser |

**Current limitation:** If both Firebase and SMTP fail simultaneously, there is currently no independently verified persistent backup of the original customer request.

Additionally, guaranteed delivery of status notifications using retries, queues, and duplicate prevention has not yet been implemented.

## Open Tasks

- [ ] Automatically sort internal JOIN emails into **Completed** (successful ticket creation) and **To Process** (failed ticket creation). The decision between Hetzner email rules and n8n automation is still pending.
- [ ] Strengthen webhook access protection and Firebase security rules for public deployment.
- [ ] Implement reliable notification delivery using retries, queues, and duplicate prevention.
- [ ] Implement independent storage of customer requests in case of combined infrastructure failures.
- [ ] Version and document n8n workflow exports without including credentials.

## Security and Data Protection

- Never commit API keys, SMTP credentials, or access tokens to the repository.
- Configure Firebase security rules to prevent unauthorized users from accessing or modifying other users' tickets.
- Do not authorize status notifications based solely on an email address submitted by the browser. Validate the ticket and recipient on the server side.
- Protect publicly accessible n8n webhooks using HTTPS, authentication, and abuse prevention mechanisms.
- Retain personal data in n8n execution logs and emails only for as long as necessary.

## Project and Author

Developed by **Thorben Schreyer** as part of the Developer Akademie training program and subsequently extended with Firebase integration and n8n automation workflows.

**Repository:** https://github.com/thorbenschreyer/join

## License

This project is intended for educational and portfolio purposes.

No explicit open-source license is visible in the publicly accessible repository overview. Third-party usage rights should therefore be clarified before reusing or distributing the project.
