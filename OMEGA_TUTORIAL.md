# ⚡ MAILBLAST OMEGA — MASTER TUTORIAL

Welcome to the OMEGA system. MailBlast OMEGA is an unrestricted, dual-engine cold outreach platform. It uses a robust Python backend to bypass artificial rate limits and process background tasks, while providing a stunning Next.js "SaaS-style" interface for your daily operations.

---

## 🏗️ 1. Architecture & Setup
To run the system, two separate server processes must be running at the same time:

1. **The API Bridge (Python Backend)**
   - Open a terminal and navigate to: `cd "MailBlast Pro/mailblast-omega"`
   - Run: `source venv/bin/activate`
   - Run: `python3 api_bridge.py`
   - *This boots the database, tracking server, and email engines on port 8000.*

2. **The Web Interface (Next.js Frontend)**
   - Open a second terminal and navigate to: `cd "MailBlast Pro/mailblast-web"`
   - Run: `npm run dev`
   - *This boots the UI. Open `http://localhost:3000` in your web browser.*

---

## ⚙️ 2. How to Add an Account
Before you can send any emails, you must securely connect a sending address to the database.

1. Navigate to the **Accounts** tab (`http://localhost:3000/accounts`).
2. Click **+ Add Custom SMTP** (or Gmail/Outlook).
3. A modal will appear. Enter the required details:
    - **SMTP Host:** Usually `smtp.gmail.com` (for Gmail/Workspace) or `smtp.office365.com` (for Microsoft).
    - **Port:** Standard TLS port is `587`.
    - **Email Address:** The email you are sending from.
    - **App Password:** *CRITICAL:* For Gmail/Outlook, do NOT use your normal login password. You must turn on 2-Factor Authentication in your Google/Microsoft account, and generate a 16-digit "App Password" to paste here.
4. Click **Save Account**. The database encrypts the password globally using AES-256 and registers the node.

---

## 🚀 3. How to Start Working (Send a Blast)
Once an account is active in the system, you can send emails.

1. Go to the **Composer** tab.
2. Enter your **Subject**, **Body**, and specify a target audience.
3. **Spintax & Variables:** Use tags like `{FirstName}` for personalized data, or Spintax like `{Hi|Hello|Hey}`. The Python engine will randomize these per-recipient to bypass spam filters!
4. **Test Sending:** To ensure your SMTP account is working perfectly, type your personal email address into the yellow **Live Testing Override** box and click **TEST SEND**.
5. Once verified, click **INITIATE BLAST** to push the job to the Python background thread queue, where it will run via rotating sleep intervals to simulate human behavior.

---

## 🛑 5. Terminating & Restarting the System
As OMEGA is a dual-process system, you must manage both the Backend and the Frontend.

### How to STOP the System:
1.  **Frontend**: Go to the terminal where `npm run dev` is running and press `Ctrl + C`.
2.  **Backend**: Go to the terminal where `python3 api_bridge.py` is running and press `Ctrl + C`.

### How to RESTART the System:
Simply repeat the steps in **Section 1**:
1.  **Backend**: `cd mailblast-omega && source venv/bin/activate && python3 api_bridge.py`
2.  **Frontend**: `cd mailblast-web && npm run dev`

### 🛠️ Troubleshooting: "Address already in use"
If you get an error saying port **8000** or **3000** is already in use, it means a previous process didn't close properly.
- **To kill the Backend (Port 8000)**: Run `kill -9 $(lsof -t -i :8000)`
- **To kill the Frontend (Port 3000)**: Run `kill -9 $(lsof -t -i :3000)`

---

## 🧭 4. Purpose of Each UI Tab
(Description of tabs remains below...)

1. **Dashboard:** Your Operations Center. View live tracking metrics spanning Open Rates, Click Rates, and Volume. It also features a raw WebSocket-connected Terminal Log to watch real-time SMTP execution without viewing the code.
2. **Composer:** The email drafting client. Configure rotational logic, inject variables, test Spintax, and fire blasts.
3. **Scheduler:** *(Future/Placeholder)* For setting exact calendar dates and timezone-aware cron jobs (e.g., "Send on Monday at 9AM EST").
4. **AI Studio:** Enter a brief (e.g., "sell B2B software to founders") and let Groq's LLaMA 3.3 70B instantly generate highly persuasive copy, returning formatting and subjects automatically.
5. **Analytics:** Deep dive into historical metrics, tracking exactly which subject lines garnered the highest open percentages.
6. **Warm-Up:** Intelligent mailbox progression logic. Gradually increases the daily send volume of brand-new email accounts over 14 days to build domain reputation.
7. **Accounts:** The management panel for your AES-encrypted SMTP and IMAP connections. Essential for rotating between 50+ addresses to achieve infinite volume limits.
8. **Templates:** A vault to save your highest-converting email outlines so you don't have to rewrite cold outreach drafts from scratch.
9. **Blacklist:** Security protocol matrix to ensure you never accidentally send a cold email to legal domains, government accounts, or unhappy prospects.
10. **Settings:** Controls backend constraints, enabling/disabling the API bridge, local tracking ports, and backing up your `omega.db` file.
