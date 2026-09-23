const { google } = require('googleapis');

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function sheetsClient() {
  if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error('Google Sheets secrets are not configured.');
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth });
}

const headers = {
  Members: ['PSEUDO', 'EMAIL', 'TANK', 'AVION', 'MISSILE', 'TOTAL', 'T11', 'LAST_UPDATED', 'CREATED_AT'],
  History: ['DATE', 'PSEUDO', 'TANK', 'AVION', 'MISSILE', 'TOTAL', 'T11'],
  PendingMembers: ['PSEUDO', 'EMAIL', 'CODE', 'EXPIRES_AT', 'CREATED_AT', 'USED'],
  Config: ['KEY', 'VALUE']
};

async function read(name) {
  const result = await sheetsClient().spreadsheets.values.get({
    spreadsheetId,
    range: `'${name}'!A:Z`
  });
  return result.data.values || [];
}

async function append(name, values) {
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId,
    range: `'${name}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });
}

async function update(name, range, values) {
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId,
    range: `'${name}'!${range}`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

async function ensureSheets() {
  const api = sheetsClient();
  const book = await api.spreadsheets.get({ spreadsheetId });
  const existing = book.data.sheets.map((s) => s.properties.title);
  for (const [name, row] of Object.entries(headers)) {
    if (!existing.includes(name)) {
      await api.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: name } } }] }
      });
    }
    const values = await read(name);
    if (!values.length) await append(name, [row]);
  }
}

function objects(values) {
  if (!values.length) return [];
  return values.slice(1).map((row) => Object.fromEntries(values[0].map((key, i) => [key.toLowerCase(), row[i] || ''])));
}

async function getMembers() {
  return objects(await read('Members')).map((m) => ({
    pseudo: m.pseudo, email: m.email, tank: Number(m.tank || 0), avion: Number(m.avion || 0),
    missile: Number(m.missile || 0), total: Number(m.total || 0), t11: m.t11 || 'Non',
    last_updated: m.last_updated, created_at: m.created_at
  }));
}

async function findMemberByPseudo(pseudo) {
  return (await getMembers()).find((m) => m.pseudo.toLowerCase() === String(pseudo).toLowerCase()) || null;
}

async function saveMember(member) {
  const values = await read('Members');
  const pseudo = String(member.pseudo).trim();
  const row = [pseudo, member.email || '', String(member.tank || 0), String(member.avion || 0), String(member.missile || 0), String(member.total || 0), member.t11 === 'Oui' ? 'Oui' : 'Non', new Date().toISOString(), member.created_at || ''];
  const index = values.slice(1).findIndex((r) => String(r[0] || '').toLowerCase() === pseudo.toLowerCase());
  if (index >= 0) await update('Members', `A${index + 2}:I${index + 2}`, [row]);
  else await append('Members', [row]);
}

async function appendHistory(entry) {
  await append('History', [[entry.date || new Date().toISOString(), entry.pseudo, String(entry.tank || 0), String(entry.avion || 0), String(entry.missile || 0), String(entry.total || 0), entry.t11 === 'Oui' ? 'Oui' : 'Non']]);
}

async function getHistory() { return objects(await read('History')); }

async function savePendingMember(data) { await append('PendingMembers', [[data.pseudo, data.email, data.code, data.expiresAt, data.createdAt, 'false']]); }

async function getPendingMember(email, code) {
  return objects(await read('PendingMembers')).reverse().find((p) => p.email.toLowerCase() === email.toLowerCase() && p.code === code && p.used !== 'true' && new Date(p.expires_at) > new Date()) || null;
}

async function markPendingMemberAsUsed(email, pseudo) {
  const values = await read('PendingMembers');
  const index = values.slice(1).findIndex((r) => r[0] === pseudo && String(r[1]).toLowerCase() === email.toLowerCase());
  if (index >= 0) await update('PendingMembers', `F${index + 2}:F${index + 2}`, [['true']]);
}

async function getConfigValue(key) {
  return objects(await read('Config')).find((r) => r.key.toLowerCase() === key.toLowerCase())?.value || null;
}

async function setConfigValue(key, value) {
  const values = await read('Config');
  const index = values.slice(1).findIndex((r) => String(r[0]).toLowerCase() === key.toLowerCase());
  if (index >= 0) await update('Config', `A${index + 2}:B${index + 2}`, [[key, String(value)]]);
  else await append('Config', [[key, String(value)]]);
}

module.exports = { ensureSheets, getMembers, saveMember, appendHistory, getHistory, savePendingMember, getPendingMember, markPendingMemberAsUsed, getConfigValue, setConfigValue, findMemberByPseudo };
