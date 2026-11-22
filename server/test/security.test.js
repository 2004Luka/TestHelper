import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Student from '../models/Student.js';
import { logoutStudent } from '../controllers/studentAuthController.js';
import MongoRateLimitStore from '../middleware/mongoRateLimitStore.js';
import { isRequestOriginAllowed, getLoginAccountRateLimitKey } from '../utils/requestSecurity.js';
import { studentRegisterSchema } from '../utils/authValidators.js';

const allowedOrigins = ['https://app.example.test'];

const makeMemoryCollection = () => {
  const documents = new Map();
  const copy = (document) => document && ({ ...document, resetAt: new Date(document.resetAt) });
  const matches = (document, filter) => {
    if (!document) return false;
    if (filter.resetAt?.$gt && !(document.resetAt > filter.resetAt.$gt)) return false;
    if (filter.resetAt?.$lte && !(document.resetAt <= filter.resetAt.$lte)) return false;
    if (filter.totalHits?.$gt && !(document.totalHits > filter.totalHits.$gt)) return false;
    return document._id === filter._id;
  };

  return {
    async findOneAndUpdate(filter, update) {
      const document = documents.get(filter._id);
      if (!matches(document, filter)) return { value: null };
      if (update.$inc) {
        for (const [field, amount] of Object.entries(update.$inc)) document[field] += amount;
      }
      if (update.$set) Object.assign(document, update.$set);
      return { value: copy(document) };
    },
    async insertOne(document) {
      if (documents.has(document._id)) {
        const error = new Error('Duplicate counter key');
        error.code = 11000;
        throw error;
      }
      documents.set(document._id, copy(document));
    },
    async findOne(filter) {
      return copy(documents.get(filter._id));
    },
    async updateOne(filter, update) {
      const document = documents.get(filter._id);
      if (!matches(document, filter)) return { modifiedCount: 0 };
      for (const [field, amount] of Object.entries(update.$inc || {})) document[field] += amount;
      return { modifiedCount: 1 };
    },
    async deleteOne(filter) {
      return { deletedCount: Number(documents.delete(filter._id)) };
    },
  };
};

test('cookie-authenticated mutations require an allowed Origin or Referer', () => {
  assert.equal(isRequestOriginAllowed({ method: 'POST', origin: allowedOrigins[0], hasCookieSession: true }, allowedOrigins), true);
  assert.equal(isRequestOriginAllowed({ method: 'PATCH', origin: 'https://attacker.example', hasCookieSession: true }, allowedOrigins), false);
  assert.equal(isRequestOriginAllowed({ method: 'POST', referer: 'https://app.example.test/settings/profile', hasCookieSession: true }, allowedOrigins), true);
  assert.equal(isRequestOriginAllowed({ method: 'DELETE', hasCookieSession: true }, allowedOrigins), false);
  assert.equal(isRequestOriginAllowed({ method: 'POST', hasCookieSession: false }, allowedOrigins), true);
  assert.equal(isRequestOriginAllowed({ method: 'GET', origin: 'https://attacker.example', hasCookieSession: true }, allowedOrigins), true);
});

test('login rate-limit keys separate roles and normalize account names', () => {
  assert.equal(getLoginAccountRateLimitKey({ body: { name: '  Luka  ' }, originalUrl: '/api/auth/login', ip: '127.0.0.1' }), 'account:teacher:luka');
  assert.equal(getLoginAccountRateLimitKey({ body: { username: 'LUKA' }, originalUrl: '/api/students/login', ip: '127.0.0.1' }), 'account:student:luka');
  assert.equal(getLoginAccountRateLimitKey({ body: {}, originalUrl: '/api/auth/login', ip: '127.0.0.1' }), 'ip:127.0.0.1');
});

test('student registration ignores class IDs while preserving code-based joins', () => {
  const parsed = studentRegisterSchema.parse({
    name: 'Luka Student',
    username: 'luka_student',
    password: 'secure-password-123',
    teacherId: null,
    classId: '507f1f77bcf86cd799439011',
    classCode: 'CLASS_12',
  });
  assert.equal(parsed.classCode, 'CLASS_12');
  assert.equal(Object.hasOwn(parsed, 'classId'), false);
});

test('Mongo rate-limit store shares counts, decrements successful requests, and resets keys', async () => {
  const collection = makeMemoryCollection();
  const store = new MongoRateLimitStore('account-login', { collection });
  store.init({ windowMs: 60_000 });

  const [first, second] = await Promise.all([
    store.increment('account:teacher:luka'),
    store.increment('account:teacher:luka'),
  ]);
  assert.deepEqual([first.totalHits, second.totalHits].sort(), [1, 2]);
  assert.equal((await store.get('account:teacher:luka')).totalHits, 2);

  await store.decrement('account:teacher:luka');
  assert.equal((await store.get('account:teacher:luka')).totalHits, 1);

  await store.resetKey('account:teacher:luka');
  assert.equal(await store.get('account:teacher:luka'), undefined);
});

test('Mongo rate-limit store handles concurrent first requests without losing hits', async () => {
  const collection = makeMemoryCollection();
  const store = new MongoRateLimitStore('api', { collection });
  const results = await Promise.all(Array.from({ length: 20 }, () => store.increment('client-ip')));

  assert.equal(results.length, 20);
  assert.equal((await store.get('client-ip')).totalHits, 20);
});

test('account rate limiter blocks repeated failures for one account but not another', async () => {
  const app = express();
  app.use(express.json());
  app.use(rateLimit({
    store: new MongoRateLimitStore('login-test', { collection: makeMemoryCollection() }),
    windowMs: 60_000,
    limit: 2,
    keyGenerator: getLoginAccountRateLimitKey,
    validate: { keyGeneratorIpFallback: false },
    standardHeaders: false,
    legacyHeaders: false,
    message: { success: false },
  }));
  app.post('/login', (req, res) => res.status(401).json({ success: false }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const attempt = (name) => fetch(`http://127.0.0.1:${port}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  try {
    assert.equal((await attempt('Luka')).status, 401);
    assert.equal((await attempt('Luka')).status, 401);
    assert.equal((await attempt('Luka')).status, 429);
    assert.equal((await attempt('Other')).status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('student logout revokes the current session and still clears unauthenticated cookies', async (t) => {
  const update = t.mock.method(Student, 'updateOne', async () => ({ modifiedCount: 1 }));
  const response = {
    clearCookie(name) {
      this.clearedCookie = name;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await logoutStudent({ student: { _id: 'student-id' } }, response, (error) => { throw error; });
  assert.deepEqual(update.mock.calls[0].arguments, [
    { _id: 'student-id' },
    { $inc: { sessionVersion: 1 } },
  ]);
  assert.equal(response.clearedCookie, 'studentToken');
  assert.equal(response.body.success, true);

  await logoutStudent({}, response, (error) => { throw error; });
  assert.equal(update.mock.callCount(), 1);
  assert.equal(response.clearedCookie, 'studentToken');
});
