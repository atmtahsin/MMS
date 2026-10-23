// The single API endpoint of the app: /api/<route name>.
//
// How a request is handled:
//   1. sign-in / sign-out / "who am I" routes are answered first
//   2. everything else needs a signed-in user
//   3. the route table below decides which roles may use each write route, then runs the action
//
// The actual database work lives in lib/actions/.
import { NextResponse } from 'next/server';
import { generateSqlBackup, recordAudit } from '../../../lib/database.mjs';
import { getSignedInUser, signIn, signOut } from '../../../lib/authentication.js';
import * as actions from '../../../lib/actions/index.js';
import { AppError } from '../../../lib/app-error.js';
import { PERMISSIONS, hasPermission } from '../../../lib/permissions.js';
import { SIMPLE_RECORD_TYPES } from '../../../lib/record-types.js';

export const dynamic = 'force-dynamic'; // never cache API answers

const MAX_IMPORT_ROWS = 2000;
const ADMIN_ONLY = ['admin'];

const jsonResponse = (data, httpStatus = 200) => NextResponse.json(data, { status: httpStatus });
const rolesThatCanEdit = (area) => PERMISSIONS[area].edit;

// Takes the rows of a CSV import out of the request body.
function getImportRows(body) {
  if (!Array.isArray(body.rows) || body.rows.length > MAX_IMPORT_ROWS) {
    throw new AppError('Invalid import');
  }
  return body.rows;
}

// Every POST route: which roles may call it, and the action to run.
// Each action receives (requestBody, signedInUser).
const WRITE_ROUTES = {
  // Students
  students: {
    allowedRoles: rolesThatCanEdit('students'),
    run: (body, user) => actions.addStudents([body], user),
  },
  'students/import': {
    allowedRoles: rolesThatCanEdit('students'),
    run: (body, user) => actions.addStudents(getImportRows(body), user),
  },
  'students/update': { allowedRoles: rolesThatCanEdit('students'), run: actions.updateStudent },
  'students/delete': { allowedRoles: ADMIN_ONLY, run: actions.deleteStudent },

  // Teachers and faculty
  teachers: { allowedRoles: rolesThatCanEdit('teachers'), run: actions.addTeacher },
  'teachers/import': {
    allowedRoles: rolesThatCanEdit('teachers'),
    run: (body, user) => actions.importTeachers(getImportRows(body), user),
  },
  'teachers/update': { allowedRoles: rolesThatCanEdit('teachers'), run: actions.updateTeacher },
  'teachers/delete': { allowedRoles: ADMIN_ONLY, run: actions.deleteTeacher },

  // HR & payroll
  'payroll/set-salary': {
    allowedRoles: rolesThatCanEdit('payroll'),
    run: actions.setSalaryStructure,
  },
  'payroll/generate': { allowedRoles: rolesThatCanEdit('payroll'), run: actions.generatePayroll },
  'payroll/adjust': { allowedRoles: rolesThatCanEdit('payroll'), run: actions.adjustPayrollLine },
  'payroll/mark-paid': {
    allowedRoles: rolesThatCanEdit('payroll'),
    run: actions.markPayrollLinePaid,
  },
  'payroll/delete': { allowedRoles: rolesThatCanEdit('payroll'), run: actions.deletePayrollLine },

  // Accounting
  'fee-types': { allowedRoles: rolesThatCanEdit('accounting'), run: actions.addFeeType },
  'fee-types/update': { allowedRoles: rolesThatCanEdit('accounting'), run: actions.updateFeeType },
  'fee-types/delete': { allowedRoles: ADMIN_ONLY, run: actions.deleteFeeType },
  'fee-types/import': {
    allowedRoles: rolesThatCanEdit('accounting'),
    run: (body, user) => actions.importFeeTypes(getImportRows(body), user),
  },
  invoices: { allowedRoles: rolesThatCanEdit('accounting'), run: actions.createInvoices },
  payments: { allowedRoles: rolesThatCanEdit('accounting'), run: actions.recordPayment },

  // Academic
  classes: { allowedRoles: rolesThatCanEdit('classes'), run: actions.addClass },
  'classes/delete': { allowedRoles: rolesThatCanEdit('classes'), run: actions.removeClass },
  subjects: { allowedRoles: rolesThatCanEdit('subjects'), run: actions.addSubject },
  'subjects/delete': { allowedRoles: rolesThatCanEdit('subjects'), run: actions.removeSubject },

  // User accounts
  users: { allowedRoles: ADMIN_ONLY, run: actions.saveUser },
  'users/delete': { allowedRoles: ADMIN_ONLY, run: actions.deleteUser },
};

// Routes of the simple record types look like  simple-records/<type>  or  simple-records/<type>/delete
const SIMPLE_RECORD_ROUTE_PATTERN = /^simple-records\/(\w+)(\/delete)?$/;

// Sends the whole database as a restorable SQL script. It is streamed, so a large database
// (photos included) is not held in memory or limited by the response size of serverless hosting.
async function downloadDatabaseBackup(user) {
  await recordAudit(user, 'backup downloaded'); // written first: no write may happen while the snapshot is open
  const backupPieces = generateSqlBackup();
  const first = await backupPieces.next(); // read errors surface here, before the response starts
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      if (!first.done) controller.enqueue(encoder.encode(first.value));
    },
    async pull(controller) {
      try {
        const next = first.done ? first : await backupPieces.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await backupPieces.return();
    },
  });
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': 'attachment; filename="madrassa-backup.sql"',
    },
  });
}

async function handleRequest(request, routeContext, httpMethod) {
  const { path: pathSegments } = await routeContext.params;
  const routeName = pathSegments.join('/');

  try {
    // Read the JSON body of POST requests.
    let body = {};
    if (httpMethod === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new AppError('Unsupported request', 415);
      body = await request.json().catch(() => ({}));
    }

    // Routes that do not need an existing session.
    if (routeName === 'login' && httpMethod === 'POST') {
      const clientIpAddress = request.headers.get('x-forwarded-for') || '';
      return jsonResponse({ user: await signIn(body, clientIpAddress) });
    }

    const user = await getSignedInUser();
    if (routeName === 'me') {
      return jsonResponse({ user: user && { username: user.username, role: user.role } });
    }
    if (routeName === 'logout') {
      await signOut();
      return jsonResponse({ ok: true });
    }

    // Everything below needs a signed-in user.
    if (!user) throw new AppError('Not signed in', 401);

    if (routeName === 'data') return jsonResponse(await actions.loadAllData(user));

    if (routeName === 'backup' && httpMethod === 'GET') {
      if (user.role !== 'admin') throw new AppError('Not allowed', 403);
      return await downloadDatabaseBackup(user);
    }

    // Simple record types (rooms, schedule, agenda, discipline, scholarships, records).
    const simpleRecordMatch = routeName.match(SIMPLE_RECORD_ROUTE_PATTERN);
    if (simpleRecordMatch && SIMPLE_RECORD_TYPES[simpleRecordMatch[1]] && httpMethod === 'POST') {
      const [, recordTypeName, deleteSuffix] = simpleRecordMatch;
      if (!hasPermission(user.role, recordTypeName, 'edit')) throw new AppError('Not allowed', 403);
      if (deleteSuffix) await actions.deleteSimpleRecord(recordTypeName, body, user);
      else await actions.saveSimpleRecord(recordTypeName, body, user);
      return jsonResponse({ ok: true });
    }

    // All other write routes.
    const route = WRITE_ROUTES[routeName];
    if (!route || httpMethod !== 'POST') throw new AppError('Not found', 404);
    if (!route.allowedRoles.includes(user.role)) throw new AppError('Not allowed', 403);
    await route.run(body, user);
    return jsonResponse({ ok: true });
  } catch (error) {
    if (error instanceof AppError) return jsonResponse({ error: error.message }, error.httpStatus);
    console.error(error);
    return jsonResponse({ error: 'Request failed' }, 400);
  }
}

export const GET = (request, routeContext) => handleRequest(request, routeContext, 'GET');
export const POST = (request, routeContext) => handleRequest(request, routeContext, 'POST');
