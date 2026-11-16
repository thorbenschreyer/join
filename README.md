# JOIN – Kanban Task Management

**JOIN** ist eine responsive Kanban-Anwendung zur Organisation und Bearbeitung von Aufgaben. Neben der manuellen Ticketverwaltung ergänzt eine n8n-Automatisierung das System um KI-gestützte Ticketanlage, E-Mail-Benachrichtigungen und Fehlerbehandlung.

> **Projektstand: November 2026.** Diese Dokumentation kombiniert die öffentlich sichtbare Repository-Struktur mit den separat eingerichteten und getesteten n8n-Abläufen. Die n8n-Workflows sind nicht automatisch Bestandteil dieses GitHub-Repositories.

## Funktionen

- Aufgaben erstellen, bearbeiten und löschen
- Kanban-Board mit Drag & Drop und fünf Statusspalten
- Kategorien, Prioritäten, Fälligkeitsdaten, Kontakte, Zuweisungen und Teilaufgaben
- Responsive Benutzeroberfläche
- Speicherung von Tickets in Firebase Realtime Database
- Kontaktformular mit automatisierter Ticketanlage über n8n
- Optionale KI-Aufbereitung mit Gemini und Fallback ohne KI
- E-Mail-Bestätigung für Kunden und interne Ticketbenachrichtigung
- Fehlerbenachrichtigungen bei fehlgeschlagener Firebase-Speicherung
- Automatische E-Mail an den Ticketersteller bei jeder tatsächlichen Statusänderung

## Kanban-Workflow

| Spalte | Bedeutung |
| --- | --- |
| **Triage** | Neu eingegangene Tickets werden geprüft. |
| **To Do** | Ticket ist zur Bearbeitung eingeplant. |
| **In Progress** | Ticket wird bearbeitet. |
| **Await Feedback** | Ticket wartet auf eine Rückmeldung. |
| **Done** | Ticket ist abgeschlossen. |

Ein Ticket kann auch in eine vorherige Spalte zurückgeschoben werden. Bei einer tatsächlichen Statusänderung wird der Ersteller benachrichtigt; unveränderte Status lösen keine Benachrichtigung aus.

## Technologien

| Bereich | Technologie |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript |
| Datenspeicherung | Firebase Realtime Database / REST API |
| Workflow-Automatisierung | n8n |
| KI-Aufbereitung | Gemini über einen n8n-Modell-Node |
| Benachrichtigungen | SMTP-E-Mail über n8n |
| Webhooks | HTTP POST zwischen JOIN und n8n |

**Hinweis zur bisherigen README:** Sie nennt Angular, TypeScript, SCSS und eine `src/`-Struktur. Im öffentlich sichtbaren Repository-Stamm liegen jedoch HTML-Dateien sowie `scripts/`, `styles/` und `templates/`. Die tatsächlich verwendeten Frontend-Technologien sollten bei Änderungen anhand des Codes geprüft werden; diese README beschreibt deshalb keine nicht verifizierte Angular-Build-Pipeline.

## Repository-Struktur

```text
join/
├── assets/               # Medien und weitere Assets
├── footerpages/          # Footer-Unterseiten
├── scripts/              # JavaScript
├── styles/               # Stylesheets
├── templates/            # HTML-Vorlagen
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

Die Struktur entspricht den öffentlich sichtbaren Einträgen im Branch `main`; weitere verschachtelte Dateien sind hier nicht vollständig dokumentiert.

## Lokale Entwicklung

```bash
git clone https://github.com/thorbenschreyer/join.git
cd join
```

Öffne das Projekt über einen lokalen Entwicklungsserver, beispielsweise mit der **Live Server**-Erweiterung in VS Code. In der bisherigen Testumgebung lief das Frontend unter `http://127.0.0.1:5500` und n8n unter `http://localhost:5678`.

Die Anwendung benötigt eine passende Firebase-Konfiguration und für die Automatisierungen eine erreichbare n8n-Instanz. Zugangsdaten, SMTP-Passwörter und KI-API-Schlüssel gehören **nicht** ins öffentliche Repository.

## Systemarchitektur

```text
                         ┌─────────────────────┐
                         │   JOIN Frontend     │
                         │  Kanban / Formular  │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┴──────────────────┐
                  │                                    │
            Kontaktformular                    Statusänderung
                  │                                    │
                  ▼                                    ▼
       n8n: contact-request                Firebase: Status speichern
                  │                                    │
          KI / Fallback                                ▼
                  │                         n8n: join-ticket-status
                  ▼                                    │
       Firebase: Ticket erstellen                      ▼
                  │                         Status-E-Mail an Ersteller
            ┌─────┴─────┐
            │           │
         Erfolg       Fehler
            │           │
       Bestätigungs-  Interne Fehler-E-Mail
       und interne    und Kundeninformation
       Ticket-E-Mail
```

## n8n-Workflow 1: Kontaktformular und Ticketanlage

**Webhook:** `POST /webhook/contact-request`

1. Das Kontaktformular übermittelt Name, E-Mail-Adresse, Betreff und Nachricht an n8n.
2. n8n bestätigt den technischen Eingang des Requests frühzeitig. **Diese HTTP-Bestätigung ist noch keine Bestätigung einer erfolgreichen Firebase-Speicherung.**
3. Eine tägliche KI-Nutzungszählung in einer n8n Data Table (`ai_usage`) begrenzt die Modellaufrufe auf **10 Versuche pro Tag**.
4. Solange das Limit nicht erreicht ist, bereitet Gemini den Ticketinhalt auf, etwa Titel, Beschreibung, Kategorie, Priorität, Fälligkeit und Teilaufgaben.
5. Bei KI-Fehlern werden bis zu **drei Versuche** unternommen. Schlägt die Aufbereitung weiterhin fehl oder ist das Tageslimit erreicht, erstellt der Workflow ein Ticket **ohne KI**.
6. n8n ermittelt die nächste numerische Ticket-ID, stellt das Ticketobjekt zusammen und speichert es über die Firebase REST API.
7. **Erfolgszweig:** Eine interne Benachrichtigung und eine Kundenbestätigung mit Ticketnummer werden versendet.
8. **Fehlerzweig:** Eine interne E-Mail mit Kontaktdaten, ursprünglicher Nachricht und Fehlerbeschreibung wird versendet. Der Kunde erhält eine separate Eingangsbestätigung mit dem Hinweis, dass sich das Team persönlich melden wird – **ohne eine nicht vorhandene Ticketnummer zu behaupten**.

Die internen Ticket-E-Mails nutzen ein gemeinsames JOIN-HTML-Design. Der Fehlerausgang der Firebase-Anfrage ist in n8n über **On Error → Continue (using error output)** realisiert.

### Beispiel: Formular-Payload

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "subject": "Problem beim Login",
  "text": "Ich kann mich nicht anmelden."
}
```

### Beispiel: Ticketfelder

```json
{
  "id": 8,
  "title": "Login-Problem prüfen",
  "description": "Der Kunde kann sich nicht anmelden.",
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

Die Werte sind Beispiele. Die konkrete Feldbelegung richtet sich nach dem tatsächlich ausgeführten Workflow.

## n8n-Workflow 2: Statusbenachrichtigungen

**Webhook:** `POST /webhook/join-ticket-status`

Die Funktion `updateFirebaseCategory(firebaseId, newCategory)` liest den bisherigen Status, vergleicht ihn mit dem neuen Status und speichert Änderungen per `PATCH` in Firebase. **Erst nach erfolgreicher Speicherung** sendet sie einen POST-Request an n8n. Der n8n-Workflow verschickt eine E-Mail an `createdByEmail` mit Ticketnummer, Titel und neuem Status.

### Beispiel: Webhook-Payload

```json
{
  "firebaseId": "-O123456789",
  "ticketId": 8,
  "title": "Login-Problem prüfen",
  "createdBy": "Max Mustermann",
  "createdByEmail": "max@example.com",
  "oldStatus": "triage",
  "newStatus": "inProgress"
}
```

**Wichtig:** Die interne Statusbezeichnung muss exakt mit dem in Firebase gespeicherten Wert übereinstimmen. Die Anzeige in der E-Mail erfolgt über eine Status-zu-Text-Zuordnung im n8n-HTML-Template.

### Test- und Produktions-Webhooks

```text
Test:       http://localhost:5678/webhook-test/join-ticket-status
Produktion: http://localhost:5678/webhook/join-ticket-status
```

Der Test-Webhook funktioniert nur während **Listen for test event**. Für den regulären Betrieb muss der Workflow veröffentlicht/aktiviert sein und das Frontend die Produktions-URL verwenden.

`localhost` ist ausschließlich für lokale Tests geeignet. Eine öffentlich gehostete JOIN-Instanz benötigt eine erreichbare HTTPS-Adresse für n8n sowie eine abgesicherte Authentifizierung der Webhook-Aufrufe.

## Weitere n8n-Schnittstelle

Für die Anzeige des täglichen KI-Verbrauchs existiert ein separater Endpunkt:

```text
GET /webhook/join-ai-usage
```

Das Frontend nutzt diesen Endpunkt, um den aktuellen KI-Nutzungsstand anzuzeigen.

## Fehlerbehandlung und Grenzen

| Situation | Verhalten |
| --- | --- |
| KI-Tageslimit erreicht | Ticketanlage ohne KI |
| Gemini nicht erreichbar / ungültige Ausgabe | Wiederholungsversuche, anschließend Fallback ohne KI |
| Firebase-Ticketanlage erfolgreich | Normale Ticket- und Kunden-E-Mails |
| Firebase-Ticketanlage fehlgeschlagen | Interne Fehlermeldung und gesonderte Kundeninformation |
| Status bleibt unverändert | Keine Status-E-Mail |
| Statusänderung gespeichert | n8n-Webhook und Status-E-Mail |
| Status-E-Mail-Webhook nicht erreichbar | Statusänderung bleibt gespeichert; Fehler wird im Browser protokolliert |

**Noch nicht vollständig abgesichert:** Fällt gleichzeitig mit Firebase auch SMTP aus, gibt es aktuell keine unabhängig bestätigte dauerhafte Sicherung der ursprünglichen Anfrage. Ebenso ist eine garantierte Zustellung von Status-E-Mails mit Retry/Queue und Duplikatschutz noch nicht umgesetzt.

## Offene Aufgaben

- [ ] Automatische Sortierung interner JOIN-E-Mails in **Erledigt** (erfolgreiche Ticketanlage) und **Zu bearbeiten** (fehlgeschlagene Anlage); Entscheidung zwischen Hetzner-Mailregeln und n8n steht aus
- [ ] Webhook-Zugriffe und Firebase-Sicherheitsregeln für einen öffentlichen Betrieb härten
- [ ] Zuverlässige Benachrichtigungszustellung mit Retry/Queue und Duplikatschutz
- [ ] Unabhängige Sicherung von Kundenanfragen bei kombinierten Infrastrukturfehlern
- [ ] n8n-Workflow-Exporte ohne Credentials versioniert dokumentieren

## Sicherheit und Datenschutz

- Keine API-Schlüssel, SMTP-Zugangsdaten oder Zugangstokens committen.
- Firebase-Regeln so einschränken, dass unbefugte Nutzer keine fremden Tickets lesen oder verändern können.
- Statusbenachrichtigungen nicht allein anhand einer vom Browser übermittelten E-Mail-Adresse autorisieren; Ticket und Empfänger serverseitig prüfen.
- Bei öffentlich erreichbaren n8n-Webhooks HTTPS, Authentifizierung und Missbrauchsschutz vorsehen.
- Personenbezogene Daten in n8n-Ausführungsprotokollen und E-Mails nur so lange speichern, wie nötig.

## Projekt und Autor

Entwickelt von **Thorben Schreyer** im Rahmen der Developer-Akademie-Ausbildung und anschließend um Firebase- und n8n-Automatisierungen erweitert.

Repository: https://github.com/thorbenschreyer/join

## Lizenz

Das Projekt dient Lern- und Portfoliozwecken. Eine ausdrückliche Open-Source-Lizenz ist aus der öffentlich sichtbaren Repository-Übersicht nicht ersichtlich; die Nutzung durch Dritte sollte vorab geklärt werden.
