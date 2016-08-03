const RateLimiter = require('../lib')
const chai = require('chai')
const expect = chai.expect

function subjTest1(callback) {
  callback(1)
}

function subjTest2(callback) {
  callback(2)
}

describe('RateLimiter', function() {
  let limit

  beforeEach(function() {
    limit = new RateLimiter()
  })

  describe('#setProxy()', function() {
    it('Should pass when param is function', function(done) {
      limit.setProxy(function() {})
      done()
    })

    it('Should throw error when param is not function', function() {
      expect(function() {
        return limit.setProxy(1)
      }).to.throw(Error)

      expect(function() {
        return limit.setProxy('function')
      }).to.throw(Error)

      expect(function() {
        return limit.setProxy({})
      }).to.throw(Error)
    })
  })

  describe('subjectFunction', function() {
    it('Should throw error when #add is not called', function() {
      const proxyTest = limit.setProxy(subjTest1)
      expect(function() {
        return proxyTest()
      }).to.throw(Error)
    })


    describe('single', function() {
      it('Should return same result as the original', function() {
        limit.add(1, 5)
        const proxyTest = limit.setProxy(subjTest1)
        proxyTest(function(proxyValue) {
          subjTest1(function(value) {
            expect(proxyValue).to.equal(value)
          })
        })
      })

      it('Should return same result as original when putted in queue', function(done) {
        limit.add(1, 5)
        const proxyTest = limit.setProxy(subjTest1)
        proxyTest(function() {})

        proxyTest(function(proxyValue) {
          subjTest1(function(value) {
            expect(proxyValue).to.equal(value)
            done()
          })
        })
      })
    })

    describe('multiple', function() {
      it('Should return same result as the original function', function() {
        limit.add(2, 5)
        const proxyTest1 = limit.setProxy(subjTest1)
        const proxyTest2 = limit.setProxy(subjTest2)

        proxyTest1(function(proxyValue1) {
          subjTest1(function(value1) {
            expect(proxyValue1).to.equal(value1)
          })
        })

        proxyTest2(function(proxyValue2) {
          subjTest2(function(value2) {
            expect(proxyValue2).to.equal(value2)
          })
        })
      })

      it('Should return same result as original when putted in queue', function(done) {
        // TODO refactoring
        limit.add(2, 5)

        const proxyTest1 = limit.setProxy(subjTest1)
        const proxyTest2 = limit.setProxy(subjTest2)

        proxyTest1(function() {})
        proxyTest2(function() {})

        let test1 = false
        let test2 = false
        proxyTest1(function(proxyValue1) {
          subjTest1(function(value1) {
            expect(proxyValue1).to.equal(value1)
            test1 = true
            if (test1 && test2) done()
          })
        })

        proxyTest2(function(proxyValue2) {
          subjTest2(function(value2) {
            expect(proxyValue2).to.equal(value2)
            test2 = true
            if (test1 && test2) done()
          })
        })
      })
    })
  })
})
