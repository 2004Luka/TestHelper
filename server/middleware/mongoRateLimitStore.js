import { createHash } from 'node:crypto';
import mongoose from 'mongoose';

const collectionName = 'rateLimitCounters';
let indexPromise;
let expiryIndexUnavailable = false;

const ensureExpiryIndex = async () => {
  if (expiryIndexUnavailable) return;
  if (!indexPromise) {
    indexPromise = mongoose.connection
      .collection(collectionName)
      .createIndex({ resetAt: 1 }, { expireAfterSeconds: 0, name: 'rate_limit_expiry' })
      .catch((error) => {
        expiryIndexUnavailable = true;
        console.error(`Could not create the rate limit TTL index: ${error.message}`);
        return null;
      });
  }
  await indexPromise;
};

const getUpdatedDocument = (result) => (
  result && Object.prototype.hasOwnProperty.call(result, 'value') ? result.value : result
);

export default class MongoRateLimitStore {
  constructor(prefix, { collection = null } = {}) {
    this.prefix = prefix;
    this.windowMs = 60_000;
    this.localKeys = false;
    this.collectionOverride = collection;
  }

  getCollection() {
    return this.collectionOverride || mongoose.connection.collection(collectionName);
  }

  init(options) {
    if (Number.isFinite(options?.windowMs) && options.windowMs > 0) {
      this.windowMs = options.windowMs;
    }
  }

  getKey(key) {
    return `${this.prefix}:${createHash('sha256').update(key).digest('hex')}`;
  }

  async increment(key) {
    if (!this.collectionOverride) await ensureExpiryIndex();
    const collection = this.getCollection();
    const storageKey = this.getKey(key);
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.windowMs);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const active = getUpdatedDocument(await collection.findOneAndUpdate(
        { _id: storageKey, resetAt: { $gt: now } },
        { $inc: { totalHits: 1 } },
        { returnDocument: 'after' }
      ));
      if (active) return { totalHits: active.totalHits, resetTime: active.resetAt };

      const expired = getUpdatedDocument(await collection.findOneAndUpdate(
        { _id: storageKey, resetAt: { $lte: now } },
        { $set: { totalHits: 1, resetAt: resetTime } },
        { returnDocument: 'after' }
      ));
      if (expired) return { totalHits: expired.totalHits, resetTime: expired.resetAt };

      try {
        await collection.insertOne({ _id: storageKey, totalHits: 1, resetAt: resetTime });
        return { totalHits: 1, resetTime };
      } catch (error) {
        if (error?.code !== 11000 || attempt === 2) throw error;
      }
    }

    throw new Error('Unable to update the shared rate limit counter');
  }

  async get(key) {
    const document = await this.getCollection().findOne({ _id: this.getKey(key) });
    if (!document || document.resetAt <= new Date()) return undefined;
    return { totalHits: document.totalHits, resetTime: document.resetAt };
  }

  async decrement(key) {
    await this.getCollection().updateOne(
      { _id: this.getKey(key), resetAt: { $gt: new Date() }, totalHits: { $gt: 0 } },
      { $inc: { totalHits: -1 } }
    );
  }

  async resetKey(key) {
    await this.getCollection().deleteOne({ _id: this.getKey(key) });
  }
}
