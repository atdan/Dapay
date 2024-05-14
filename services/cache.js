const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const keys = require("../config");

const client = redis.createClient();

client.connect();

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on("error", (error) => {
  console.error(`Redis connection error: ${error}`);
});

client.hGet = util.promisify(client.hGet).bind(client);
client.get = util.promisify(client.get).bind(client);
client.set = util.promisify(client.set).bind(client);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = { time: 60 }) {
  this.useCache = true;
  this.time = options.time;
  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery()
  });

  const cacheValue = await client.hGet(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    console.log("Response from Redis");
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  const result = await exec.apply(this, arguments);
  console.log(this.time);
  client.hSet(this.hashKey, key, JSON.stringify(result));
  client.expire(this.hashKey, this.time);

  console.log("Response from MongoDB");
  return result;
};

function cacheHashData(hashKey, key, data, time = 60) {
  try {
    const cacheValue = JSON.stringify(data);

    client.hSet(hashKey, key, cacheValue).then((result) => {
      client.expire(hashKey, time);
      console.log(`Data cached successfully: ${result}`);
    }).catch(err => {
      console.log(`cacheHashData: ${err}`);
      throw err;
    });
  
  }catch(err) {
    console.log(`cacheHashData: ${err}`);
    throw err;
  }
  
}

function cacheSingleData(key, value, time = 60) {
    client.set(key, value).then((result) => {
      client.expire(key, time);
      console.log(`Data cached successfully: ${result}`);
    }).catch(err => {
      console.log(`Error caching data: ${err}`);
      throw err;
    });
}

function getCacheData(key) {
    client.get(key).then((doc) => {
      if (doc) {
        console.log(`Cache value: ${doc}`)
        return JSON.parse(doc);
      }else {
        console.log(`No doc found`)
        return null;
      }
    }).catch(err => {
      console.log(`Error Getting cache: ${err}`);
      throw err;
    });
}



function retrieveCachedData(hashKey, key) {
  try {
    console.log("Redis clientt: " + JSON.stringify(client))

    let cacheValue;
    client.hGet(hashKey, key).then((doc) => {
      console.log(`Cache response: ${doc}`)

      if (doc) {
        console.log(`Cache value: ${doc}`)
        return JSON.parse(doc);
      }
      return null;
    }).catch(err => {
      console.log("Error retrieving cached data: " + err)
      return null;
    })
    
  } catch (error) {
    console.log("Error retrieving cached data: " + error)
    return null;
  }

}

const lockTransaction = (req, res, next) => {
  try {
    let body = JSON.stringify(req.body);

    const key = req.body.accountNumber + "-" + req.body.amount
    console.log(`Lock transaction: Key - ${key} Body- ${body}`)

    const transactionLocked = getCacheData(key);

    if (transactionLocked) {
      console.log(`Duplicate Transaction ${transactionLocked}`)
      throw new Error("Duplicate Transaction Detected")
    }

    console.log(`No doc found. Locking Txn`)

    const lockTransaction = cacheSingleData(key, body, 120)    
    console.log(`Txn Locked: ${lockTransaction}`)

    next()
  }catch(err) {
    console.log(`Error Locking txn`)

    throw new Error("Error Locking Transaction")
  }
}

module.exports = {
  clearKey(hashKey) {
    client.del(JSON.stringify(hashKey));
  },

  cacheData: cacheHashData,
  retrieveCachedData,
  lockTransaction
};