const ResourceGroup = require('resource-pool').ResourceGroup

/**
 * List of limits for each instance
 * of the rate limiter.
 * @type {WeakMap}
 * @private
 * @ignore
 */
const pools = new WeakMap()

/**
 * List of the calls queued for later execution.
 * @type {WeakMap}
 * @private
 * @ignore
 */
const queues = new WeakMap()

/**
 * Checks if a given limit is reached.
 * @param  {ResourcePool}  pool reference
 * @return {Boolean}
 * @private
 * @ignore
 */
function isExhausted(pool) {
  return pools.get(pool).exhausted
}

/**
 * Executes a given request.
 * @param  {function} target        The original function
 * @param  {array} argumentsList The original set of arguments
 * @private
 * @ignore
 */
function execute(target, argumentsList) {
  target(...argumentsList)
  pools.get(this).consume()
}

/**
 * Execute requests while limit is not reached
 * and the request queue is not empty.
 * @private
 * @ignore
 */
function executeFromQueue() {
  const queue = queues.get(this)
  while (!isExhausted(this) && queue.length) {
    const { target, argumentsList } = queue.shift()
    execute.call(this, target, argumentsList)
  }
  queues.set(this, queue)
}

/**
 * Called new cycle begins and limit is reset.
 * @private
 * @ignore
 */
function handleReplenishedResources() {
  executeFromQueue.call(this)
}

/**
 * Standard proxy trap for function call.
 * @param  {function} target        The original function
 * @param  {object} thisArgument
 * @param  {array} argumentsList
 * @private
 * @ignore
 */
function subjectHandler(target, thisArgument, argumentsList) {
  if (isExhausted(this)) {
    const queue = queues.get(this)
    queue.push({ target, argumentsList })
    queues.set(this, queue)
  } else {
    execute.call(this, target, argumentsList)
  }
}

/**
 * Generic rate limiter.
 * Useful for API calls, web crawling,
 * or other tasks that need to be throttled.
 */
class RateLimiter {
  constructor() {
    const resourcePool = new ResourceGroup(handleReplenishedResources.bind(this))
    pools.set(this, resourcePool)
    queues.set(this, [])
  }

  /**
   * Add new restraint to the rate limit.
   * @param {[type]} poolSize calls per an interval.
   * @param {[type]} interval interval in milliseconds.
   * @returns {RateLimiter} instance of itself for chaining
   */
  add(poolSize, interval) {
    const pool = pools.get(this)
    pool.add(poolSize, interval)
    return this
  }

  /**
   * Binds function call with a rate limit.
   * @param {[type]} subjectFunction The function
   * you are going apply limit to.
   * @returns {Proxy} The replacement function
   * you are going to use from now on instead of
   * the original one.
   */
  setProxy(subjectFunction) {
    if (!(typeof subjectFunction === 'function')) {
      throw new Error('Invalid subjectFunction value. Must be function.')
    }
    return new Proxy(subjectFunction, {
      apply: subjectHandler.bind(this),
    })
  }
}

module.exports = RateLimiter
