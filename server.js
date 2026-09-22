require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cron = require('node-cron');
const path = require('path');
const nodemailer = require('nodemailer');
const { ensureSheets, getMembers, saveMember, appendHistory, getHistory, getPendingMember, savePendingMember, markPendingMemberAsUsed, getConfigValue, setConfigValue, findMemberByPseudo } = require('./src/googleSheets');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'alliance-power-tracker-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rw.zeus.78@gmail.com';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 6 }
}));

function parseNumber(value, fallback = 0) {
  const parsed = Number(String(value || '').replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function totalPower(tank, avion, missile) {
  return parseNumber(tank) + parseNumber(avion) + parseNumber(missile);
}

function normalizePseudo(value) {
  return String(value || '').trim();
}

function isAuthenticated(req) {
  return !!req.session.authenticated;
}

function sendAdminMail(subject, text) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return Promise.resolve();
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: ADMIN_EMAIL,
    subject,
    text
  });
}

async function sendMemberCode(email, code) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return Promise.resolve();
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Code de validation pour l’Alliance Tracker',
    text: `Votre code de validation est : ${code}. Il est valable 15 minutes.`
  });
}

function generateWeeklyPassword() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALLIANCE-${randomPart}`;
}

async function rotateWeeklyPassword() {
  const password = generateWeeklyPassword();
  await setConfigValue('WEEKLY_PASSWORD', password);
  await sendAdminMail(
    'Nouveau mot de passe hebdomadaire',
    `Le nouveau mot de passe hebdomadaire est : ${password}\nIl est valable jusqu’au dimanche prochain à 4h.`
  );
  console.log('Password rotated:', password);
}

async function ensureSystemReady() {
  try {
    await ensureSheets();
    const password = await getConfigValue('WEEKLY_PASSWORD');
    if (!password) {
      await setConfigValue('WEEKLY_PASSWORD', generateWeeklyPassword());
    }
  } catch (error) {
    console.error('Could not initialize sheets:', error.message);
  }
}

app.use((req, res, next) => {
  const selected = ['/', '/login', '/register', '/verify', '/setup'];
  if (selected.includes(req.path)) {
    return next();
  }
  if (!isAuthenticated(req)) {
    return res.redirect('/login');
  }
  next();
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', async (req, res) => {
  const password = await getConfigValue('WEEKLY_PASSWORD');
  res.render('login', {
    error: '',
    weeklyPassword: password || 'Non défini',
    action: '/login'
  });
});

app.post('/login', async (req, res) => {
  const submittedPassword = String(req.body.password || '').trim();
  const weeklyPassword = await getConfigValue('WEEKLY_PASSWORD');

  if (!weeklyPassword || submittedPassword !== weeklyPassword) {
    return res.render('login', {
      error: 'Mot de passe incorrect.',
      weeklyPassword,
      action: '/login'
    });
  }

  req.session.authenticated = true;
  res.redirect('/dashboard');
});

app.get('/register', (req, res) => {
  res.render('register', { error: '' });
});

app.post('/register', async (req, res) => {
  const pseudo = normalizePseudo(req.body.pseudo);
  const email = String(req.body.email || '').trim();

  if (!pseudo || !email) {
    return res.render('register', { error: 'Pseudo et adresse e-mail sont requis.' });
  }

  const existingMember = await findMemberByPseudo(pseudo);
  if (existingMember) {
    return res.render('register', { error: 'Ce pseudo existe déjà.' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  await savePendingMember({ pseudo, email, code, expiresAt, createdAt, used: 'false' });
  await sendMemberCode(email, code);

  req.session.pendingMember = { pseudo, email, code };
  res.redirect('/verify');
});

app.get('/verify', (req, res) => {
  res.render('verify', {
    email: req.session.pendingMember?.email || '',
    error: ''
  });
});

app.post('/verify', async (req, res) => {
  const email = String(req.body.email || '').trim();
  const code = String(req.body.code || '').trim();

  const pending = await getPendingMember(email, code);
  if (!pending) {
    return res.render('verify', {
      email,
      error: 'Code invalide ou expiré.'
    });
  }

  req.session.pendingMember = { pseudo: pending.pseudo, email: pending.email };
  await markPendingMemberAsUsed(email, pending.pseudo);
  res.redirect('/setup');
});

app.get('/setup', (req, res) => {
  if (!req.session.pendingMember) {
    return res.redirect('/register');
  }

  res.render('setup', {
    pseudo: req.session.pendingMember.pseudo,
    email: req.session.pendingMember.email,
    error: ''
  });
});

app.post('/setup', async (req, res) => {
  const pseudo = normalizePseudo(req.session.pendingMember?.pseudo);
  const email = String(req.session.pendingMember?.email || '').trim();

  if (!pseudo || !email) {
    return res.redirect('/register');
  }

  const member = {
    pseudo,
    email,
    tank: parseNumber(req.body.tank),
    avion: parseNumber(req.body.avion),
    missile: parseNumber(req.body.missile),
    t11: req.body.t11 === 'on' ? 'Oui' : 'Non',
    total: 0
  };

  member.total = totalPower(member.tank, member.avion, member.missile);

  await saveMember(member);
  await appendHistory({
    date: new Date().toISOString(),
    pseudo,
    tank: member.tank,
    avion: member.avion,
    missile: member.missile,
    total: member.total,
    t11: member.t11
  });

  req.session.pendingMember = null;
  res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect('/login');
  }

  const members = await getMembers();
  const history = await getHistory();

  const sortedMembers = [...members].sort((a, b) => Number(b.total || 0) - Number(a.total || 0));

  res.render('dashboard', {
    members: sortedMembers,
    history,
    currentDate: new Date().toLocaleString('fr-FR')
  });
});

app.post('/save-player', async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect('/login');
  }

  const pseudo = normalizePseudo(req.body.pseudo);
  if (!pseudo) {
    return res.redirect('/dashboard');
  }

  const tank = parseNumber(req.body.tank);
  const avion = parseNumber(req.body.avion);
  const missile = parseNumber(req.body.missile);
  const total = totalPower(tank, avion, missile);
  const t11 = req.body.t11 === 'on' ? 'Oui' : 'Non';

  const existing = await findMemberByPseudo(pseudo);
  if (!existing) {
    return res.redirect('/dashboard');
  }

  await saveMember({
    pseudo,
    email: existing.email,
    tank,
    avion,
    missile,
    total,
    t11
  });

  await appendHistory({
    date: new Date().toISOString(),
    pseudo,
    tank,
    avion,
    missile,
    total,
    t11
  });

  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

cron.schedule('0 4 * * 0', () => {
  rotateWeeklyPassword().catch((error) => console.error('Error while rotating weekly password:', error.message));
}, { timezone: 'Europe/Paris' });

ensureSystemReady().then(() => {
  app.listen(PORT, () => {
    console.log(`Alliance tracker running on http://localhost:${PORT}`);
  });
});
