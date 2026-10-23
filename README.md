# Madrassa Management System

Next.js + Turso (libSQL / SQLite). Bangla/English interface, mobile-first responsive layout
(phone, tablet, desktop, light and dark mode), printable ID cards, invoices, payslips and timetables.

## Modules

Students, Teachers, Academic, Accounting, HR & Payroll, Facilities, Administrative, Settings,
Dashboard, audit trail, CSV import/export, backups.
The database is created automatically on first start. (Upgrading databases from very old versions, including the old `mms.db`, is no longer automatic; restore those through a backup or CSV import.)

## Run

    npm install
    npm run build && npm start        # http://localhost:3000  (npm run dev for development)

Without any settings the app stores data in a local file (`./data/madrassa.db`). To use a hosted
Turso database instead, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (see `.env.example`).

First start creates user `admin` and prints its password in the log (or set ADMIN_PASSWORD).
Add staff: `npm run create-user -- <username> <password 10+ chars> <admin|registrar|accounts>`

## Student portal (students and guardians)

A `student` account is linked to one **Family ID** (e.g. `FAM-0001`) and sees only that family's data,
read-only: **My profile** (with ID card), **Fees & payments** (invoices, paid/outstanding, printable) and
**Class timetable** (printable). A guardian with several children gets a tab per child.

- Create one in the app: _Settings -> Users -> Role "Student / guardian" -> pick the Family ID_.
- Or from the command line: `npm run create-user -- <username> <password> student FAM-0001`
- Re-saving the same username resets its password and family.
- Privacy is enforced on the server (`lib/actions/load-all-data.js`): the API only returns that family's
  students, invoices and class timetable, and every write route refuses the `student` role (HTTP 403).
- Find a family's ID in the Students list (Family ID column).

## Demo data

    npm run seed-demo              # sample students, fees, payroll, timetable...
    npm run seed-demo -- --reset   # wipes school data first (user accounts are kept)

Creates `registrar`, `accounts` and `guardian` (student portal, family FAM-0001) logins (password `Demo-Pass-2026`). Not for production.

## Deploy on Vercel with Turso

Vercel's file system is temporary, so the data must live in a hosted database. Turso is a hosted SQLite.

1. Install the Turso CLI and sign in: `turso auth login`
2. Create the database in a region close to your Vercel functions (Vercel's default is Washington DC, `iad1`):
   `turso db create madrassa --location <region>` (list regions with `turso db locations`)
3. Get its URL and a token:
   `turso db show madrassa --url` and `turso db tokens create madrassa`
4. In Vercel: Project -> Settings -> Environment Variables, add `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   and `ADMIN_PASSWORD` (a long password for the first `admin` user), then deploy.
5. Open the site and sign in as `admin`. The tables are created automatically on the first request.
   Add other users in Settings -> Users.

Notes:
- Set `ADMIN_PASSWORD` before the first request. It is used only while there are no users.
- Tables are created and the `admin` user is made the first time any request reaches the database.
- Student photos are stored in the database and sent with the list of students. Vercel limits a function
  response to about 4.5 MB, so keep photos small (the form already shrinks them) or move photos to file
  storage if you register many hundreds of students.
- Demo data / scripts against Turso: put the same two variables in your shell, then
  `npm run seed-demo`, `npm run create-user -- ...`, `npm run backup`.

## Other production setups

- Env: `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (hosted database), or `DATA_DIR` (folder of the local
  database file, default ./data), `ADMIN_PASSWORD` (first start only),
  `COOKIE_SECURE=false` only when serving over plain HTTP.
- Docker with a local file: `docker build -t madrassa . && docker run -p 3000:3000 -v madrassa-data:/data madrassa`
  (the volume keeps the data; hosts without persistent disks, such as Render's free plan, lose it).
- Backups: admin can download one in Settings, or `npm run backup` (BACKUP_DIR, BACKUP_KEEP=14) from cron.
  A backup is a plain SQL file (`madrassa-backup.sql`). Turso also offers its own point-in-time restore.
- Restore: `npm run restore -- <backup.sql>` (or `turso db shell madrassa < backup.sql`). Rows in the
  backup replace rows with the same id; the app does not need to be stopped.

## Project map

    app/
      page.js, layout.js            Route entry and HTML shell
      globals.css                   Imports the files in styles/
      styles/                       design-tokens, base, layout, components, screens, print
      i18n/                         translations.en.js, translations.bn.js, index.js
      helpers/                      api-client, csv, files, formatting, money, schedule
      components/
        MadrassaApp.js              App shell: session, data loading, navigation, toasts
        AppContext.js               Shared values (translate, permissions, save helper, data)
        LoginScreen.js
        layout/                     Sidebar, TopBar, ToastMessage, navigation-items
        ui/                         Icon, FormField, ModalDialog, ResponsiveTable, TabBar, StatCard...
        records/                    Generic table + form for rooms/schedule/agenda/..., WeeklyTimetable
        print/PrintableSheet.js     ID card, invoice, payslip, timetable preview
        screens/<name>/             One folder per screen (screens/portal/ = student portal)
      api/[...path]/route.js        The only API endpoint (checks role, then runs an action)
    lib/
      permissions.js                Who can see / change what (one table)
      record-types.js               Definitions of the simple record types
      database.mjs                  Turso connection, schema, query helpers, audit log, SQL backup
      authentication.js, passwords.mjs, validation.js, app-error.js
      actions/                      Every database write, one file per area
    scripts/                        create-user, backup, seed-demo

## How to change things

- **Add a label:** add the same key to `translations.en.js` and `translations.bn.js`, use `translate('area.key')`.
- **Add a field to a simple record:** add it to `lib/record-types.js` and the table in `lib/database.mjs` An existing database is not changed automatically: also run `ALTER TABLE <table> ADD COLUMN ...` once (e.g. `turso db shell madrassa`).
  then add `field.<column>` to both translation files.
- **Change who can do what:** edit `lib/permissions.js` only; the menu and the API both read it.
  The `student` role is deliberately absent from that table (deny by default); what it may read is
  decided in `loadStudentPortalData` in `lib/actions/load-all-data.js`.
- **Re-theme:** edit `app/styles/design-tokens.css`.
- **Format code:** `npm run format`.
