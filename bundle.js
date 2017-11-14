(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MigrationTool = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var convertFunction = require('mapbox-gl/src/style-spec/function/convert');
var ref = require('mapbox-gl/src/style-spec/expression');
var createExpression = ref.createExpression;
var ref$1 = require('mapbox-gl/src/style-spec/function');
var isFunction = ref$1.isFunction;
var validate = require('mapbox-gl/src/style-spec/style-spec').validate;
var spec = require('mapbox-gl/src/style-spec/reference/v8.json');

var stringify = require('json-stringify-pretty-compact');
var diff = require('diff');

var initialStyle = {
    version: 8,
    sources: {
        mapbox: {
            type: 'vector',
            url: 'mapbox://mapbox-streets-v7'
        }
    },
    layers: [{
        id: 'places',
        source: 'mapbox',
        'source-layer': 'poi_label',
        type: 'circle',
        paint: {
            'circle-radius': {
                property: 'scalerank',
                stops: [
                    [{zoom: 0, value: 0}, 1],
                    [{zoom: 0, value: 5}, 3],
                    [{zoom: 14, value: 0}, 5],
                    [{zoom: 14, value: 5}, 10]
                ]
            }
        }
    }]
};

var MigrationTool = (function (superclass) {
    function MigrationTool(props) {
        this.state = {
            inputStyle: stringify(initialStyle, null, 2)
        }

        this.onEdit = this.onEdit.bind(this);
    }

    if ( superclass ) MigrationTool.__proto__ = superclass;
    MigrationTool.prototype = Object.create( superclass && superclass.prototype );
    MigrationTool.prototype.constructor = MigrationTool;

    MigrationTool.prototype.render = function render () {
        var diffOutput;
        var error;

        var validationErrors = validate(this.state.inputStyle);
        if (validationErrors.length === 0) {
            var parsed = JSON.parse(this.state.inputStyle)
            var migrated = migrate(parsed);
            var result = diff.diffLines(stringify(parsed), stringify(migrated));
            diffOutput = result.map(function (part, index) {
                var klass = '';
                if (part.added) { klass ='bg-green-faint'; }
                if (part.removed) { klass='bg-red-faint'; }
                return React.createElement( 'div', { key: index, className: klass }, part.value)
            });
            console.log(result);
        } else {
            error = validationErrors.map(function (error, index) { return React.createElement( 'div', { className: 'color-red-dark', key: index }, error.line, ": ", error.message); });
        }

        return (
        React.createElement( 'div', { className: 'w-full grid grid--gut12 flex-parent--stretch-cross' },
            React.createElement( 'div', { className: 'col col--12 col--auto-ml' },
                React.createElement( 'div', { className: 'h-full px12' },
                    React.createElement( 'h3', { className: "txt-h3" }, "Original"),
                    React.createElement( 'div', { className: 'w-full scroll-auto' },
                        React.createElement( 'textarea', { cols: 0, rows: 25, className: 'textarea', value: this.state.inputStyle, onChange: this.onEdit })
                    )
                )
            ),
            React.createElement( 'div', { className: 'col col--12 col--auto-ml' },
                React.createElement( 'div', { className: 'h-full' },
                    React.createElement( 'h3', { className: "txt-h3" }, "Converted to expressions"),
                    error || React.createElement( 'div', { className: "pre" }, diffOutput)
                )
            )
        ))
    };

    MigrationTool.prototype.onEdit = function onEdit (event) {
        var newValue = event.target.value;
        this.setState({inputStyle: newValue});
    };

    return MigrationTool;
}(React.Component));

function migrate(style) {
    var migrated = clone(style);
    migrated.layers = style.layers.map(function (layer) {
        var migratedLayer = clone(layer);
        if (layer.paint) {
            migratedLayer.paint = migrateProperties(layer, 'paint');
        }
        if (layer.layout) {
            migratedLayer.layout = migrateProperties(layer, 'layout');
        }
        return migratedLayer;
    })
    return migrated;
}

function migrateProperties(layer, type) {
    var properties = clone(layer[type]);
    for (var key in properties) {
        if (isFunction(properties[key])) {
            var propertySpec = spec[(type + "_" + (layer.type))][key];
            properties[key] = convertFunction(properties[key], propertySpec)
        }
    }
    return properties;
}

function clone(src) {
    return Object.assign({}, src)
}

module.exports = MigrationTool;

},{"diff":8,"json-stringify-pretty-compact":10,"mapbox-gl/src/style-spec/expression":40,"mapbox-gl/src/style-spec/function":52,"mapbox-gl/src/style-spec/function/convert":51,"mapbox-gl/src/style-spec/reference/v8.json":56,"mapbox-gl/src/style-spec/style-spec":57}],2:[function(require,module,exports){
/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Ported from Webkit
 * http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/UnitBezier.h
 */

module.exports = UnitBezier;

function UnitBezier(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    this.cx = 3.0 * p1x;
    this.bx = 3.0 * (p2x - p1x) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;

    this.cy = 3.0 * p1y;
    this.by = 3.0 * (p2y - p1y) - this.cy;
    this.ay = 1.0 - this.cy - this.by;

    this.p1x = p1x;
    this.p1y = p2y;
    this.p2x = p2x;
    this.p2y = p2y;
}

UnitBezier.prototype.sampleCurveX = function(t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((this.ax * t + this.bx) * t + this.cx) * t;
};

UnitBezier.prototype.sampleCurveY = function(t) {
    return ((this.ay * t + this.by) * t + this.cy) * t;
};

UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
};

UnitBezier.prototype.solveCurveX = function(x, epsilon) {
    if (typeof epsilon === 'undefined') epsilon = 1e-6;

    var t0, t1, t2, x2, i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {

        x2 = this.sampleCurveX(t2) - x;
        if (Math.abs(x2) < epsilon) return t2;

        var d2 = this.sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;

        t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0) return t0;
    if (t2 > t1) return t1;

    while (t0 < t1) {

        x2 = this.sampleCurveX(t2);
        if (Math.abs(x2 - x) < epsilon) return t2;

        if (x > x2) {
            t0 = t2;
        } else {
            t1 = t2;
        }

        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
};

UnitBezier.prototype.solve = function(x, epsilon) {
    return this.sampleCurveY(this.solveCurveX(x, epsilon));
};

},{}],3:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/":99}],4:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":4,"ieee754":9}],7:[function(require,module,exports){
// (c) Dean McNamee <dean@gmail.com>, 2012.
//
// https://github.com/deanm/css-color-parser-js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// http://www.w3.org/TR/css3-color/
var kCSSColorTable = {
  "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
  "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
  "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
  "beige": [245,245,220,1], "bisque": [255,228,196,1],
  "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
  "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
  "brown": [165,42,42,1], "burlywood": [222,184,135,1],
  "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
  "chocolate": [210,105,30,1], "coral": [255,127,80,1],
  "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
  "crimson": [220,20,60,1], "cyan": [0,255,255,1],
  "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
  "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
  "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
  "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
  "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
  "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
  "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
  "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
  "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
  "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
  "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
  "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
  "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
  "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
  "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
  "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
  "gray": [128,128,128,1], "green": [0,128,0,1],
  "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
  "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
  "indianred": [205,92,92,1], "indigo": [75,0,130,1],
  "ivory": [255,255,240,1], "khaki": [240,230,140,1],
  "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
  "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
  "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
  "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
  "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
  "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
  "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
  "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
  "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
  "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
  "limegreen": [50,205,50,1], "linen": [250,240,230,1],
  "magenta": [255,0,255,1], "maroon": [128,0,0,1],
  "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
  "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
  "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
  "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
  "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
  "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
  "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
  "navy": [0,0,128,1], "oldlace": [253,245,230,1],
  "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
  "orange": [255,165,0,1], "orangered": [255,69,0,1],
  "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
  "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
  "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
  "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
  "pink": [255,192,203,1], "plum": [221,160,221,1],
  "powderblue": [176,224,230,1], "purple": [128,0,128,1],
  "rebeccapurple": [102,51,153,1],
  "red": [255,0,0,1], "rosybrown": [188,143,143,1],
  "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
  "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
  "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
  "sienna": [160,82,45,1], "silver": [192,192,192,1],
  "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
  "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
  "snow": [255,250,250,1], "springgreen": [0,255,127,1],
  "steelblue": [70,130,180,1], "tan": [210,180,140,1],
  "teal": [0,128,128,1], "thistle": [216,191,216,1],
  "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
  "violet": [238,130,238,1], "wheat": [245,222,179,1],
  "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
  "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]}

function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
  i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
  return i < 0 ? 0 : i > 255 ? 255 : i;
}

function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

function parse_css_int(str) {  // int or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_byte(parseFloat(str) / 100 * 255);
  return clamp_css_byte(parseInt(str));
}

function parse_css_float(str) {  // float or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_float(parseFloat(str) / 100);
  return clamp_css_float(parseFloat(str));
}

function css_hue_to_rgb(m1, m2, h) {
  if (h < 0) h += 1;
  else if (h > 1) h -= 1;

  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
  if (h * 2 < 1) return m2;
  if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
  return m1;
}

function parseCSSColor(css_str) {
  // Remove all whitespace, not compliant, but should just be more accepting.
  var str = css_str.replace(/ /g, '').toLowerCase();

  // Color keywords (and transparent) lookup.
  if (str in kCSSColorTable) return kCSSColorTable[str].slice();  // dup.

  // #abc and #abc123 syntax.
  if (str[0] === '#') {
    if (str.length === 4) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
      return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
              (iv & 0xf0) | ((iv & 0xf0) >> 4),
              (iv & 0xf) | ((iv & 0xf) << 4),
              1];
    } else if (str.length === 7) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
      return [(iv & 0xff0000) >> 16,
              (iv & 0xff00) >> 8,
              iv & 0xff,
              1];
    }

    return null;
  }

  var op = str.indexOf('('), ep = str.indexOf(')');
  if (op !== -1 && ep + 1 === str.length) {
    var fname = str.substr(0, op);
    var params = str.substr(op+1, ep-(op+1)).split(',');
    var alpha = 1;  // To allow case fallthrough.
    switch (fname) {
      case 'rgba':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'rgb':
        if (params.length !== 3) return null;
        return [parse_css_int(params[0]),
                parse_css_int(params[1]),
                parse_css_int(params[2]),
                alpha];
      case 'hsla':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'hsl':
        if (params.length !== 3) return null;
        var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
        // NOTE(deanm): According to the CSS spec s/l should only be
        // percentages, but we don't bother and let float or percentage.
        var s = parse_css_float(params[1]);
        var l = parse_css_float(params[2]);
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;
        return [clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
                alpha];
      default:
        return null;
    }
  }

  return null;
}

try { exports.parseCSSColor = parseCSSColor } catch(e) { }

},{}],8:[function(require,module,exports){
/*!

 diff v3.4.0

Software License Agreement (BSD License)

Copyright (c) 2009-2015, Kevin Decker <kpdecker@gmail.com>

All rights reserved.

Redistribution and use of this software in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above
  copyright notice, this list of conditions and the
  following disclaimer.

* Redistributions in binary form must reproduce the above
  copyright notice, this list of conditions and the
  following disclaimer in the documentation and/or other
  materials provided with the distribution.

* Neither the name of Kevin Decker nor the names of its
  contributors may be used to endorse or promote products
  derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
@license
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["JsDiff"] = factory();
	else
		root["JsDiff"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.canonicalize = exports.convertChangesToXML = exports.convertChangesToDMP = exports.merge = exports.parsePatch = exports.applyPatches = exports.applyPatch = exports.createPatch = exports.createTwoFilesPatch = exports.structuredPatch = exports.diffArrays = exports.diffJson = exports.diffCss = exports.diffSentences = exports.diffTrimmedLines = exports.diffLines = exports.diffWordsWithSpace = exports.diffWords = exports.diffChars = exports.Diff = undefined;

	/*istanbul ignore end*/var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	/*istanbul ignore end*/var /*istanbul ignore start*/_character = __webpack_require__(2) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_word = __webpack_require__(3) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_line = __webpack_require__(5) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_sentence = __webpack_require__(6) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_css = __webpack_require__(7) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_json = __webpack_require__(8) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_array = __webpack_require__(9) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_apply = __webpack_require__(10) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_parse = __webpack_require__(11) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_merge = __webpack_require__(13) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_create = __webpack_require__(14) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_dmp = __webpack_require__(16) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_xml = __webpack_require__(17) /*istanbul ignore end*/;

	/*istanbul ignore start*/function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/* See LICENSE file for terms of use */

	/*
	 * Text diff implementation.
	 *
	 * This library supports the following APIS:
	 * JsDiff.diffChars: Character by character diff
	 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
	 * JsDiff.diffLines: Line based diff
	 *
	 * JsDiff.diffCss: Diff targeted at CSS content
	 *
	 * These methods are based on the implementation proposed in
	 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
	 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
	 */
	exports. /*istanbul ignore end*/Diff = _base2['default'];
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffChars = _character.diffChars;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWords = _word.diffWords;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = _word.diffWordsWithSpace;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffLines = _line.diffLines;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = _line.diffTrimmedLines;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffSentences = _sentence.diffSentences;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffCss = _css.diffCss;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffJson = _json.diffJson;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffArrays = _array.diffArrays;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/structuredPatch = _create.structuredPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = _create.createTwoFilesPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = _create.createPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatch = _apply.applyPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = _apply.applyPatches;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/parsePatch = _parse.parsePatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/merge = _merge.merge;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToDMP = _dmp.convertChangesToDMP;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToXML = _xml.convertChangesToXML;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = _json.canonicalize;



/***/ }),
/* 1 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports['default'] = /*istanbul ignore end*/Diff;
	function Diff() {}

	Diff.prototype = {
	  /*istanbul ignore start*/ /*istanbul ignore end*/diff: function diff(oldString, newString) {
	    /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	    var callback = options.callback;
	    if (typeof options === 'function') {
	      callback = options;
	      options = {};
	    }
	    this.options = options;

	    var self = this;

	    function done(value) {
	      if (callback) {
	        setTimeout(function () {
	          callback(undefined, value);
	        }, 0);
	        return true;
	      } else {
	        return value;
	      }
	    }

	    // Allow subclasses to massage the input prior to running
	    oldString = this.castInput(oldString);
	    newString = this.castInput(newString);

	    oldString = this.removeEmpty(this.tokenize(oldString));
	    newString = this.removeEmpty(this.tokenize(newString));

	    var newLen = newString.length,
	        oldLen = oldString.length;
	    var editLength = 1;
	    var maxEditLength = newLen + oldLen;
	    var bestPath = [{ newPos: -1, components: [] }];

	    // Seed editLength = 0, i.e. the content starts with the same values
	    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
	    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
	      // Identity per the equality and tokenizer
	      return done([{ value: this.join(newString), count: newString.length }]);
	    }

	    // Main worker method. checks all permutations of a given edit length for acceptance.
	    function execEditLength() {
	      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
	        var basePath = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
	        var addPath = bestPath[diagonalPath - 1],
	            removePath = bestPath[diagonalPath + 1],
	            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
	        if (addPath) {
	          // No one else is going to attempt to use this value, clear it
	          bestPath[diagonalPath - 1] = undefined;
	        }

	        var canAdd = addPath && addPath.newPos + 1 < newLen,
	            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
	        if (!canAdd && !canRemove) {
	          // If this path is a terminal then prune
	          bestPath[diagonalPath] = undefined;
	          continue;
	        }

	        // Select the diagonal that we want to branch from. We select the prior
	        // path whose position in the new string is the farthest from the origin
	        // and does not pass the bounds of the diff graph
	        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
	          basePath = clonePath(removePath);
	          self.pushComponent(basePath.components, undefined, true);
	        } else {
	          basePath = addPath; // No need to clone, we've pulled it from the list
	          basePath.newPos++;
	          self.pushComponent(basePath.components, true, undefined);
	        }

	        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);

	        // If we have hit the end of both strings, then we are done
	        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
	          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
	        } else {
	          // Otherwise track this path as a potential candidate and continue.
	          bestPath[diagonalPath] = basePath;
	        }
	      }

	      editLength++;
	    }

	    // Performs the length of edit iteration. Is a bit fugly as this has to support the
	    // sync and async mode which is never fun. Loops over execEditLength until a value
	    // is produced.
	    if (callback) {
	      (function exec() {
	        setTimeout(function () {
	          // This should not happen, but we want to be safe.
	          /* istanbul ignore next */
	          if (editLength > maxEditLength) {
	            return callback();
	          }

	          if (!execEditLength()) {
	            exec();
	          }
	        }, 0);
	      })();
	    } else {
	      while (editLength <= maxEditLength) {
	        var ret = execEditLength();
	        if (ret) {
	          return ret;
	        }
	      }
	    }
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/pushComponent: function pushComponent(components, added, removed) {
	    var last = components[components.length - 1];
	    if (last && last.added === added && last.removed === removed) {
	      // We need to clone here as the component clone operation is just
	      // as shallow array clone
	      components[components.length - 1] = { count: last.count + 1, added: added, removed: removed };
	    } else {
	      components.push({ count: 1, added: added, removed: removed });
	    }
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
	    var newLen = newString.length,
	        oldLen = oldString.length,
	        newPos = basePath.newPos,
	        oldPos = newPos - diagonalPath,
	        commonCount = 0;
	    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
	      newPos++;
	      oldPos++;
	      commonCount++;
	    }

	    if (commonCount) {
	      basePath.components.push({ count: commonCount });
	    }

	    basePath.newPos = newPos;
	    return oldPos;
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/equals: function equals(left, right) {
	    if (this.options.comparator) {
	      return this.options.comparator(left, right);
	    } else {
	      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
	    }
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/removeEmpty: function removeEmpty(array) {
	    var ret = [];
	    for (var i = 0; i < array.length; i++) {
	      if (array[i]) {
	        ret.push(array[i]);
	      }
	    }
	    return ret;
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/castInput: function castInput(value) {
	    return value;
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/tokenize: function tokenize(value) {
	    return value.split('');
	  },
	  /*istanbul ignore start*/ /*istanbul ignore end*/join: function join(chars) {
	    return chars.join('');
	  }
	};

	function buildValues(diff, components, newString, oldString, useLongestToken) {
	  var componentPos = 0,
	      componentLen = components.length,
	      newPos = 0,
	      oldPos = 0;

	  for (; componentPos < componentLen; componentPos++) {
	    var component = components[componentPos];
	    if (!component.removed) {
	      if (!component.added && useLongestToken) {
	        var value = newString.slice(newPos, newPos + component.count);
	        value = value.map(function (value, i) {
	          var oldValue = oldString[oldPos + i];
	          return oldValue.length > value.length ? oldValue : value;
	        });

	        component.value = diff.join(value);
	      } else {
	        component.value = diff.join(newString.slice(newPos, newPos + component.count));
	      }
	      newPos += component.count;

	      // Common case
	      if (!component.added) {
	        oldPos += component.count;
	      }
	    } else {
	      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
	      oldPos += component.count;

	      // Reverse add and remove so removes are output first to match common convention
	      // The diffing algorithm is tied to add then remove output and this is the simplest
	      // route to get the desired output with minimal overhead.
	      if (componentPos && components[componentPos - 1].added) {
	        var tmp = components[componentPos - 1];
	        components[componentPos - 1] = components[componentPos];
	        components[componentPos] = tmp;
	      }
	    }
	  }

	  // Special case handle for when one terminal is ignored (i.e. whitespace).
	  // For this case we merge the terminal into the prior string and drop the change.
	  // This is only available for string mode.
	  var lastComponent = components[componentLen - 1];
	  if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
	    components[componentLen - 2].value += lastComponent.value;
	    components.pop();
	  }

	  return components;
	}

	function clonePath(path) {
	  return { newPos: path.newPos, components: path.components.slice(0) };
	}



/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.characterDiff = undefined;
	exports. /*istanbul ignore end*/diffChars = diffChars;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/var characterDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/characterDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	function diffChars(oldStr, newStr, options) {
	  return characterDiff.diff(oldStr, newStr, options);
	}



/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.wordDiff = undefined;
	exports. /*istanbul ignore end*/diffWords = diffWords;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = diffWordsWithSpace;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	/*istanbul ignore end*/var /*istanbul ignore start*/_params = __webpack_require__(4) /*istanbul ignore end*/;

	/*istanbul ignore start*/function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/ // Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
	//
	// Ranges and exceptions:
	// Latin-1 Supplement, 0080–00FF
	//  - U+00D7  × Multiplication sign
	//  - U+00F7  ÷ Division sign
	// Latin Extended-A, 0100–017F
	// Latin Extended-B, 0180–024F
	// IPA Extensions, 0250–02AF
	// Spacing Modifier Letters, 02B0–02FF
	//  - U+02C7  ˇ &#711;  Caron
	//  - U+02D8  ˘ &#728;  Breve
	//  - U+02D9  ˙ &#729;  Dot Above
	//  - U+02DA  ˚ &#730;  Ring Above
	//  - U+02DB  ˛ &#731;  Ogonek
	//  - U+02DC  ˜ &#732;  Small Tilde
	//  - U+02DD  ˝ &#733;  Double Acute Accent
	// Latin Extended Additional, 1E00–1EFF
	var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;

	var reWhitespace = /\S/;

	var wordDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/wordDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	wordDiff.equals = function (left, right) {
	  if (this.options.ignoreCase) {
	    left = left.toLowerCase();
	    right = right.toLowerCase();
	  }
	  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
	};
	wordDiff.tokenize = function (value) {
	  var tokens = value.split(/(\s+|\b)/);

	  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
	  for (var i = 0; i < tokens.length - 1; i++) {
	    // If we have an empty string in the next field and we have only word chars before and after, merge
	    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
	      tokens[i] += tokens[i + 2];
	      tokens.splice(i + 1, 2);
	      i--;
	    }
	  }

	  return tokens;
	};

	function diffWords(oldStr, newStr, options) {
	  options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(options, { ignoreWhitespace: true });
	  return wordDiff.diff(oldStr, newStr, options);
	}

	function diffWordsWithSpace(oldStr, newStr, options) {
	  return wordDiff.diff(oldStr, newStr, options);
	}



/***/ }),
/* 4 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports. /*istanbul ignore end*/generateOptions = generateOptions;
	function generateOptions(options, defaults) {
	  if (typeof options === 'function') {
	    defaults.callback = options;
	  } else if (options) {
	    for (var name in options) {
	      /* istanbul ignore else */
	      if (options.hasOwnProperty(name)) {
	        defaults[name] = options[name];
	      }
	    }
	  }
	  return defaults;
	}



/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.lineDiff = undefined;
	exports. /*istanbul ignore end*/diffLines = diffLines;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = diffTrimmedLines;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	/*istanbul ignore end*/var /*istanbul ignore start*/_params = __webpack_require__(4) /*istanbul ignore end*/;

	/*istanbul ignore start*/function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/var lineDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/lineDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	lineDiff.tokenize = function (value) {
	  var retLines = [],
	      linesAndNewlines = value.split(/(\n|\r\n)/);

	  // Ignore the final empty token that occurs if the string ends with a new line
	  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
	    linesAndNewlines.pop();
	  }

	  // Merge the content and line separators into single tokens
	  for (var i = 0; i < linesAndNewlines.length; i++) {
	    var line = linesAndNewlines[i];

	    if (i % 2 && !this.options.newlineIsToken) {
	      retLines[retLines.length - 1] += line;
	    } else {
	      if (this.options.ignoreWhitespace) {
	        line = line.trim();
	      }
	      retLines.push(line);
	    }
	  }

	  return retLines;
	};

	function diffLines(oldStr, newStr, callback) {
	  return lineDiff.diff(oldStr, newStr, callback);
	}
	function diffTrimmedLines(oldStr, newStr, callback) {
	  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
	  return lineDiff.diff(oldStr, newStr, options);
	}



/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.sentenceDiff = undefined;
	exports. /*istanbul ignore end*/diffSentences = diffSentences;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/var sentenceDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/sentenceDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	sentenceDiff.tokenize = function (value) {
	  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
	};

	function diffSentences(oldStr, newStr, callback) {
	  return sentenceDiff.diff(oldStr, newStr, callback);
	}



/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.cssDiff = undefined;
	exports. /*istanbul ignore end*/diffCss = diffCss;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/var cssDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/cssDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	cssDiff.tokenize = function (value) {
	  return value.split(/([{}:;,]|\s+)/);
	};

	function diffCss(oldStr, newStr, callback) {
	  return cssDiff.diff(oldStr, newStr, callback);
	}



/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.jsonDiff = undefined;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	exports. /*istanbul ignore end*/diffJson = diffJson;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = canonicalize;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	/*istanbul ignore end*/var /*istanbul ignore start*/_line = __webpack_require__(5) /*istanbul ignore end*/;

	/*istanbul ignore start*/function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/var objectPrototypeToString = Object.prototype.toString;

	var jsonDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/jsonDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	// Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
	// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
	jsonDiff.useLongestToken = true;

	jsonDiff.tokenize = /*istanbul ignore start*/_line.lineDiff /*istanbul ignore end*/.tokenize;
	jsonDiff.castInput = function (value) {
	  /*istanbul ignore start*/var /*istanbul ignore end*/undefinedReplacement = this.options.undefinedReplacement;


	  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value), function (k, v) {
	    if (typeof v === 'undefined') {
	      return undefinedReplacement;
	    }

	    return v;
	  }, '  ');
	};
	jsonDiff.equals = function (left, right) {
	  return (/*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'))
	  );
	};

	function diffJson(oldObj, newObj, options) {
	  return jsonDiff.diff(oldObj, newObj, options);
	}

	// This function handles the presence of circular references by bailing out when encountering an
	// object that is already on the "stack" of items being processed.
	function canonicalize(obj, stack, replacementStack) {
	  stack = stack || [];
	  replacementStack = replacementStack || [];

	  var i = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

	  for (i = 0; i < stack.length; i += 1) {
	    if (stack[i] === obj) {
	      return replacementStack[i];
	    }
	  }

	  var canonicalizedObj = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

	  if ('[object Array]' === objectPrototypeToString.call(obj)) {
	    stack.push(obj);
	    canonicalizedObj = new Array(obj.length);
	    replacementStack.push(canonicalizedObj);
	    for (i = 0; i < obj.length; i += 1) {
	      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack);
	    }
	    stack.pop();
	    replacementStack.pop();
	    return canonicalizedObj;
	  }

	  if (obj && obj.toJSON) {
	    obj = obj.toJSON();
	  }

	  if ( /*istanbul ignore start*/(typeof /*istanbul ignore end*/obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null) {
	    stack.push(obj);
	    canonicalizedObj = {};
	    replacementStack.push(canonicalizedObj);
	    var sortedKeys = [],
	        key = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
	    for (key in obj) {
	      /* istanbul ignore else */
	      if (obj.hasOwnProperty(key)) {
	        sortedKeys.push(key);
	      }
	    }
	    sortedKeys.sort();
	    for (i = 0; i < sortedKeys.length; i += 1) {
	      key = sortedKeys[i];
	      canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack);
	    }
	    stack.pop();
	    replacementStack.pop();
	  } else {
	    canonicalizedObj = obj;
	  }
	  return canonicalizedObj;
	}



/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports.arrayDiff = undefined;
	exports. /*istanbul ignore end*/diffArrays = diffArrays;

	var /*istanbul ignore start*/_base = __webpack_require__(1) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _base2 = _interopRequireDefault(_base);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/var arrayDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/arrayDiff = new /*istanbul ignore start*/_base2['default'] /*istanbul ignore end*/();
	arrayDiff.tokenize = arrayDiff.join = function (value) {
	  return value.slice();
	};
	arrayDiff.removeEmpty = function (value) {
	  return value;
	};

	function diffArrays(oldArr, newArr, callback) {
	  return arrayDiff.diff(oldArr, newArr, callback);
	}



/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports. /*istanbul ignore end*/applyPatch = applyPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = applyPatches;

	var /*istanbul ignore start*/_parse = __webpack_require__(11) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_distanceIterator = __webpack_require__(12) /*istanbul ignore end*/;

	/*istanbul ignore start*/var _distanceIterator2 = _interopRequireDefault(_distanceIterator);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	/*istanbul ignore end*/function applyPatch(source, uniDiff) {
	  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	  if (typeof uniDiff === 'string') {
	    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
	  }

	  if (Array.isArray(uniDiff)) {
	    if (uniDiff.length > 1) {
	      throw new Error('applyPatch only works with a single input.');
	    }

	    uniDiff = uniDiff[0];
	  }

	  // Apply the diff to the input
	  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
	      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
	      hunks = uniDiff.hunks,
	      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) /*istanbul ignore start*/{
	    return (/*istanbul ignore end*/line === patchContent
	    );
	  },
	      errorCount = 0,
	      fuzzFactor = options.fuzzFactor || 0,
	      minLine = 0,
	      offset = 0,
	      removeEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
	      addEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

	  /**
	   * Checks if the hunk exactly fits on the provided location
	   */
	  function hunkFits(hunk, toPos) {
	    for (var j = 0; j < hunk.lines.length; j++) {
	      var line = hunk.lines[j],
	          operation = line[0],
	          content = line.substr(1);

	      if (operation === ' ' || operation === '-') {
	        // Context sanity check
	        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
	          errorCount++;

	          if (errorCount > fuzzFactor) {
	            return false;
	          }
	        }
	        toPos++;
	      }
	    }

	    return true;
	  }

	  // Search best fit offsets for each hunk based on the previous ones
	  for (var i = 0; i < hunks.length; i++) {
	    var hunk = hunks[i],
	        maxLine = lines.length - hunk.oldLines,
	        localOffset = 0,
	        toPos = offset + hunk.oldStart - 1;

	    var iterator = /*istanbul ignore start*/(0, _distanceIterator2['default']) /*istanbul ignore end*/(toPos, minLine, maxLine);

	    for (; localOffset !== undefined; localOffset = iterator()) {
	      if (hunkFits(hunk, toPos + localOffset)) {
	        hunk.offset = offset += localOffset;
	        break;
	      }
	    }

	    if (localOffset === undefined) {
	      return false;
	    }

	    // Set lower text limit to end of the current hunk, so next ones don't try
	    // to fit over already patched text
	    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
	  }

	  // Apply patch hunks
	  var diffOffset = 0;
	  for (var _i = 0; _i < hunks.length; _i++) {
	    var _hunk = hunks[_i],
	        _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;
	    diffOffset += _hunk.newLines - _hunk.oldLines;

	    if (_toPos < 0) {
	      // Creating a new file
	      _toPos = 0;
	    }

	    for (var j = 0; j < _hunk.lines.length; j++) {
	      var line = _hunk.lines[j],
	          operation = line[0],
	          content = line.substr(1),
	          delimiter = _hunk.linedelimiters[j];

	      if (operation === ' ') {
	        _toPos++;
	      } else if (operation === '-') {
	        lines.splice(_toPos, 1);
	        delimiters.splice(_toPos, 1);
	        /* istanbul ignore else */
	      } else if (operation === '+') {
	        lines.splice(_toPos, 0, content);
	        delimiters.splice(_toPos, 0, delimiter);
	        _toPos++;
	      } else if (operation === '\\') {
	        var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;
	        if (previousOperation === '+') {
	          removeEOFNL = true;
	        } else if (previousOperation === '-') {
	          addEOFNL = true;
	        }
	      }
	    }
	  }

	  // Handle EOFNL insertion/removal
	  if (removeEOFNL) {
	    while (!lines[lines.length - 1]) {
	      lines.pop();
	      delimiters.pop();
	    }
	  } else if (addEOFNL) {
	    lines.push('');
	    delimiters.push('\n');
	  }
	  for (var _k = 0; _k < lines.length - 1; _k++) {
	    lines[_k] = lines[_k] + delimiters[_k];
	  }
	  return lines.join('');
	}

	// Wrapper that supports multiple file patches via callbacks.
	function applyPatches(uniDiff, options) {
	  if (typeof uniDiff === 'string') {
	    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
	  }

	  var currentIndex = 0;
	  function processIndex() {
	    var index = uniDiff[currentIndex++];
	    if (!index) {
	      return options.complete();
	    }

	    options.loadFile(index, function (err, data) {
	      if (err) {
	        return options.complete(err);
	      }

	      var updatedContent = applyPatch(data, index, options);
	      options.patched(index, updatedContent, function (err) {
	        if (err) {
	          return options.complete(err);
	        }

	        processIndex();
	      });
	    });
	  }
	  processIndex();
	}



/***/ }),
/* 11 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports. /*istanbul ignore end*/parsePatch = parsePatch;
	function parsePatch(uniDiff) {
	  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
	      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
	      list = [],
	      i = 0;

	  function parseIndex() {
	    var index = {};
	    list.push(index);

	    // Parse diff metadata
	    while (i < diffstr.length) {
	      var line = diffstr[i];

	      // File header found, end parsing diff metadata
	      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
	        break;
	      }

	      // Diff index
	      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
	      if (header) {
	        index.index = header[1];
	      }

	      i++;
	    }

	    // Parse file headers if they are defined. Unified diff requires them, but
	    // there's no technical issues to have an isolated hunk without file header
	    parseFileHeader(index);
	    parseFileHeader(index);

	    // Parse hunks
	    index.hunks = [];

	    while (i < diffstr.length) {
	      var _line = diffstr[i];

	      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
	        break;
	      } else if (/^@@/.test(_line)) {
	        index.hunks.push(parseHunk());
	      } else if (_line && options.strict) {
	        // Ignore unexpected content unless in strict mode
	        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
	      } else {
	        i++;
	      }
	    }
	  }

	  // Parses the --- and +++ headers, if none are found, no lines
	  // are consumed.
	  function parseFileHeader(index) {
	    var headerPattern = /^(---|\+\+\+)\s+([\S ]*)(?:\t(.*?)\s*)?$/;
	    var fileHeader = headerPattern.exec(diffstr[i]);
	    if (fileHeader) {
	      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
	      var fileName = fileHeader[2].replace(/\\\\/g, '\\');
	      if (/^".*"$/.test(fileName)) {
	        fileName = fileName.substr(1, fileName.length - 2);
	      }
	      index[keyPrefix + 'FileName'] = fileName;
	      index[keyPrefix + 'Header'] = fileHeader[3];

	      i++;
	    }
	  }

	  // Parses a hunk
	  // This assumes that we are at the start of a hunk.
	  function parseHunk() {
	    var chunkHeaderIndex = i,
	        chunkHeaderLine = diffstr[i++],
	        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

	    var hunk = {
	      oldStart: +chunkHeader[1],
	      oldLines: +chunkHeader[2] || 1,
	      newStart: +chunkHeader[3],
	      newLines: +chunkHeader[4] || 1,
	      lines: [],
	      linedelimiters: []
	    };

	    var addCount = 0,
	        removeCount = 0;
	    for (; i < diffstr.length; i++) {
	      // Lines starting with '---' could be mistaken for the "remove line" operation
	      // But they could be the header for the next file. Therefore prune such cases out.
	      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
	        break;
	      }
	      var operation = diffstr[i][0];

	      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
	        hunk.lines.push(diffstr[i]);
	        hunk.linedelimiters.push(delimiters[i] || '\n');

	        if (operation === '+') {
	          addCount++;
	        } else if (operation === '-') {
	          removeCount++;
	        } else if (operation === ' ') {
	          addCount++;
	          removeCount++;
	        }
	      } else {
	        break;
	      }
	    }

	    // Handle the empty block count case
	    if (!addCount && hunk.newLines === 1) {
	      hunk.newLines = 0;
	    }
	    if (!removeCount && hunk.oldLines === 1) {
	      hunk.oldLines = 0;
	    }

	    // Perform optional sanity checking
	    if (options.strict) {
	      if (addCount !== hunk.newLines) {
	        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
	      }
	      if (removeCount !== hunk.oldLines) {
	        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
	      }
	    }

	    return hunk;
	  }

	  while (i < diffstr.length) {
	    parseIndex();
	  }

	  return list;
	}



/***/ }),
/* 12 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/"use strict";

	exports.__esModule = true;

	exports["default"] = /*istanbul ignore end*/function (start, minLine, maxLine) {
	  var wantForward = true,
	      backwardExhausted = false,
	      forwardExhausted = false,
	      localOffset = 1;

	  return function iterator() {
	    if (wantForward && !forwardExhausted) {
	      if (backwardExhausted) {
	        localOffset++;
	      } else {
	        wantForward = false;
	      }

	      // Check if trying to fit beyond text length, and if not, check it fits
	      // after offset location (or desired location on first iteration)
	      if (start + localOffset <= maxLine) {
	        return localOffset;
	      }

	      forwardExhausted = true;
	    }

	    if (!backwardExhausted) {
	      if (!forwardExhausted) {
	        wantForward = true;
	      }

	      // Check if trying to fit before text beginning, and if not, check it fits
	      // before offset location
	      if (minLine <= start - localOffset) {
	        return -localOffset++;
	      }

	      backwardExhausted = true;
	      return iterator();
	    }

	    // We tried to fit hunk before text beginning and beyond text length, then
	    // hunk can't fit on the text. Return undefined
	  };
	};



/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports. /*istanbul ignore end*/calcLineCount = calcLineCount;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/merge = merge;

	var /*istanbul ignore start*/_create = __webpack_require__(14) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_parse = __webpack_require__(11) /*istanbul ignore end*/;

	var /*istanbul ignore start*/_array = __webpack_require__(15) /*istanbul ignore end*/;

	/*istanbul ignore start*/function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	/*istanbul ignore end*/function calcLineCount(hunk) {
	  /*istanbul ignore start*/var _calcOldNewLineCount = /*istanbul ignore end*/calcOldNewLineCount(hunk.lines),
	      oldLines = _calcOldNewLineCount.oldLines,
	      newLines = _calcOldNewLineCount.newLines;

	  if (oldLines !== undefined) {
	    hunk.oldLines = oldLines;
	  } else {
	    delete hunk.oldLines;
	  }

	  if (newLines !== undefined) {
	    hunk.newLines = newLines;
	  } else {
	    delete hunk.newLines;
	  }
	}

	function merge(mine, theirs, base) {
	  mine = loadPatch(mine, base);
	  theirs = loadPatch(theirs, base);

	  var ret = {};

	  // For index we just let it pass through as it doesn't have any necessary meaning.
	  // Leaving sanity checks on this to the API consumer that may know more about the
	  // meaning in their own context.
	  if (mine.index || theirs.index) {
	    ret.index = mine.index || theirs.index;
	  }

	  if (mine.newFileName || theirs.newFileName) {
	    if (!fileNameChanged(mine)) {
	      // No header or no change in ours, use theirs (and ours if theirs does not exist)
	      ret.oldFileName = theirs.oldFileName || mine.oldFileName;
	      ret.newFileName = theirs.newFileName || mine.newFileName;
	      ret.oldHeader = theirs.oldHeader || mine.oldHeader;
	      ret.newHeader = theirs.newHeader || mine.newHeader;
	    } else if (!fileNameChanged(theirs)) {
	      // No header or no change in theirs, use ours
	      ret.oldFileName = mine.oldFileName;
	      ret.newFileName = mine.newFileName;
	      ret.oldHeader = mine.oldHeader;
	      ret.newHeader = mine.newHeader;
	    } else {
	      // Both changed... figure it out
	      ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
	      ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
	      ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
	      ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
	    }
	  }

	  ret.hunks = [];

	  var mineIndex = 0,
	      theirsIndex = 0,
	      mineOffset = 0,
	      theirsOffset = 0;

	  while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
	    var mineCurrent = mine.hunks[mineIndex] || { oldStart: Infinity },
	        theirsCurrent = theirs.hunks[theirsIndex] || { oldStart: Infinity };

	    if (hunkBefore(mineCurrent, theirsCurrent)) {
	      // This patch does not overlap with any of the others, yay.
	      ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
	      mineIndex++;
	      theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
	    } else if (hunkBefore(theirsCurrent, mineCurrent)) {
	      // This patch does not overlap with any of the others, yay.
	      ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
	      theirsIndex++;
	      mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
	    } else {
	      // Overlap, merge as best we can
	      var mergedHunk = {
	        oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
	        oldLines: 0,
	        newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
	        newLines: 0,
	        lines: []
	      };
	      mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
	      theirsIndex++;
	      mineIndex++;

	      ret.hunks.push(mergedHunk);
	    }
	  }

	  return ret;
	}

	function loadPatch(param, base) {
	  if (typeof param === 'string') {
	    if (/^@@/m.test(param) || /^Index:/m.test(param)) {
	      return (/*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(param)[0]
	      );
	    }

	    if (!base) {
	      throw new Error('Must provide a base reference or pass in a patch');
	    }
	    return (/*istanbul ignore start*/(0, _create.structuredPatch) /*istanbul ignore end*/(undefined, undefined, base, param)
	    );
	  }

	  return param;
	}

	function fileNameChanged(patch) {
	  return patch.newFileName && patch.newFileName !== patch.oldFileName;
	}

	function selectField(index, mine, theirs) {
	  if (mine === theirs) {
	    return mine;
	  } else {
	    index.conflict = true;
	    return { mine: mine, theirs: theirs };
	  }
	}

	function hunkBefore(test, check) {
	  return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
	}

	function cloneHunk(hunk, offset) {
	  return {
	    oldStart: hunk.oldStart, oldLines: hunk.oldLines,
	    newStart: hunk.newStart + offset, newLines: hunk.newLines,
	    lines: hunk.lines
	  };
	}

	function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
	  // This will generally result in a conflicted hunk, but there are cases where the context
	  // is the only overlap where we can successfully merge the content here.
	  var mine = { offset: mineOffset, lines: mineLines, index: 0 },
	      their = { offset: theirOffset, lines: theirLines, index: 0 };

	  // Handle any leading content
	  insertLeading(hunk, mine, their);
	  insertLeading(hunk, their, mine);

	  // Now in the overlap content. Scan through and select the best changes from each.
	  while (mine.index < mine.lines.length && their.index < their.lines.length) {
	    var mineCurrent = mine.lines[mine.index],
	        theirCurrent = their.lines[their.index];

	    if ((mineCurrent[0] === '-' || mineCurrent[0] === '+') && (theirCurrent[0] === '-' || theirCurrent[0] === '+')) {
	      // Both modified ...
	      mutualChange(hunk, mine, their);
	    } else if (mineCurrent[0] === '+' && theirCurrent[0] === ' ') {
	      /*istanbul ignore start*/var _hunk$lines;

	      /*istanbul ignore end*/ // Mine inserted
	      /*istanbul ignore start*/(_hunk$lines = /*istanbul ignore end*/hunk.lines).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_hunk$lines /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/collectChange(mine)));
	    } else if (theirCurrent[0] === '+' && mineCurrent[0] === ' ') {
	      /*istanbul ignore start*/var _hunk$lines2;

	      /*istanbul ignore end*/ // Theirs inserted
	      /*istanbul ignore start*/(_hunk$lines2 = /*istanbul ignore end*/hunk.lines).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_hunk$lines2 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/collectChange(their)));
	    } else if (mineCurrent[0] === '-' && theirCurrent[0] === ' ') {
	      // Mine removed or edited
	      removal(hunk, mine, their);
	    } else if (theirCurrent[0] === '-' && mineCurrent[0] === ' ') {
	      // Their removed or edited
	      removal(hunk, their, mine, true);
	    } else if (mineCurrent === theirCurrent) {
	      // Context identity
	      hunk.lines.push(mineCurrent);
	      mine.index++;
	      their.index++;
	    } else {
	      // Context mismatch
	      conflict(hunk, collectChange(mine), collectChange(their));
	    }
	  }

	  // Now push anything that may be remaining
	  insertTrailing(hunk, mine);
	  insertTrailing(hunk, their);

	  calcLineCount(hunk);
	}

	function mutualChange(hunk, mine, their) {
	  var myChanges = collectChange(mine),
	      theirChanges = collectChange(their);

	  if (allRemoves(myChanges) && allRemoves(theirChanges)) {
	    // Special case for remove changes that are supersets of one another
	    if ( /*istanbul ignore start*/(0, _array.arrayStartsWith) /*istanbul ignore end*/(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)) {
	      /*istanbul ignore start*/var _hunk$lines3;

	      /*istanbul ignore end*/ /*istanbul ignore start*/(_hunk$lines3 = /*istanbul ignore end*/hunk.lines).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_hunk$lines3 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/myChanges));
	      return;
	    } else if ( /*istanbul ignore start*/(0, _array.arrayStartsWith) /*istanbul ignore end*/(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)) {
	      /*istanbul ignore start*/var _hunk$lines4;

	      /*istanbul ignore end*/ /*istanbul ignore start*/(_hunk$lines4 = /*istanbul ignore end*/hunk.lines).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_hunk$lines4 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/theirChanges));
	      return;
	    }
	  } else if ( /*istanbul ignore start*/(0, _array.arrayEqual) /*istanbul ignore end*/(myChanges, theirChanges)) {
	    /*istanbul ignore start*/var _hunk$lines5;

	    /*istanbul ignore end*/ /*istanbul ignore start*/(_hunk$lines5 = /*istanbul ignore end*/hunk.lines).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_hunk$lines5 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/myChanges));
	    return;
	  }

	  conflict(hunk, myChanges, theirChanges);
	}

	function removal(hunk, mine, their, swap) {
	  var myChanges = collectChange(mine),
	      theirChanges = collectContext(their, myChanges);
	  if (theirChanges.merged) {
	    /*istanbul ignore start*/var _hunk$lines6;

	    /*istanbul ignore end*/ /*istanbul ignore start*/(_hunk$lines6 = /*istanbul ignore end*/hunk.lines).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_hunk$lines6 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/theirChanges.merged));
	  } else {
	    conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
	  }
	}

	function conflict(hunk, mine, their) {
	  hunk.conflict = true;
	  hunk.lines.push({
	    conflict: true,
	    mine: mine,
	    theirs: their
	  });
	}

	function insertLeading(hunk, insert, their) {
	  while (insert.offset < their.offset && insert.index < insert.lines.length) {
	    var line = insert.lines[insert.index++];
	    hunk.lines.push(line);
	    insert.offset++;
	  }
	}
	function insertTrailing(hunk, insert) {
	  while (insert.index < insert.lines.length) {
	    var line = insert.lines[insert.index++];
	    hunk.lines.push(line);
	  }
	}

	function collectChange(state) {
	  var ret = [],
	      operation = state.lines[state.index][0];
	  while (state.index < state.lines.length) {
	    var line = state.lines[state.index];

	    // Group additions that are immediately after subtractions and treat them as one "atomic" modify change.
	    if (operation === '-' && line[0] === '+') {
	      operation = '+';
	    }

	    if (operation === line[0]) {
	      ret.push(line);
	      state.index++;
	    } else {
	      break;
	    }
	  }

	  return ret;
	}
	function collectContext(state, matchChanges) {
	  var changes = [],
	      merged = [],
	      matchIndex = 0,
	      contextChanges = false,
	      conflicted = false;
	  while (matchIndex < matchChanges.length && state.index < state.lines.length) {
	    var change = state.lines[state.index],
	        match = matchChanges[matchIndex];

	    // Once we've hit our add, then we are done
	    if (match[0] === '+') {
	      break;
	    }

	    contextChanges = contextChanges || change[0] !== ' ';

	    merged.push(match);
	    matchIndex++;

	    // Consume any additions in the other block as a conflict to attempt
	    // to pull in the remaining context after this
	    if (change[0] === '+') {
	      conflicted = true;

	      while (change[0] === '+') {
	        changes.push(change);
	        change = state.lines[++state.index];
	      }
	    }

	    if (match.substr(1) === change.substr(1)) {
	      changes.push(change);
	      state.index++;
	    } else {
	      conflicted = true;
	    }
	  }

	  if ((matchChanges[matchIndex] || '')[0] === '+' && contextChanges) {
	    conflicted = true;
	  }

	  if (conflicted) {
	    return changes;
	  }

	  while (matchIndex < matchChanges.length) {
	    merged.push(matchChanges[matchIndex++]);
	  }

	  return {
	    merged: merged,
	    changes: changes
	  };
	}

	function allRemoves(changes) {
	  return changes.reduce(function (prev, change) {
	    return prev && change[0] === '-';
	  }, true);
	}
	function skipRemoveSuperset(state, removeChanges, delta) {
	  for (var i = 0; i < delta; i++) {
	    var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);
	    if (state.lines[state.index + i] !== ' ' + changeContent) {
	      return false;
	    }
	  }

	  state.index += delta;
	  return true;
	}

	function calcOldNewLineCount(lines) {
	  var oldLines = 0;
	  var newLines = 0;

	  lines.forEach(function (line) {
	    if (typeof line !== 'string') {
	      var myCount = calcOldNewLineCount(line.mine);
	      var theirCount = calcOldNewLineCount(line.theirs);

	      if (oldLines !== undefined) {
	        if (myCount.oldLines === theirCount.oldLines) {
	          oldLines += myCount.oldLines;
	        } else {
	          oldLines = undefined;
	        }
	      }

	      if (newLines !== undefined) {
	        if (myCount.newLines === theirCount.newLines) {
	          newLines += myCount.newLines;
	        } else {
	          newLines = undefined;
	        }
	      }
	    } else {
	      if (newLines !== undefined && (line[0] === '+' || line[0] === ' ')) {
	        newLines++;
	      }
	      if (oldLines !== undefined && (line[0] === '-' || line[0] === ' ')) {
	        oldLines++;
	      }
	    }
	  });

	  return { oldLines: oldLines, newLines: newLines };
	}



/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports. /*istanbul ignore end*/structuredPatch = structuredPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = createTwoFilesPatch;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = createPatch;

	var /*istanbul ignore start*/_line = __webpack_require__(5) /*istanbul ignore end*/;

	/*istanbul ignore start*/function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	/*istanbul ignore end*/function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
	  if (!options) {
	    options = {};
	  }
	  if (typeof options.context === 'undefined') {
	    options.context = 4;
	  }

	  var diff = /*istanbul ignore start*/(0, _line.diffLines) /*istanbul ignore end*/(oldStr, newStr, options);
	  diff.push({ value: '', lines: [] }); // Append an empty value to make cleanup easier

	  function contextLines(lines) {
	    return lines.map(function (entry) {
	      return ' ' + entry;
	    });
	  }

	  var hunks = [];
	  var oldRangeStart = 0,
	      newRangeStart = 0,
	      curRange = [],
	      oldLine = 1,
	      newLine = 1;

	  /*istanbul ignore start*/var _loop = function _loop( /*istanbul ignore end*/i) {
	    var current = diff[i],
	        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
	    current.lines = lines;

	    if (current.added || current.removed) {
	      /*istanbul ignore start*/var _curRange;

	      /*istanbul ignore end*/ // If we have previous context, start with that
	      if (!oldRangeStart) {
	        var prev = diff[i - 1];
	        oldRangeStart = oldLine;
	        newRangeStart = newLine;

	        if (prev) {
	          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
	          oldRangeStart -= curRange.length;
	          newRangeStart -= curRange.length;
	        }
	      }

	      // Output our changes
	      /*istanbul ignore start*/(_curRange = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/lines.map(function (entry) {
	        return (current.added ? '+' : '-') + entry;
	      })));

	      // Track the updated file position
	      if (current.added) {
	        newLine += lines.length;
	      } else {
	        oldLine += lines.length;
	      }
	    } else {
	      // Identical context lines. Track line changes
	      if (oldRangeStart) {
	        // Close out any changes that have been output (or join overlapping)
	        if (lines.length <= options.context * 2 && i < diff.length - 2) {
	          /*istanbul ignore start*/var _curRange2;

	          /*istanbul ignore end*/ // Overlapping
	          /*istanbul ignore start*/(_curRange2 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange2 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines)));
	        } else {
	          /*istanbul ignore start*/var _curRange3;

	          /*istanbul ignore end*/ // end the range and output
	          var contextSize = Math.min(lines.length, options.context);
	          /*istanbul ignore start*/(_curRange3 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange3 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines.slice(0, contextSize))));

	          var hunk = {
	            oldStart: oldRangeStart,
	            oldLines: oldLine - oldRangeStart + contextSize,
	            newStart: newRangeStart,
	            newLines: newLine - newRangeStart + contextSize,
	            lines: curRange
	          };
	          if (i >= diff.length - 2 && lines.length <= options.context) {
	            // EOF is inside this hunk
	            var oldEOFNewline = /\n$/.test(oldStr);
	            var newEOFNewline = /\n$/.test(newStr);
	            if (lines.length == 0 && !oldEOFNewline) {
	              // special case: old has no eol and no trailing context; no-nl can end up before adds
	              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
	            } else if (!oldEOFNewline || !newEOFNewline) {
	              curRange.push('\\ No newline at end of file');
	            }
	          }
	          hunks.push(hunk);

	          oldRangeStart = 0;
	          newRangeStart = 0;
	          curRange = [];
	        }
	      }
	      oldLine += lines.length;
	      newLine += lines.length;
	    }
	  };

	  for (var i = 0; i < diff.length; i++) {
	    /*istanbul ignore start*/_loop( /*istanbul ignore end*/i);
	  }

	  return {
	    oldFileName: oldFileName, newFileName: newFileName,
	    oldHeader: oldHeader, newHeader: newHeader,
	    hunks: hunks
	  };
	}

	function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
	  var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);

	  var ret = [];
	  if (oldFileName == newFileName) {
	    ret.push('Index: ' + oldFileName);
	  }
	  ret.push('===================================================================');
	  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
	  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

	  for (var i = 0; i < diff.hunks.length; i++) {
	    var hunk = diff.hunks[i];
	    ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
	    ret.push.apply(ret, hunk.lines);
	  }

	  return ret.join('\n') + '\n';
	}

	function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
	  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
	}



/***/ }),
/* 15 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/"use strict";

	exports.__esModule = true;
	exports. /*istanbul ignore end*/arrayEqual = arrayEqual;
	/*istanbul ignore start*/exports. /*istanbul ignore end*/arrayStartsWith = arrayStartsWith;
	function arrayEqual(a, b) {
	  if (a.length !== b.length) {
	    return false;
	  }

	  return arrayStartsWith(a, b);
	}

	function arrayStartsWith(array, start) {
	  if (start.length > array.length) {
	    return false;
	  }

	  for (var i = 0; i < start.length; i++) {
	    if (start[i] !== array[i]) {
	      return false;
	    }
	  }

	  return true;
	}



/***/ }),
/* 16 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/"use strict";

	exports.__esModule = true;
	exports. /*istanbul ignore end*/convertChangesToDMP = convertChangesToDMP;
	// See: http://code.google.com/p/google-diff-match-patch/wiki/API
	function convertChangesToDMP(changes) {
	  var ret = [],
	      change = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
	      operation = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
	  for (var i = 0; i < changes.length; i++) {
	    change = changes[i];
	    if (change.added) {
	      operation = 1;
	    } else if (change.removed) {
	      operation = -1;
	    } else {
	      operation = 0;
	    }

	    ret.push([operation, change.value]);
	  }
	  return ret;
	}



/***/ }),
/* 17 */
/***/ (function(module, exports) {

	/*istanbul ignore start*/'use strict';

	exports.__esModule = true;
	exports. /*istanbul ignore end*/convertChangesToXML = convertChangesToXML;
	function convertChangesToXML(changes) {
	  var ret = [];
	  for (var i = 0; i < changes.length; i++) {
	    var change = changes[i];
	    if (change.added) {
	      ret.push('<ins>');
	    } else if (change.removed) {
	      ret.push('<del>');
	    }

	    ret.push(escapeHTML(change.value));

	    if (change.added) {
	      ret.push('</ins>');
	    } else if (change.removed) {
	      ret.push('</del>');
	    }
	  }
	  return ret.join('');
	}

	function escapeHTML(s) {
	  var n = s;
	  n = n.replace(/&/g, '&amp;');
	  n = n.replace(/</g, '&lt;');
	  n = n.replace(/>/g, '&gt;');
	  n = n.replace(/"/g, '&quot;');

	  return n;
	}



/***/ })
/******/ ])
});
;
},{}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
// Copyright 2014, 2016 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

function stringify (obj, options) {
  options = options || {}
  var indent = JSON.stringify([1], null, get(options, 'indent', 2)).slice(2, -3)
  var maxLength = (indent === '' ? Infinity : get(options, 'maxLength', 80))

  return (function _stringify (obj, currentIndent, reserved) {
    if (obj && typeof obj.toJSON === 'function') {
      obj = obj.toJSON()
    }

    var string = JSON.stringify(obj)

    if (string === undefined) {
      return string
    }

    var length = maxLength - currentIndent.length - reserved

    if (string.length <= length) {
      var prettified = prettify(string)
      if (prettified.length <= length) {
        return prettified
      }
    }

    if (typeof obj === 'object' && obj !== null) {
      var nextIndent = currentIndent + indent
      var items = []
      var delimiters
      var comma = function (array, index) {
        return (index === array.length - 1 ? 0 : 1)
      }

      if (Array.isArray(obj)) {
        for (var index = 0; index < obj.length; index++) {
          items.push(
            _stringify(obj[index], nextIndent, comma(obj, index)) || 'null'
          )
        }
        delimiters = '[]'
      } else {
        Object.keys(obj).forEach(function (key, index, array) {
          var keyPart = JSON.stringify(key) + ': '
          var value = _stringify(obj[key], nextIndent,
                                 keyPart.length + comma(array, index))
          if (value !== undefined) {
            items.push(keyPart + value)
          }
        })
        delimiters = '{}'
      }

      if (items.length > 0) {
        return [
          delimiters[0],
          indent + items.join(',\n' + nextIndent),
          delimiters[1]
        ].join('\n' + currentIndent)
      }
    }

    return string
  }(obj, '', 0))
}

// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
var stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g

function prettify (string) {
  return string.replace(stringOrChar, function (match, string) {
    return string ? match : match + ' '
  })
}

function get (options, name, defaultValue) {
  return (name in options ? options[name] : defaultValue)
}

module.exports = stringify

},{}],11:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,12],$V1=[1,13],$V2=[1,9],$V3=[1,10],$V4=[1,11],$V5=[1,14],$V6=[1,15],$V7=[14,18,22,24],$V8=[18,22],$V9=[22,24];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 // replace escaped characters with actual character
          this.$ = new String(yytext.replace(/\\(\\|")/g, "$"+"1")
                     .replace(/\\n/g,'\n')
                     .replace(/\\r/g,'\r')
                     .replace(/\\t/g,'\t')
                     .replace(/\\v/g,'\v')
                     .replace(/\\f/g,'\f')
                     .replace(/\\b/g,'\b'));
          this.$.__line__ =  this._$.first_line;
        
break;
case 2:

            this.$ = new Number(yytext);
            this.$.__line__ =  this._$.first_line;
        
break;
case 3:

            this.$ = null;
        
break;
case 4:

            this.$ = new Boolean(true);
            this.$.__line__ = this._$.first_line;
        
break;
case 5:

            this.$ = new Boolean(false);
            this.$.__line__ = this._$.first_line;
        
break;
case 6:
return this.$ = $$[$0-1];
break;
case 13:
this.$ = {}; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 14: case 19:
this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 15:
this.$ = [$$[$0-2], $$[$0]];
break;
case 16:
this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 17:
this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
break;
case 18:
this.$ = []; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 20:
this.$ = [$$[$0]];
break;
case 21:
this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
}
},
table: [{3:5,4:$V0,5:6,6:$V1,7:3,8:$V2,9:4,10:$V3,11:$V4,12:1,13:2,15:7,16:8,17:$V5,23:$V6},{1:[3]},{14:[1,16]},o($V7,[2,7]),o($V7,[2,8]),o($V7,[2,9]),o($V7,[2,10]),o($V7,[2,11]),o($V7,[2,12]),o($V7,[2,3]),o($V7,[2,4]),o($V7,[2,5]),o([14,18,21,22,24],[2,1]),o($V7,[2,2]),{3:20,4:$V0,18:[1,17],19:18,20:19},{3:5,4:$V0,5:6,6:$V1,7:3,8:$V2,9:4,10:$V3,11:$V4,13:23,15:7,16:8,17:$V5,23:$V6,24:[1,21],25:22},{1:[2,6]},o($V7,[2,13]),{18:[1,24],22:[1,25]},o($V8,[2,16]),{21:[1,26]},o($V7,[2,18]),{22:[1,28],24:[1,27]},o($V9,[2,20]),o($V7,[2,14]),{3:20,4:$V0,20:29},{3:5,4:$V0,5:6,6:$V1,7:3,8:$V2,9:4,10:$V3,11:$V4,13:30,15:7,16:8,17:$V5,23:$V6},o($V7,[2,19]),{3:5,4:$V0,5:6,6:$V1,7:3,8:$V2,9:4,10:$V3,11:$V4,13:31,15:7,16:8,17:$V5,23:$V6},o($V8,[2,17]),o($V8,[2,15]),o($V9,[2,21])],
defaultActions: {16:[2,6]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 6
break;
case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
break;
case 3:return 17
break;
case 4:return 18
break;
case 5:return 23
break;
case 6:return 24
break;
case 7:return 22
break;
case 8:return 21
break;
case 9:return 10
break;
case 10:return 11
break;
case 11:return 8
break;
case 12:return 14
break;
case 13:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":87,"fs":5,"path":86}],12:[function(require,module,exports){
/**
 * lodash 3.0.7 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArray = require('lodash.isarray'),
    isTypedArray = require('lodash.istypedarray'),
    keys = require('lodash.keys');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} value The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = baseIsEqual;

},{"lodash.isarray":16,"lodash.istypedarray":18,"lodash.keys":19}],13:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = bindCallback;

},{}],14:[function(require,module,exports){
/**
 * lodash 3.9.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = getNative;

},{}],15:[function(require,module,exports){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isArguments;

},{}],16:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var arrayTag = '[object Array]',
    funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isArray;

},{}],17:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseIsEqual = require('lodash._baseisequal'),
    bindCallback = require('lodash._bindcallback');

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent. If `customizer` is provided it is invoked to compare values.
 * If `customizer` returns `undefined` comparisons are handled by the method
 * instead. The `customizer` is bound to `thisArg` and invoked with three
 * arguments: (value, other [, index|key]).
 *
 * **Note:** This method supports comparing arrays, booleans, `Date` objects,
 * numbers, `Object` objects, regexes, and strings. Objects are compared by
 * their own, not inherited, enumerable properties. Functions and DOM nodes
 * are **not** supported. Provide a customizer function to extend support
 * for comparing other values.
 *
 * @static
 * @memberOf _
 * @alias eq
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize value comparisons.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
 *
 * object == other;
 * // => false
 *
 * _.isEqual(object, other);
 * // => true
 *
 * // using a customizer callback
 * var array = ['hello', 'goodbye'];
 * var other = ['hi', 'goodbye'];
 *
 * _.isEqual(array, other, function(value, other) {
 *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
 *     return true;
 *   }
 * });
 * // => true
 */
function isEqual(value, other, customizer, thisArg) {
  customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
  var result = customizer ? customizer(value, other) : undefined;
  return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
}

module.exports = isEqual;

},{"lodash._baseisequal":12,"lodash._bindcallback":13}],18:[function(require,module,exports){
/**
 * lodash 3.0.6 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length,
 *  else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
}

module.exports = isTypedArray;

},{}],19:[function(require,module,exports){
/**
 * lodash 3.1.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var getNative = require('lodash._getnative'),
    isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray');

/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keys;

},{"lodash._getnative":14,"lodash.isarguments":15,"lodash.isarray":16}],20:[function(require,module,exports){

module.exports = function (style) {
    var styleIDs = [];
    var sourceIDs = [];
    var compositedSourceLayers = [];

    for (var id in style.sources) {
        var source = style.sources[id];

        if (source.type !== "vector")
            { continue; }

        var match = /^mapbox:\/\/(.*)/.exec(source.url);
        if (!match)
            { continue; }

        styleIDs.push(id);
        sourceIDs.push(match[1]);
    }

    if (styleIDs.length < 2)
        { return style; }

    styleIDs.forEach(function (id) {
        delete style.sources[id];
    });

    var compositeID = sourceIDs.join(",");

    style.sources[compositeID] = {
        "type": "vector",
        "url": ("mapbox://" + compositeID)
    };

    style.layers.forEach(function (layer) {
        if (styleIDs.indexOf(layer.source) >= 0) {
            layer.source = compositeID;

            if ('source-layer' in layer) {
                if (compositedSourceLayers.indexOf(layer['source-layer']) >= 0) {
                    throw new Error('Conflicting source layer names');
                } else {
                    compositedSourceLayers.push(layer['source-layer']);
                }
            }
        }
    });

    return style;
};

},{}],21:[function(require,module,exports){

var isEqual = require('lodash.isequal');

var operations = {

    /*
     * { command: 'setStyle', args: [stylesheet] }
     */
    setStyle: 'setStyle',

    /*
     * { command: 'addLayer', args: [layer, 'beforeLayerId'] }
     */
    addLayer: 'addLayer',

    /*
     * { command: 'removeLayer', args: ['layerId'] }
     */
    removeLayer: 'removeLayer',

    /*
     * { command: 'setPaintProperty', args: ['layerId', 'prop', value] }
     */
    setPaintProperty: 'setPaintProperty',

    /*
     * { command: 'setLayoutProperty', args: ['layerId', 'prop', value] }
     */
    setLayoutProperty: 'setLayoutProperty',

    /*
     * { command: 'setFilter', args: ['layerId', filter] }
     */
    setFilter: 'setFilter',

    /*
     * { command: 'addSource', args: ['sourceId', source] }
     */
    addSource: 'addSource',

    /*
     * { command: 'removeSource', args: ['sourceId'] }
     */
    removeSource: 'removeSource',

    /*
     * { command: 'setGeoJSONSourceData', args: ['sourceId', data] }
     */
    setGeoJSONSourceData: 'setGeoJSONSourceData',

    /*
     * { command: 'setLayerZoomRange', args: ['layerId', 0, 22] }
     */
    setLayerZoomRange: 'setLayerZoomRange',

    /*
     * { command: 'setLayerProperty', args: ['layerId', 'prop', value] }
     */
    setLayerProperty: 'setLayerProperty',

    /*
     * { command: 'setCenter', args: [[lon, lat]] }
     */
    setCenter: 'setCenter',

    /*
     * { command: 'setZoom', args: [zoom] }
     */
    setZoom: 'setZoom',

    /*
     * { command: 'setBearing', args: [bearing] }
     */
    setBearing: 'setBearing',

    /*
     * { command: 'setPitch', args: [pitch] }
     */
    setPitch: 'setPitch',

    /*
     * { command: 'setSprite', args: ['spriteUrl'] }
     */
    setSprite: 'setSprite',

    /*
     * { command: 'setGlyphs', args: ['glyphsUrl'] }
     */
    setGlyphs: 'setGlyphs',

    /*
     * { command: 'setTransition', args: [transition] }
     */
    setTransition: 'setTransition',

    /*
     * { command: 'setLighting', args: [lightProperties] }
     */
    setLight: 'setLight'

};


function diffSources(before, after, commands, sourcesRemoved) {
    before = before || {};
    after = after || {};

    var sourceId;

    // look for sources to remove
    for (sourceId in before) {
        if (!before.hasOwnProperty(sourceId)) { continue; }
        if (!after.hasOwnProperty(sourceId)) {
            commands.push({ command: operations.removeSource, args: [sourceId] });
            sourcesRemoved[sourceId] = true;
        }
    }

    // look for sources to add/update
    for (sourceId in after) {
        if (!after.hasOwnProperty(sourceId)) { continue; }
        if (!before.hasOwnProperty(sourceId)) {
            commands.push({ command: operations.addSource, args: [sourceId, after[sourceId]] });
        } else if (!isEqual(before[sourceId], after[sourceId])) {
            if (before[sourceId].type === 'geojson' && after[sourceId].type === 'geojson') {
                // geojson sources use setGeoJSONSourceData command to update
                commands.push({ command: operations.setGeoJSONSourceData, args: [sourceId, after[sourceId].data] });
            } else {
                // no update command, must remove then add
                commands.push({ command: operations.removeSource, args: [sourceId] });
                commands.push({ command: operations.addSource, args: [sourceId, after[sourceId]] });
                sourcesRemoved[sourceId] = true;
            }
        }
    }
}

function diffLayerPropertyChanges(before, after, commands, layerId, klass, command) {
    before = before || {};
    after = after || {};

    var prop;

    for (prop in before) {
        if (!before.hasOwnProperty(prop)) { continue; }
        if (!isEqual(before[prop], after[prop])) {
            commands.push({ command: command, args: [layerId, prop, after[prop], klass] });
        }
    }
    for (prop in after) {
        if (!after.hasOwnProperty(prop) || before.hasOwnProperty(prop)) { continue; }
        if (!isEqual(before[prop], after[prop])) {
            commands.push({ command: command, args: [layerId, prop, after[prop], klass] });
        }
    }
}

function pluckId(layer) {
    return layer.id;
}
function indexById(group, layer) {
    group[layer.id] = layer;
    return group;
}

function diffLayers(before, after, commands) {
    before = before || [];
    after = after || [];

    // order of layers by id
    var beforeOrder = before.map(pluckId);
    var afterOrder = after.map(pluckId);

    // index of layer by id
    var beforeIndex = before.reduce(indexById, {});
    var afterIndex = after.reduce(indexById, {});

    // track order of layers as if they have been mutated
    var tracker = beforeOrder.slice();

    // layers that have been added do not need to be diffed
    var clean = Object.create(null);

    var i, d, layerId, beforeLayer, afterLayer, insertBeforeLayerId, prop;

    // remove layers
    for (i = 0, d = 0; i < beforeOrder.length; i++) {
        layerId = beforeOrder[i];
        if (!afterIndex.hasOwnProperty(layerId)) {
            commands.push({ command: operations.removeLayer, args: [layerId] });
            tracker.splice(tracker.indexOf(layerId, d), 1);
        } else {
            // limit where in tracker we need to look for a match
            d++;
        }
    }

    // add/reorder layers
    for (i = 0, d = 0; i < afterOrder.length; i++) {
        // work backwards as insert is before an existing layer
        layerId = afterOrder[afterOrder.length - 1 - i];

        if (tracker[tracker.length - 1 - i] === layerId) { continue; }

        if (beforeIndex.hasOwnProperty(layerId)) {
            // remove the layer before we insert at the correct position
            commands.push({ command: operations.removeLayer, args: [layerId] });
            tracker.splice(tracker.lastIndexOf(layerId, tracker.length - d), 1);
        } else {
            // limit where in tracker we need to look for a match
            d++;
        }

        // add layer at correct position
        insertBeforeLayerId = tracker[tracker.length - i];
        commands.push({ command: operations.addLayer, args: [afterIndex[layerId], insertBeforeLayerId] });
        tracker.splice(tracker.length - i, 0, layerId);
        clean[layerId] = true;
    }

    // update layers
    for (i = 0; i < afterOrder.length; i++) {
        layerId = afterOrder[i];
        beforeLayer = beforeIndex[layerId];
        afterLayer = afterIndex[layerId];

        // no need to update if previously added (new or moved)
        if (clean[layerId] || isEqual(beforeLayer, afterLayer)) { continue; }

        // If source, source-layer, or type have changes, then remove the layer
        // and add it back 'from scratch'.
        if (!isEqual(beforeLayer.source, afterLayer.source) || !isEqual(beforeLayer['source-layer'], afterLayer['source-layer']) || !isEqual(beforeLayer.type, afterLayer.type)) {
            commands.push({ command: operations.removeLayer, args: [layerId] });
            // we add the layer back at the same position it was already in, so
            // there's no need to update the `tracker`
            insertBeforeLayerId = tracker[tracker.lastIndexOf(layerId) + 1];
            commands.push({ command: operations.addLayer, args: [afterLayer, insertBeforeLayerId] });
            continue;
        }

        // layout, paint, filter, minzoom, maxzoom
        diffLayerPropertyChanges(beforeLayer.layout, afterLayer.layout, commands, layerId, null, operations.setLayoutProperty);
        diffLayerPropertyChanges(beforeLayer.paint, afterLayer.paint, commands, layerId, null, operations.setPaintProperty);
        if (!isEqual(beforeLayer.filter, afterLayer.filter)) {
            commands.push({ command: operations.setFilter, args: [layerId, afterLayer.filter] });
        }
        if (!isEqual(beforeLayer.minzoom, afterLayer.minzoom) || !isEqual(beforeLayer.maxzoom, afterLayer.maxzoom)) {
            commands.push({ command: operations.setLayerZoomRange, args: [layerId, afterLayer.minzoom, afterLayer.maxzoom] });
        }

        // handle all other layer props, including paint.*
        for (prop in beforeLayer) {
            if (!beforeLayer.hasOwnProperty(prop)) { continue; }
            if (prop === 'layout' || prop === 'paint' || prop === 'filter' ||
                prop === 'metadata' || prop === 'minzoom' || prop === 'maxzoom') { continue; }
            if (prop.indexOf('paint.') === 0) {
                diffLayerPropertyChanges(beforeLayer[prop], afterLayer[prop], commands, layerId, prop.slice(6), operations.setPaintProperty);
            } else if (!isEqual(beforeLayer[prop], afterLayer[prop])) {
                commands.push({ command: operations.setLayerProperty, args: [layerId, prop, afterLayer[prop]] });
            }
        }
        for (prop in afterLayer) {
            if (!afterLayer.hasOwnProperty(prop) || beforeLayer.hasOwnProperty(prop)) { continue; }
            if (prop === 'layout' || prop === 'paint' || prop === 'filter' ||
                prop === 'metadata' || prop === 'minzoom' || prop === 'maxzoom') { continue; }
            if (prop.indexOf('paint.') === 0) {
                diffLayerPropertyChanges(beforeLayer[prop], afterLayer[prop], commands, layerId, prop.slice(6), operations.setPaintProperty);
            } else if (!isEqual(beforeLayer[prop], afterLayer[prop])) {
                commands.push({ command: operations.setLayerProperty, args: [layerId, prop, afterLayer[prop]] });
            }
        }
    }
}

/**
 * Diff two stylesheet
 *
 * Creates semanticly aware diffs that can easily be applied at runtime.
 * Operations produced by the diff closely resemble the mapbox-gl-js API. Any
 * error creating the diff will fall back to the 'setStyle' operation.
 *
 * Example diff:
 * [
 *     { command: 'setConstant', args: ['@water', '#0000FF'] },
 *     { command: 'setPaintProperty', args: ['background', 'background-color', 'black'] }
 * ]
 *
 * @private
 * @param {*} [before] stylesheet to compare from
 * @param {*} after stylesheet to compare to
 * @returns Array list of changes
 */
function diffStyles(before, after) {
    if (!before) { return [{ command: operations.setStyle, args: [after] }]; }

    var commands = [];

    try {
        // Handle changes to top-level properties
        if (!isEqual(before.version, after.version)) {
            return [{ command: operations.setStyle, args: [after] }];
        }
        if (!isEqual(before.center, after.center)) {
            commands.push({ command: operations.setCenter, args: [after.center] });
        }
        if (!isEqual(before.zoom, after.zoom)) {
            commands.push({ command: operations.setZoom, args: [after.zoom] });
        }
        if (!isEqual(before.bearing, after.bearing)) {
            commands.push({ command: operations.setBearing, args: [after.bearing] });
        }
        if (!isEqual(before.pitch, after.pitch)) {
            commands.push({ command: operations.setPitch, args: [after.pitch] });
        }
        if (!isEqual(before.sprite, after.sprite)) {
            commands.push({ command: operations.setSprite, args: [after.sprite] });
        }
        if (!isEqual(before.glyphs, after.glyphs)) {
            commands.push({ command: operations.setGlyphs, args: [after.glyphs] });
        }
        if (!isEqual(before.transition, after.transition)) {
            commands.push({ command: operations.setTransition, args: [after.transition] });
        }
        if (!isEqual(before.light, after.light)) {
            commands.push({ command: operations.setLight, args: [after.light] });
        }

        // Handle changes to `sources`
        // If a source is to be removed, we also--before the removeSource
        // command--need to remove all the style layers that depend on it.
        var sourcesRemoved = {};

        // First collect the {add,remove}Source commands
        var removeOrAddSourceCommands = [];
        diffSources(before.sources, after.sources, removeOrAddSourceCommands, sourcesRemoved);

        // Push a removeLayer command for each style layer that depends on a
        // source that's being removed.
        // Also, exclude any such layers them from the input to `diffLayers`
        // below, so that diffLayers produces the appropriate `addLayers`
        // command
        var beforeLayers = [];
        if (before.layers) {
            before.layers.forEach(function (layer) {
                if (sourcesRemoved[layer.source]) {
                    commands.push({ command: operations.removeLayer, args: [layer.id] });
                } else {
                    beforeLayers.push(layer);
                }
            });
        }
        commands = commands.concat(removeOrAddSourceCommands);

        // Handle changes to `layers`
        diffLayers(beforeLayers, after.layers, commands);

    } catch (e) {
        // fall back to setStyle
        console.warn('Unable to compute style diff:', e);
        commands = [{ command: operations.setStyle, args: [after] }];
    }

    return commands;
}

module.exports = diffStyles;
module.exports.operations = operations;

},{"lodash.isequal":17}],22:[function(require,module,exports){

function ParsingError(error) {
    this.error = error;
    this.message = error.message;
    var match = error.message.match(/line (\d+)/);
    this.line = match ? parseInt(match[1], 10) : 0;
}

module.exports = ParsingError;

},{}],23:[function(require,module,exports){

var format = require('util').format;

function ValidationError(key, value) {
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    this.message = (key ? (key + ": ") : '') + format.apply(format, args);

    if (value !== null && value !== undefined && value.__line__) {
        this.line = value.__line__;
    }
}

module.exports = ValidationError;

},{"util":99}],24:[function(require,module,exports){
//      

var ref = require('./types');
var toString = ref.toString;
var ParsingContext = require('./parsing_context');
var EvaluationContext = require('./evaluation_context');
var assert = require('assert');

                                               
                                    
                                      

                                
                                       
                                                                
                                               
                                                            

var CompoundExpression = function CompoundExpression(name    , type  , evaluate      , args               ) {
    this.name = name;
    this.type = type;
    this._evaluate = evaluate;
    this.args = args;
};

CompoundExpression.prototype.evaluate = function evaluate (ctx               ) {
    return this._evaluate(ctx, this.args);
};

CompoundExpression.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

CompoundExpression.parse = function parse (args          , context            )          {
    var op     = (args[0] );
    var definition = CompoundExpression.definitions[op];
    if (!definition) {
        return context.error(("Unknown expression \"" + op + "\". If you wanted a literal array, use [\"literal\", [...]]."), 0);
    }

    // Now check argument types against each signature
    var type = Array.isArray(definition) ?
        definition[0] : definition.type;

    var availableOverloads = Array.isArray(definition) ?
        [[definition[1], definition[2]]] :
        definition.overloads;

    var overloads = availableOverloads.filter(function (ref) {
            var signature = ref[0];

            return (
        !Array.isArray(signature) || // varags
        signature.length === args.length - 1 // correct param count
    );
        });

    // First parse all the args
    var parsedArgs                = [];
    for (var i = 1; i < args.length; i++) {
        var arg = args[i];
        var expected = (void 0);
        if (overloads.length === 1) {
            var params = overloads[0][0];
            expected = Array.isArray(params) ?
                params[i - 1] :
                params.type;
        }
        var parsed = context.parse(arg, 1 + parsedArgs.length, expected);
        if (!parsed) { return null; }
        parsedArgs.push(parsed);
    }

    var signatureContext             = (null );

    for (var i$2 = 0, list = overloads; i$2 < list.length; i$2 += 1) {
        // Use a fresh context for each attempted signature so that, if
        // we eventually succeed, we haven't polluted `context.errors`.
        var ref = list[i$2];
            var params$1 = ref[0];
            var evaluate = ref[1];

            signatureContext = new ParsingContext(context.definitions, context.path, null, context.scope);

        if (Array.isArray(params$1)) {
            if (params$1.length !== parsedArgs.length) {
                signatureContext.error(("Expected " + (params$1.length) + " arguments, but found " + (parsedArgs.length) + " instead."));
                continue;
            }
        }

        for (var i$1 = 0; i$1 < parsedArgs.length; i$1++) {
            var expected$1 = Array.isArray(params$1) ? params$1[i$1] : params$1.type;
            var arg$1 = parsedArgs[i$1];
            signatureContext.concat(i$1 + 1).checkSubtype(expected$1, arg$1.type);
        }

        if (signatureContext.errors.length === 0) {
            return new CompoundExpression(op, type, evaluate, parsedArgs);
        }
    }

    assert(!signatureContext || signatureContext.errors.length > 0);

    if (overloads.length === 1) {
        context.errors.push.apply(context.errors, signatureContext.errors);
    } else {
        var expected$2 = overloads.length ? overloads : availableOverloads;
        var signatures = expected$2
            .map(function (ref) {
                    var params = ref[0];

                    return stringifySignature(params);
            })
            .join(' | ');
        var actualTypes = parsedArgs
            .map(function (arg) { return toString(arg.type); })
            .join(', ');
        context.error(("Expected arguments of type " + signatures + ", but found (" + actualTypes + ") instead."));
    }

    return null;
};

CompoundExpression.register = function register (
    expressions                             ,
    definitions                          
) {
    assert(!CompoundExpression.definitions);
    CompoundExpression.definitions = definitions;
    for (var name in definitions) {
        expressions[name] = CompoundExpression;
    }
};

function varargs(type      )          {
    return { type: type };
}

function stringifySignature(signature           )         {
    if (Array.isArray(signature)) {
        return ("(" + (signature.map(toString).join(', ')) + ")");
    } else {
        return ("(" + (toString(signature.type)) + "...)");
    }
}

module.exports = {
    CompoundExpression: CompoundExpression,
    varargs: varargs
};

},{"./evaluation_context":39,"./parsing_context":42,"./types":47,"assert":3}],25:[function(require,module,exports){
//      

var ref = require('../types');
var toString = ref.toString;
var array = ref.array;
var ValueType = ref.ValueType;
var StringType = ref.StringType;
var NumberType = ref.NumberType;
var BooleanType = ref.BooleanType;
var checkSubtype = ref.checkSubtype;

var ref$1 = require('../values');
var typeOf = ref$1.typeOf;
var RuntimeError = require('../runtime_error');

                                                
                                                     
                                                           
                                          

var types = {
    string: StringType,
    number: NumberType,
    boolean: BooleanType
};

var ArrayAssertion = function ArrayAssertion(type       , input        ) {
    this.type = type;
    this.input = input;
};

ArrayAssertion.parse = function parse (args          , context            )          {
    if (args.length < 2 || args.length > 4)
        { return context.error(("Expected 1, 2, or 3 arguments, but found " + (args.length - 1) + " instead.")); }

    var itemType;
    var N;
    if (args.length > 2) {
        var type$1 = args[1];
        if (typeof type$1 !== 'string' || !(type$1 in types))
            { return context.error('The item type argument of "array" must be one of string, number, boolean', 1); }
        itemType = types[type$1];
    } else {
        itemType = ValueType;
    }

    if (args.length > 3) {
        if (
            typeof args[2] !== 'number' ||
            args[2] < 0 ||
            args[2] !== Math.floor(args[2])
        ) {
            return context.error('The length argument to "array" must be a positive integer literal', 2);
        }
        N = args[2];
    }

    var type = array(itemType, N);

    var input = context.parse(args[args.length - 1], args.length - 1, ValueType);
    if (!input) { return null; }

    return new ArrayAssertion(type, input);
};

ArrayAssertion.prototype.evaluate = function evaluate (ctx               ) {
    var value = this.input.evaluate(ctx);
    var error = checkSubtype(this.type, typeOf(value));
    if (error) {
        throw new RuntimeError(("Expected value to be of type " + (toString(this.type)) + ", but found " + (toString(typeOf(value))) + " instead."));
    }
    return value;
};

ArrayAssertion.prototype.eachChild = function eachChild (fn                  ) {
    fn(this.input);
};

module.exports = ArrayAssertion;

},{"../runtime_error":44,"../types":47,"../values":48}],26:[function(require,module,exports){
//      

var assert = require('assert');
var ref = require('../types');
var ObjectType = ref.ObjectType;
var ValueType = ref.ValueType;
var StringType = ref.StringType;
var NumberType = ref.NumberType;
var BooleanType = ref.BooleanType;

var RuntimeError = require('../runtime_error');
var ref$1 = require('../types');
var checkSubtype = ref$1.checkSubtype;
var toString = ref$1.toString;
var ref$2 = require('../values');
var typeOf = ref$2.typeOf;

                                                
                                                     
                                                           
                                     

var types = {
    string: StringType,
    number: NumberType,
    boolean: BooleanType,
    object: ObjectType
};

var Assertion = function Assertion(type  , args               ) {
    this.type = type;
    this.args = args;
};

Assertion.parse = function parse (args          , context            )          {
    if (args.length < 2)
        { return context.error("Expected at least one argument."); }

    var name     = (args[0] );
    assert(types[name], name);

    var type = types[name];

    var parsed = [];
    for (var i = 1; i < args.length; i++) {
        var input = context.parse(args[i], i, ValueType);
        if (!input) { return null; }
        parsed.push(input);
    }

    return new Assertion(type, parsed);
};

Assertion.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    for (var i = 0; i < this.args.length; i++) {
        var value = this$1.args[i].evaluate(ctx);
        var error = checkSubtype(this$1.type, typeOf(value));
        if (!error) {
            return value;
        } else if (i === this$1.args.length - 1) {
            throw new RuntimeError(("Expected value to be of type " + (toString(this$1.type)) + ", but found " + (toString(typeOf(value))) + " instead."));
        }
    }

    assert(false);
    return null;
};

Assertion.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

module.exports = Assertion;

},{"../runtime_error":44,"../types":47,"../values":48,"assert":3}],27:[function(require,module,exports){
//      

var ref = require('../types');
var array = ref.array;
var ValueType = ref.ValueType;
var NumberType = ref.NumberType;

var RuntimeError = require('../runtime_error');

                                                
                                                     
                                                           
                                                
                                       

var At = function At(type  , index        , input        ) {
    this.type = type;
    this.index = index;
    this.input = input;
};

At.parse = function parse (args          , context            ) {
    if (args.length !== 3)
        { return context.error(("Expected 2 arguments, but found " + (args.length - 1) + " instead.")); }

    var index = context.parse(args[1], 1, NumberType);
    var input = context.parse(args[2], 2, array(context.expectedType || ValueType));

    if (!index || !input) { return null; }

    var t        = (input.type );
    return new At(t.itemType, index, input);
};

At.prototype.evaluate = function evaluate (ctx               ) {
    var index = ((this.index.evaluate(ctx) )    );
    var array = ((this.input.evaluate(ctx) )          );

    if (index < 0 || index >= array.length) {
        throw new RuntimeError(("Array index out of bounds: " + index + " > " + (array.length) + "."));
    }

    if (index !== Math.floor(index)) {
        throw new RuntimeError(("Array index must be an integer, but found " + index + " instead."));
    }

    return array[index];
};

At.prototype.eachChild = function eachChild (fn                  ) {
    fn(this.index);
    fn(this.input);
};

module.exports = At;

},{"../runtime_error":44,"../types":47}],28:[function(require,module,exports){
//      

var assert = require('assert');
var ref = require('../types');
var BooleanType = ref.BooleanType;

                                                
                                                     
                                                           
                                     

                                                

var Case = function Case(type  , branches      , otherwise        ) {
    this.type = type;
    this.branches = branches;
    this.otherwise = otherwise;
};

Case.parse = function parse (args          , context            ) {
    if (args.length < 4)
        { return context.error(("Expected at least 3 arguments, but found only " + (args.length - 1) + ".")); }
    if (args.length % 2 !== 0)
        { return context.error("Expected an odd number of arguments."); }

    var outputType   ;
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }

    var branches = [];
    for (var i = 1; i < args.length - 1; i += 2) {
        var test = context.parse(args[i], i, BooleanType);
        if (!test) { return null; }

        var result = context.parse(args[i + 1], i + 1, outputType);
        if (!result) { return null; }

        branches.push([test, result]);

        outputType = outputType || result.type;
    }

    var otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
    if (!otherwise) { return null; }

    assert(outputType);
    return new Case((outputType ), branches, otherwise);
};

Case.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    for (var i = 0, list = this$1.branches; i < list.length; i += 1) {
        var ref = list[i];
            var test = ref[0];
            var expression = ref[1];

            if (test.evaluate(ctx)) {
            return expression.evaluate(ctx);
        }
    }
    return this.otherwise.evaluate(ctx);
};

Case.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    for (var i = 0, list = this$1.branches; i < list.length; i += 1) {
        var ref = list[i];
            var test = ref[0];
            var expression = ref[1];

            fn(test);
        fn(expression);
    }
    fn(this.otherwise);
};

module.exports = Case;

},{"../types":47,"assert":3}],29:[function(require,module,exports){
//      

var assert = require('assert');

                                                
                                                     
                                                           
                                     

var Coalesce = function Coalesce(type  , args               ) {
    this.type = type;
    this.args = args;
};

Coalesce.parse = function parse (args          , context            ) {
    if (args.length < 2) {
        return context.error("Expectected at least one argument.");
    }
    var outputType   = (null );
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }
    var parsedArgs = [];
    for (var i = 0, list = args.slice(1); i < list.length; i += 1) {
        var arg = list[i];

            var parsed = context.parse(arg, 1 + parsedArgs.length, outputType);
        if (!parsed) { return null; }
        outputType = outputType || parsed.type;
        parsedArgs.push(parsed);
    }
    assert(outputType);
    return new Coalesce((outputType ), parsedArgs);
};

Coalesce.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    var result = null;
    for (var i = 0, list = this$1.args; i < list.length; i += 1) {
        var arg = list[i];

            result = arg.evaluate(ctx);
        if (result !== null) { break; }
    }
    return result;
};

Coalesce.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

module.exports = Coalesce;

},{"assert":3}],30:[function(require,module,exports){
//      

var assert = require('assert');
var ref = require('../types');
var ColorType = ref.ColorType;
var ValueType = ref.ValueType;
var NumberType = ref.NumberType;

var ref$1 = require('../values');
var Color = ref$1.Color;
var validateRGBA = ref$1.validateRGBA;
var RuntimeError = require('../runtime_error');

                                                
                                                     
                                                           
                                     

var types = {
    'to-number': NumberType,
    'to-color': ColorType
};

/**
 * Special form for error-coalescing coercion expressions "to-number",
 * "to-color".  Since these coercions can fail at runtime, they accept multiple
 * arguments, only evaluating one at a time until one succeeds.
 *
 * @private
 */
var Coercion = function Coercion(type  , args               ) {
    this.type = type;
    this.args = args;
};

Coercion.parse = function parse (args          , context            )          {
    if (args.length < 2)
        { return context.error("Expected at least one argument."); }

    var name     = (args[0] );
    assert(types[name], name);

    var type = types[name];

    var parsed = [];
    for (var i = 1; i < args.length; i++) {
        var input = context.parse(args[i], i, ValueType);
        if (!input) { return null; }
        parsed.push(input);
    }

    return new Coercion(type, parsed);
};

Coercion.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    if (this.type.kind === 'color') {
        var input;
        var error;
        for (var i = 0, list = this$1.args; i < list.length; i += 1) {
            var arg = list[i];

                input = arg.evaluate(ctx);
            error = null;
            if (typeof input === 'string') {
                var c = ctx.parseColor(input);
                if (c) { return c; }
            } else if (Array.isArray(input)) {
                if (input.length < 3 || input.length > 4) {
                    error = "Invalid rbga value " + (JSON.stringify(input)) + ": expected an array containing either three or four numeric values.";
                } else {
                    error = validateRGBA(input[0], input[1], input[2], input[3]);
                }
                if (!error) {
                    return new Color((input[0] ) / 255, (input[1] ) / 255, (input[2] ) / 255, (input[3] ));
                }
            }
        }
        throw new RuntimeError(error || ("Could not parse color from value '" + (typeof input === 'string' ? input : JSON.stringify(input)) + "'"));
    } else {
        var value = null;
        for (var i$1 = 0, list$1 = this$1.args; i$1 < list$1.length; i$1 += 1) {
            var arg$1 = list$1[i$1];

                value = arg$1.evaluate(ctx);
            if (value === null) { continue; }
            var num = Number(value);
            if (isNaN(num)) { continue; }
            return num;
        }
        throw new RuntimeError(("Could not convert " + (JSON.stringify(value)) + " to number."));
    }
};

Coercion.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

module.exports = Coercion;

},{"../runtime_error":44,"../types":47,"../values":48,"assert":3}],31:[function(require,module,exports){
//      

                                                
                                                     
                                     

var Curve = function Curve () {};

Curve.parse = function parse (args          , context            ) {
    var interpolation = args[1];
        var input = args[2];
        var rest = args.slice(3);
    if ((interpolation )[0] === "step") {
        return context.error(("\"curve\" has been replaced by \"step\" and \"interpolate\". Replace this expression with " + (JSON.stringify(["step", input ].concat( rest)))), 0);
    } else {
        return context.error(("\"curve\" has been replaced by \"step\" and \"interpolate\". Replace this expression with " + (JSON.stringify(["interpolate", interpolation, input ].concat( rest)))), 0);
    }
};

Curve.prototype.evaluate = function evaluate () {};
Curve.prototype.eachChild = function eachChild () {};

module.exports = Curve;

},{}],32:[function(require,module,exports){
//      

var ref = require('../types');
var NullType = ref.NullType;
var NumberType = ref.NumberType;
var StringType = ref.StringType;
var BooleanType = ref.BooleanType;
var ColorType = ref.ColorType;
var ObjectType = ref.ObjectType;
var ValueType = ref.ValueType;
var ErrorType = ref.ErrorType;
var array = ref.array;
var toString = ref.toString;

var ref$1 = require('../values');
var typeOf = ref$1.typeOf;
var Color = ref$1.Color;
var validateRGBA = ref$1.validateRGBA;
var ref$2 = require('../compound_expression');
var CompoundExpression = ref$2.CompoundExpression;
var varargs = ref$2.varargs;
var RuntimeError = require('../runtime_error');
var Let = require('./let');
var Var = require('./var');
var Literal = require('./literal');
var Assertion = require('./assertion');
var ArrayAssertion = require('./array');
var Coercion = require('./coercion');
var At = require('./at');
var Match = require('./match');
var Case = require('./case');
var Curve = require('./curve');
var Step = require('./step');
var Interpolate = require('./interpolate');
var Coalesce = require('./coalesce');

                                                

var expressions                                  = {
    // special forms
    'let': Let,
    'var': Var,
    'literal': Literal,
    'string': Assertion,
    'number': Assertion,
    'boolean': Assertion,
    'object': Assertion,
    'array': ArrayAssertion,
    'to-number': Coercion,
    'to-color': Coercion,
    'at': At,
    'case': Case,
    'match': Match,
    'coalesce': Coalesce,
    'curve': Curve,
    'step': Step,
    'interpolate': Interpolate
};

function rgba(ctx, ref) {
    var r = ref[0];
    var g = ref[1];
    var b = ref[2];
    var a = ref[3];

    r = r.evaluate(ctx);
    g = g.evaluate(ctx);
    b = b.evaluate(ctx);
    a = a && a.evaluate(ctx);
    var error = validateRGBA(r, g, b, a);
    if (error) { throw new RuntimeError(error); }
    return new Color(r / 255, g / 255, b / 255, a);
}

function has(key, obj) {
    return key in obj;
}

function get(key, obj) {
    var v = obj[key];
    return typeof v === 'undefined' ? null : v;
}

function length(ctx, ref) {
    var v = ref[0];

    return v.evaluate(ctx).length;
}

function eq(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) === b.evaluate(ctx); }
function ne(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) !== b.evaluate(ctx); }
function lt(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) < b.evaluate(ctx); }
function gt(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) > b.evaluate(ctx); }
function lteq(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) <= b.evaluate(ctx); }
function gteq(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) >= b.evaluate(ctx); }

CompoundExpression.register(expressions, {
    'error': [
        ErrorType,
        [StringType],
        function (ctx, ref) {
        var v = ref[0];
 throw new RuntimeError(v.evaluate(ctx)); }
    ],
    'typeof': [
        StringType,
        [ValueType],
        function (ctx, ref) {
            var v = ref[0];

            return toString(typeOf(v.evaluate(ctx)));
}
    ],
    'to-string': [
        StringType,
        [ValueType],
        function (ctx, ref) {
            var v = ref[0];

            v = v.evaluate(ctx);
            var type = typeof v;
            if (v === null || type === 'string' || type === 'number' || type === 'boolean') {
                return String(v);
            } else if (v instanceof Color) {
                return ("rgba(" + (v.r * 255) + "," + (v.g * 255) + "," + (v.b * 255) + "," + (v.a) + ")");
            } else {
                return JSON.stringify(v);
            }
        }
    ],
    'to-boolean': [
        BooleanType,
        [ValueType],
        function (ctx, ref) {
            var v = ref[0];

            return Boolean(v.evaluate(ctx));
}
    ],
    'to-rgba': [
        array(NumberType, 4),
        [ColorType],
        function (ctx, ref) {
            var v = ref[0];

            var ref$1 = v.evaluate(ctx);
            var r = ref$1.r;
            var g = ref$1.g;
            var b = ref$1.b;
            var a = ref$1.a;
            return [r, g, b, a];
        }
    ],
    'rgb': [
        ColorType,
        [NumberType, NumberType, NumberType],
        rgba
    ],
    'rgba': [
        ColorType,
        [NumberType, NumberType, NumberType, NumberType],
        rgba
    ],
    'length': {
        type: NumberType,
        overloads: [
            [
                [StringType],
                length
            ], [
                [array(ValueType)],
                length
            ]
        ]
    },
    'has': {
        type: BooleanType,
        overloads: [
            [
                [StringType],
                function (ctx, ref) {
                    var key = ref[0];

                    return has(key.evaluate(ctx), ctx.properties());
}
            ], [
                [StringType, ObjectType],
                function (ctx, ref) {
                    var key = ref[0];
                    var obj = ref[1];

                    return has(key.evaluate(ctx), obj.evaluate(ctx));
}
            ]
        ]
    },
    'get': {
        type: ValueType,
        overloads: [
            [
                [StringType],
                function (ctx, ref) {
                    var key = ref[0];

                    return get(key.evaluate(ctx), ctx.properties());
}
            ], [
                [StringType, ObjectType],
                function (ctx, ref) {
                    var key = ref[0];
                    var obj = ref[1];

                    return get(key.evaluate(ctx), obj.evaluate(ctx));
}
            ]
        ]
    },
    'properties': [
        ObjectType,
        [],
        function (ctx) { return ctx.properties(); }
    ],
    'geometry-type': [
        StringType,
        [],
        function (ctx) { return ctx.geometryType(); }
    ],
    'id': [
        ValueType,
        [],
        function (ctx) { return ctx.id(); }
    ],
    'zoom': [
        NumberType,
        [],
        function (ctx) { return ctx.globals.zoom; }
    ],
    'heatmap-density': [
        NumberType,
        [],
        function (ctx) { return ctx.globals.heatmapDensity || 0; }
    ],
    '+': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) {
            var result = 0;
            for (var i = 0, list = args; i < list.length; i += 1) {
                var arg = list[i];

                result += arg.evaluate(ctx);
            }
            return result;
        }
    ],
    '*': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) {
            var result = 1;
            for (var i = 0, list = args; i < list.length; i += 1) {
                var arg = list[i];

                result *= arg.evaluate(ctx);
            }
            return result;
        }
    ],
    '-': {
        type: NumberType,
        overloads: [
            [
                [NumberType, NumberType],
                function (ctx, ref) {
                    var a = ref[0];
                    var b = ref[1];

                    return a.evaluate(ctx) - b.evaluate(ctx);
}
            ], [
                [NumberType],
                function (ctx, ref) {
                    var a = ref[0];

                    return -a.evaluate(ctx);
}
            ]
        ]
    },
    '/': [
        NumberType,
        [NumberType, NumberType],
        function (ctx, ref) {
            var a = ref[0];
            var b = ref[1];

            return a.evaluate(ctx) / b.evaluate(ctx);
}
    ],
    '%': [
        NumberType,
        [NumberType, NumberType],
        function (ctx, ref) {
            var a = ref[0];
            var b = ref[1];

            return a.evaluate(ctx) % b.evaluate(ctx);
}
    ],
    'ln2': [
        NumberType,
        [],
        function () { return Math.LN2; }
    ],
    'pi': [
        NumberType,
        [],
        function () { return Math.PI; }
    ],
    'e': [
        NumberType,
        [],
        function () { return Math.E; }
    ],
    '^': [
        NumberType,
        [NumberType, NumberType],
        function (ctx, ref) {
            var b = ref[0];
            var e = ref[1];

            return Math.pow(b.evaluate(ctx), e.evaluate(ctx));
}
    ],
    'sqrt': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var x = ref[0];

            return Math.sqrt(x.evaluate(ctx));
}
    ],
    'log10': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.log10(n.evaluate(ctx));
}
    ],
    'ln': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.log(n.evaluate(ctx));
}
    ],
    'log2': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.log2(n.evaluate(ctx));
}
    ],
    'sin': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.sin(n.evaluate(ctx));
}
    ],
    'cos': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.cos(n.evaluate(ctx));
}
    ],
    'tan': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.tan(n.evaluate(ctx));
}
    ],
    'asin': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.asin(n.evaluate(ctx));
}
    ],
    'acos': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.acos(n.evaluate(ctx));
}
    ],
    'atan': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.atan(n.evaluate(ctx));
}
    ],
    'min': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) { return Math.min.apply(Math, args.map(function (arg) { return arg.evaluate(ctx); })); }
    ],
    'max': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) { return Math.max.apply(Math, args.map(function (arg) { return arg.evaluate(ctx); })); }
    ],
    '==': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], eq],
            [[StringType, StringType], eq],
            [[BooleanType, BooleanType], eq],
            [[NullType, NullType], eq]
        ]
    },
    '!=': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], ne],
            [[StringType, StringType], ne],
            [[BooleanType, BooleanType], ne],
            [[NullType, NullType], ne]
        ]
    },
    '>': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], gt],
            [[StringType, StringType], gt]
        ]
    },
    '<': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], lt],
            [[StringType, StringType], lt]
        ]
    },
    '>=': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], gteq],
            [[StringType, StringType], gteq]
        ]
    },
    '<=': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], lteq],
            [[StringType, StringType], lteq]
        ]
    },
    'all': {
        type: BooleanType,
        overloads: [
            [
                [BooleanType, BooleanType],
                function (ctx, ref) {
                    var a = ref[0];
                    var b = ref[1];

                    return a.evaluate(ctx) && b.evaluate(ctx);
}
            ],
            [
                varargs(BooleanType),
                function (ctx, args) {
                    for (var i = 0, list = args; i < list.length; i += 1) {
                        var arg = list[i];

                        if (!arg.evaluate(ctx))
                            { return false; }
                    }
                    return true;
                }
            ]
        ]
    },
    'any': {
        type: BooleanType,
        overloads: [
            [
                [BooleanType, BooleanType],
                function (ctx, ref) {
                    var a = ref[0];
                    var b = ref[1];

                    return a.evaluate(ctx) || b.evaluate(ctx);
}
            ],
            [
                varargs(BooleanType),
                function (ctx, args) {
                    for (var i = 0, list = args; i < list.length; i += 1) {
                        var arg = list[i];

                        if (arg.evaluate(ctx))
                            { return true; }
                    }
                    return false;
                }
            ]
        ]
    },
    '!': [
        BooleanType,
        [BooleanType],
        function (ctx, ref) {
            var b = ref[0];

            return !b.evaluate(ctx);
}
    ],
    'upcase': [
        StringType,
        [StringType],
        function (ctx, ref) {
            var s = ref[0];

            return s.evaluate(ctx).toUpperCase();
}
    ],
    'downcase': [
        StringType,
        [StringType],
        function (ctx, ref) {
            var s = ref[0];

            return s.evaluate(ctx).toLowerCase();
}
    ],
    'concat': [
        StringType,
        varargs(StringType),
        function (ctx, args) { return args.map(function (arg) { return arg.evaluate(ctx); }).join(''); }
    ]
});

module.exports = expressions;

},{"../compound_expression":24,"../runtime_error":44,"../types":47,"../values":48,"./array":25,"./assertion":26,"./at":27,"./case":28,"./coalesce":29,"./coercion":30,"./curve":31,"./interpolate":33,"./let":34,"./literal":35,"./match":36,"./step":37,"./var":38}],33:[function(require,module,exports){
//      

var UnitBezier = require('@mapbox/unitbezier');
var interpolate = require('../../util/interpolate');
var ref = require('../types');
var toString = ref.toString;
var NumberType = ref.NumberType;
var ref$1 = require("../stops");
var findStopLessThanOrEqualTo = ref$1.findStopLessThanOrEqualTo;

                                      
                                                
                                                     
                                                           
                                     

                               
                        
                                           
                                                                              

var Interpolate = function Interpolate(type  , interpolation               , input        , stops   ) {
    var this$1 = this;

    this.type = type;
    this.interpolation = interpolation;
    this.input = input;

    this.labels = [];
    this.outputs = [];
    for (var i = 0, list = stops; i < list.length; i += 1) {
        var ref = list[i];
        var label = ref[0];
        var expression = ref[1];

        this$1.labels.push(label);
        this$1.outputs.push(expression);
    }
};

Interpolate.interpolationFactor = function interpolationFactor (interpolation               , input    , lower    , upper    ) {
    var t = 0;
    if (interpolation.name === 'exponential') {
        t = exponentialInterpolation(input, interpolation.base, lower, upper);
    } else if (interpolation.name === 'linear') {
        t = exponentialInterpolation(input, 1, lower, upper);
    } else if (interpolation.name === 'cubic-bezier') {
        var c = interpolation.controlPoints;
        var ub = new UnitBezier(c[0], c[1], c[2], c[3]);
        t = ub.solve(exponentialInterpolation(input, 1, lower, upper));
    }
    return t;
};

Interpolate.parse = function parse (args          , context            ) {
    var interpolation = args[1];
        var input = args[2];
        var rest = args.slice(3);

    if (!Array.isArray(interpolation) || interpolation.length === 0) {
        return context.error("Expected an interpolation type expression.", 1);
    }

    if (interpolation[0] === 'linear') {
        interpolation = { name: 'linear' };
    } else if (interpolation[0] === 'exponential') {
        var base = interpolation[1];
        if (typeof base !== 'number')
            { return context.error("Exponential interpolation requires a numeric base.", 1, 1); }
        interpolation = {
            name: 'exponential',
            base: base
        };
    } else if (interpolation[0] === 'cubic-bezier') {
        var controlPoints = interpolation.slice(1);
        if (
            controlPoints.length !== 4 ||
            controlPoints.some(function (t) { return typeof t !== 'number' || t < 0 || t > 1; })
        ) {
            return context.error('Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.', 1);
        }

        interpolation = {
            name: 'cubic-bezier',
            controlPoints: (controlPoints )
        };
    } else {
        return context.error(("Unknown interpolation type " + (String(interpolation[0]))), 1, 0);
    }

    if (args.length - 1 < 4) {
        return context.error(("Expected at least 4 arguments, but found only " + (args.length - 1) + "."));
    }

    if ((args.length - 1) % 2 !== 0) {
        return context.error("Expected an even number of arguments.");
    }

    input = context.parse(input, 2, NumberType);
    if (!input) { return null; }

    var stops    = [];

    var outputType   = (null );
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }

    for (var i = 0; i < rest.length; i += 2) {
        var label = rest[i];
        var value = rest[i + 1];

        var labelKey = i + 3;
        var valueKey = i + 4;

        if (typeof label !== 'number') {
            return context.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
        }

        if (stops.length && stops[stops.length - 1][0] >= label) {
            return context.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.', labelKey);
        }

        var parsed = context.parse(value, valueKey, outputType);
        if (!parsed) { return null; }
        outputType = outputType || parsed.type;
        stops.push([label, parsed]);
    }

    if (outputType.kind !== 'number' &&
        outputType.kind !== 'color' &&
        !(
            outputType.kind === 'array' &&
            outputType.itemType.kind === 'number' &&
            typeof outputType.N === 'number'
        )
    ) {
        return context.error(("Type " + (toString(outputType)) + " is not interpolatable."));
    }

    return new Interpolate(outputType, interpolation, input, stops);
};

Interpolate.prototype.evaluate = function evaluate (ctx               ) {
    var labels = this.labels;
    var outputs = this.outputs;

    if (labels.length === 1) {
        return outputs[0].evaluate(ctx);
    }

    var value = ((this.input.evaluate(ctx) )    );
    if (value <= labels[0]) {
        return outputs[0].evaluate(ctx);
    }

    var stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
        return outputs[stopCount - 1].evaluate(ctx);
    }

    var index = findStopLessThanOrEqualTo(labels, value);
    var lower = labels[index];
    var upper = labels[index + 1];
    var t = Interpolate.interpolationFactor(this.interpolation, value, lower, upper);

    var outputLower = outputs[index].evaluate(ctx);
    var outputUpper = outputs[index + 1].evaluate(ctx);

    return (interpolate[this.type.kind.toLowerCase()] )(outputLower, outputUpper, t);
};

Interpolate.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    fn(this.input);
    for (var i = 0, list = this$1.outputs; i < list.length; i += 1) {
        var expression = list[i];

            fn(expression);
    }
};

/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 * How it works: Two consecutive stop values define a (scaled and shifted) exponential function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
*/
function exponentialInterpolation(input, base, lowerValue, upperValue) {
    var difference = upperValue - lowerValue;
    var progress = input - lowerValue;

    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}

module.exports = Interpolate;

},{"../../util/interpolate":62,"../stops":46,"../types":47,"@mapbox/unitbezier":2}],34:[function(require,module,exports){
//      

                                     
                                                
                                                     
                                                            

var Let = function Let(bindings                         , result        ) {
    this.type = result.type;
    this.bindings = [].concat(bindings);
    this.result = result;
};

Let.prototype.evaluate = function evaluate (ctx               ) {
    ctx.pushScope(this.bindings);
    var result = this.result.evaluate(ctx);
    ctx.popScope();
    return result;
};

Let.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    for (var i = 0, list = this$1.bindings; i < list.length; i += 1) {
        var binding = list[i];

            fn(binding[1]);
    }
    fn(this.result);
};

Let.parse = function parse (args          , context            ) {
    if (args.length < 4)
        { return context.error(("Expected at least 3 arguments, but found " + (args.length - 1) + " instead.")); }

    var bindings                          = [];
    for (var i = 1; i < args.length - 1; i += 2) {
        var name = args[i];

        if (typeof name !== 'string') {
            return context.error(("Expected string, but found " + (typeof name) + " instead."), i);
        }

        if (/[^a-zA-Z0-9_]/.test(name)) {
            return context.error("Variable names must contain only alphanumeric characters or '_'.", i);
        }

        var value = context.parse(args[i + 1], i + 1);
        if (!value) { return null; }

        bindings.push([name, value]);
    }

    var result = context.parse(args[args.length - 1], args.length - 1, undefined, bindings);
    if (!result) { return null; }

    return new Let(bindings, result);
};

module.exports = Let;

},{}],35:[function(require,module,exports){
//      

var ref = require('../values');
var isValue = ref.isValue;
var typeOf = ref.typeOf;

                                     
                                        
                                                
                                                     

var Literal = function Literal(type  , value   ) {
    this.type = type;
    this.value = value;
};

Literal.parse = function parse (args          , context            ) {
    if (args.length !== 2)
        { return context.error(("'literal' expression requires exactly one argument, but found " + (args.length - 1) + " instead.")); }

    if (!isValue(args[1]))
        { return context.error("invalid value"); }

    var value = (args[1] );
    var type = typeOf(value);

    // special case: infer the item type if possible for zero-length arrays
    var expected = context.expectedType;
    if (
        type.kind === 'array' &&
        type.N === 0 &&
        expected &&
        expected.kind === 'array' &&
        (typeof expected.N !== 'number' || expected.N === 0)
    ) {
        type = expected;
    }

    return new Literal(type, value);
};

Literal.prototype.evaluate = function evaluate () {
    return this.value;
};

Literal.prototype.eachChild = function eachChild () {};

module.exports = Literal;

},{"../values":48}],36:[function(require,module,exports){
//      

var assert = require('assert');
var ref = require('../values');
var typeOf = ref.typeOf;

                                                
                                                     
                                                           
                                     

// Map input label values to output expression index
                                         

var Match = function Match(inputType  , outputType  , input        , cases   , outputs               , otherwise        ) {
    this.inputType = inputType;
    this.type = outputType;
    this.input = input;
    this.cases = cases;
    this.outputs = outputs;
    this.otherwise = otherwise;
};

Match.parse = function parse (args          , context            ) {
    if (args.length < 5)
        { return context.error(("Expected at least 4 arguments, but found only " + (args.length - 1) + ".")); }
    if (args.length % 2 !== 1)
        { return context.error("Expected an even number of arguments."); }

    var inputType;
    var outputType;
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }
    var cases = {};
    var outputs = [];
    for (var i = 2; i < args.length - 1; i += 2) {
        var labels = args[i];
        var value = args[i + 1];

        if (!Array.isArray(labels)) {
            labels = [labels];
        }

        var labelContext = context.concat(i);
        if (labels.length === 0) {
            return labelContext.error('Expected at least one branch label.');
        }

        for (var i$1 = 0, list = labels; i$1 < list.length; i$1 += 1) {
            var label = list[i$1];

                if (typeof label !== 'number' && typeof label !== 'string') {
                return labelContext.error("Branch labels must be numbers or strings.");
            } else if (typeof label === 'number' && Math.abs(label) > Number.MAX_SAFE_INTEGER) {
                return labelContext.error(("Branch labels must be integers no larger than " + (Number.MAX_SAFE_INTEGER) + "."));

            } else if (typeof label === 'number' && Math.floor(label) !== label) {
                return labelContext.error("Numeric branch labels must be integer values.");

            } else if (!inputType) {
                inputType = typeOf(label);
            } else if (labelContext.checkSubtype(inputType, typeOf(label))) {
                return null;
            }

            if (typeof cases[String(label)] !== 'undefined') {
                return labelContext.error('Branch labels must be unique.');
            }

            cases[String(label)] = outputs.length;
        }

        var result = context.parse(value, i, outputType);
        if (!result) { return null; }
        outputType = outputType || result.type;
        outputs.push(result);
    }

    var input = context.parse(args[1], 1, inputType);
    if (!input) { return null; }

    var otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
    if (!otherwise) { return null; }

    assert(inputType && outputType);
    return new Match((inputType ), (outputType ), input, cases, outputs, otherwise);
};

Match.prototype.evaluate = function evaluate (ctx               ) {
    var input = (this.input.evaluate(ctx) );
    return (this.outputs[this.cases[input]] || this.otherwise).evaluate(ctx);
};

Match.prototype.eachChild = function eachChild (fn                  ) {
    fn(this.input);
    this.outputs.forEach(fn);
    fn(this.otherwise);
};

module.exports = Match;

},{"../values":48,"assert":3}],37:[function(require,module,exports){
//      

var ref = require('../types');
var NumberType = ref.NumberType;
var ref$1 = require("../stops");
var findStopLessThanOrEqualTo = ref$1.findStopLessThanOrEqualTo;

                                      
                                                
                                                     
                                                           
                                     

var Step = function Step(type  , input        , stops   ) {
    var this$1 = this;

    this.type = type;
    this.input = input;

    this.labels = [];
    this.outputs = [];
    for (var i = 0, list = stops; i < list.length; i += 1) {
        var ref = list[i];
        var label = ref[0];
        var expression = ref[1];

        this$1.labels.push(label);
        this$1.outputs.push(expression);
    }
};

Step.parse = function parse (args          , context            ) {
    var input = args[1];
        var rest = args.slice(2);

    if (args.length - 1 < 4) {
        return context.error(("Expected at least 4 arguments, but found only " + (args.length - 1) + "."));
    }

    if ((args.length - 1) % 2 !== 0) {
        return context.error("Expected an even number of arguments.");
    }

    input = context.parse(input, 1, NumberType);
    if (!input) { return null; }

    var stops    = [];

    var outputType   = (null );
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }

    rest.unshift(-Infinity);

    for (var i = 0; i < rest.length; i += 2) {
        var label = rest[i];
        var value = rest[i + 1];

        var labelKey = i + 1;
        var valueKey = i + 2;

        if (typeof label !== 'number') {
            return context.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
        }

        if (stops.length && stops[stops.length - 1][0] >= label) {
            return context.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.', labelKey);
        }

        var parsed = context.parse(value, valueKey, outputType);
        if (!parsed) { return null; }
        outputType = outputType || parsed.type;
        stops.push([label, parsed]);
    }

    return new Step(outputType, input, stops);
};

Step.prototype.evaluate = function evaluate (ctx               ) {
    var labels = this.labels;
    var outputs = this.outputs;

    if (labels.length === 1) {
        return outputs[0].evaluate(ctx);
    }

    var value = ((this.input.evaluate(ctx) )    );
    if (value <= labels[0]) {
        return outputs[0].evaluate(ctx);
    }

    var stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
        return outputs[stopCount - 1].evaluate(ctx);
    }

    var index = findStopLessThanOrEqualTo(labels, value);
    return outputs[index].evaluate(ctx);
};

Step.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    fn(this.input);
    for (var i = 0, list = this$1.outputs; i < list.length; i += 1) {
        var expression = list[i];

            fn(expression);
    }
};

module.exports = Step;

},{"../stops":46,"../types":47}],38:[function(require,module,exports){
//      

                                     
                                                
                                                     
                                                            

var Var = function Var(name    , type  ) {
    this.type = type;
    this.name = name;
};

Var.parse = function parse (args          , context            ) {
    if (args.length !== 2 || typeof args[1] !== 'string')
        { return context.error("'var' expression requires exactly one string literal argument."); }

    var name = args[1];
    if (!context.scope.has(name)) {
        return context.error(("Unknown variable \"" + name + "\". Make sure \"" + name + "\" has been bound in an enclosing \"let\" expression before using it."), 1);
    }

    return new Var(name, context.scope.get(name).type);
};

Var.prototype.evaluate = function evaluate (ctx               ) {
    return ctx.scope.get(this.name).evaluate(ctx);
};

Var.prototype.eachChild = function eachChild () {};

module.exports = Var;

},{}],39:[function(require,module,exports){
//      

var assert = require('assert');
var Scope = require('./scope');
var ref = require('./values');
var Color = ref.Color;

                                                         
                                               

var geometryTypes = ['Unknown', 'Point', 'LineString', 'Polygon'];

var EvaluationContext = function EvaluationContext() {
    this.scope = new Scope();
    this._parseColorCache = {};
};

EvaluationContext.prototype.id = function id () {
    return this.feature && 'id' in this.feature ? this.feature.id : null;
};

EvaluationContext.prototype.geometryType = function geometryType () {
    return this.feature ? typeof this.feature.type === 'number' ? geometryTypes[this.feature.type] : this.feature.type : null;
};

EvaluationContext.prototype.properties = function properties () {
    return this.feature && this.feature.properties || {};
};

EvaluationContext.prototype.pushScope = function pushScope (bindings                         ) {
    this.scope = this.scope.concat(bindings);
};

EvaluationContext.prototype.popScope = function popScope () {
    assert(this.scope.parent);
    this.scope = (this.scope.parent );
};

EvaluationContext.prototype.parseColor = function parseColor (input    )     {
    var cached = this._parseColorCache[input];
    if (!cached) {
        cached = this._parseColorCache[input] = Color.parse(input);
    }
    return cached;
};

module.exports = EvaluationContext;

},{"./scope":45,"./values":48,"assert":3}],40:[function(require,module,exports){
//      

var assert = require('assert');
var ParsingError = require('./parsing_error');
var ParsingContext = require('./parsing_context');
var EvaluationContext = require('./evaluation_context');
var ref = require('./compound_expression');
var CompoundExpression = ref.CompoundExpression;
var Step = require('./definitions/step');
var Interpolate = require('./definitions/interpolate');
var Coalesce = require('./definitions/coalesce');
var Let = require('./definitions/let');
var definitions = require('./definitions');
var isConstant = require('./is_constant');
var RuntimeError = require('./runtime_error');
var ref$1 = require('../util/result');
var success = ref$1.success;
var error = ref$1.error;

                                  
                                    
                                             
                                                              
                                           

                       
                                                                                                                          
              
                                
  

                                
                 
                           
  

                               
                                                                    
                      
  

function isExpression(expression       ) {
    return Array.isArray(expression) && expression.length > 0 &&
        typeof expression[0] === 'string' && expression[0] in definitions;
}

/**
 * Parse and typecheck the given style spec JSON expression.  If
 * options.defaultValue is provided, then the resulting StyleExpression's
 * `evaluate()` method will handle errors by logging a warning (once per
 * message) and returning the default value.  Otherwise, it will throw
 * evaluation errors.
 *
 * @private
 */
function createExpression(expression       ,
                          propertySpec                            ,
                          options)                                               {
    if ( options === void 0 ) options                           = {};

    var parser = new ParsingContext(definitions, [], getExpectedType(propertySpec));
    var parsed = parser.parse(expression);
    if (!parsed) {
        assert(parser.errors.length > 0);
        return error(parser.errors);
    }

    var evaluator = new EvaluationContext();

    var evaluate;
    if (options.handleErrors === false) {
        evaluate = function (globals, feature) {
            evaluator.globals = globals;
            evaluator.feature = feature;
            return parsed.evaluate(evaluator);
        };
    } else {
        var warningHistory                           = {};
        var defaultValue = getDefaultValue(propertySpec);
        var enumValues;
        if (propertySpec.type === 'enum') {
            enumValues = propertySpec.values;
        }
        evaluate = function (globals, feature) {
            evaluator.globals = globals;
            evaluator.feature = feature;
            try {
                var val = parsed.evaluate(evaluator);
                if (val === null || val === undefined) {
                    return defaultValue;
                }
                if (enumValues && !(val in enumValues)) {
                    throw new RuntimeError(("Expected value to be one of " + (Object.keys(enumValues).map(function (v) { return JSON.stringify(v); }).join(', ')) + ", but found " + (JSON.stringify(val)) + " instead."));
                }
                return val;
            } catch (e) {
                if (!warningHistory[e.message]) {
                    warningHistory[e.message] = true;
                    if (typeof console !== 'undefined') {
                        console.warn(e.message);
                    }
                }
                return defaultValue;
            }
        };
    }

    return success({ evaluate: evaluate, parsed: parsed });
}

                           
                     
                                                                   
  

                         
                   
                                                                    
  

                         
                   
                                                                    
                                                                                 
                            
  

                            
                      
                                                                    
                                                                                 
                            
  

                                     
                        
                      
                      
                          

function createPropertyExpression(expression       ,
                                  propertySpec                            ,
                                  options)                                                       {
    if ( options === void 0 ) options                           = {};

    expression = createExpression(expression, propertySpec, options);
    if (expression.result === 'error') {
        return expression;
    }

    var ref = expression.value;
    var evaluate = ref.evaluate;
    var parsed = ref.parsed;

    var isFeatureConstant = isConstant.isFeatureConstant(parsed);
    if (!isFeatureConstant && !propertySpec['property-function']) {
        return error([new ParsingError('', 'property expressions not supported')]);
    }

    var isZoomConstant = isConstant.isGlobalPropertyConstant(parsed, ['zoom']);
    if (!isZoomConstant && propertySpec['zoom-function'] === false) {
        return error([new ParsingError('', 'zoom expressions not supported')]);
    }

    var zoomCurve = findZoomCurve(parsed);
    if (!zoomCurve && !isZoomConstant) {
        return error([new ParsingError('', '"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.')]);
    } else if (zoomCurve instanceof ParsingError) {
        return error([zoomCurve]);
    } else if (zoomCurve instanceof Interpolate && propertySpec['function'] === 'piecewise-constant') {
        return error([new ParsingError('', '"interpolate" expressions cannot be used with this property')]);
    }

    if (!zoomCurve) {
        return success(isFeatureConstant ?
            { kind: 'constant', parsed: parsed, evaluate: evaluate } :
            { kind: 'source', parsed: parsed, evaluate: evaluate });
    }

    var interpolationFactor = zoomCurve instanceof Interpolate ?
        Interpolate.interpolationFactor.bind(undefined, zoomCurve.interpolation) :
        function () { return 0; };
    var zoomStops = zoomCurve.labels;

    return success(isFeatureConstant ?
        { kind: 'camera', parsed: parsed, evaluate: evaluate, interpolationFactor: interpolationFactor, zoomStops: zoomStops } :
        { kind: 'composite', parsed: parsed, evaluate: evaluate, interpolationFactor: interpolationFactor, zoomStops: zoomStops });
}

module.exports = {
    isExpression: isExpression,
    createExpression: createExpression,
    createPropertyExpression: createPropertyExpression
};

// Zoom-dependent expressions may only use ["zoom"] as the input to a top-level "step" or "interpolate"
// expression (collectively referred to as a "curve"). The curve may be wrapped in one or more "let" or
// "coalesce" expressions.
function findZoomCurve(expression            )                                           {
    var result = null;
    if (expression instanceof Let) {
        result = findZoomCurve(expression.result);

    } else if (expression instanceof Coalesce) {
        for (var i = 0, list = expression.args; i < list.length; i += 1) {
            var arg = list[i];

          result = findZoomCurve(arg);
            if (result) {
                break;
            }
        }

    } else if ((expression instanceof Step || expression instanceof Interpolate) &&
        expression.input instanceof CompoundExpression &&
        expression.input.name === 'zoom') {

        result = expression;
    }

    if (result instanceof ParsingError) {
        return result;
    }

    expression.eachChild(function (child) {
        var childResult = findZoomCurve(child);
        if (childResult instanceof ParsingError) {
            result = childResult;
        } else if (!result && childResult) {
            result = new ParsingError('', '"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.');
        } else if (result && childResult && result !== childResult) {
            result = new ParsingError('', 'Only one zoom-based "step" or "interpolate" subexpression may be used in an expression.');
        }
    });

    return result;
}

var ref$2 = require('./types');
var ColorType = ref$2.ColorType;
var StringType = ref$2.StringType;
var NumberType = ref$2.NumberType;
var BooleanType = ref$2.BooleanType;
var ValueType = ref$2.ValueType;
var array = ref$2.array;

function getExpectedType(spec                            )              {
    var types = {
        color: ColorType,
        string: StringType,
        number: NumberType,
        enum: StringType,
        boolean: BooleanType
    };

    if (spec.type === 'array') {
        return array(types[spec.value] || ValueType, spec.length);
    }

    return types[spec.type] || null;
}

var ref$3 = require('../function');
var isFunction = ref$3.isFunction;
var ref$4 = require('./values');
var Color = ref$4.Color;

function getDefaultValue(spec                            )        {
    if (spec.type === 'color' && isFunction(spec.default)) {
        // Special case for heatmap-color: it uses the 'default:' to define a
        // default color ramp, but createExpression expects a simple value to fall
        // back to in case of runtime errors
        return new Color(0, 0, 0, 0);
    } else if (spec.type === 'color') {
        return Color.parse(spec.default) || null;
    } else if (spec.default === undefined) {
        return null;
    } else {
        return spec.default;
    }
}

},{"../function":52,"../util/result":63,"./compound_expression":24,"./definitions":32,"./definitions/coalesce":29,"./definitions/interpolate":33,"./definitions/let":34,"./definitions/step":37,"./evaluation_context":39,"./is_constant":41,"./parsing_context":42,"./parsing_error":43,"./runtime_error":44,"./types":47,"./values":48,"assert":3}],41:[function(require,module,exports){
//      

var ref = require('./compound_expression');
var CompoundExpression = ref.CompoundExpression;

                                                  

function isFeatureConstant(e            ) {
    if (e instanceof CompoundExpression) {
        if (e.name === 'get' && e.args.length === 1) {
            return false;
        } else if (e.name === 'has' && e.args.length === 1) {
            return false;
        } else if (
            e.name === 'properties' ||
            e.name === 'geometry-type' ||
            e.name === 'id'
        ) {
            return false;
        }
    }

    var result = true;
    e.eachChild(function (arg) {
        if (result && !isFeatureConstant(arg)) { result = false; }
    });
    return result;
}

function isGlobalPropertyConstant(e            , properties               ) {
    if (e instanceof CompoundExpression && properties.indexOf(e.name) >= 0) { return false; }
    var result = true;
    e.eachChild(function (arg) {
        if (result && !isGlobalPropertyConstant(arg, properties)) { result = false; }
    });
    return result;
}

module.exports = {
    isFeatureConstant: isFeatureConstant,
    isGlobalPropertyConstant: isGlobalPropertyConstant,
};

},{"./compound_expression":24}],42:[function(require,module,exports){
//      

var Scope = require('./scope');
var ref = require('./types');
var checkSubtype = ref.checkSubtype;
var ParsingError = require('./parsing_error');
var Literal = require('./definitions/literal');

                                             
                                  

/**
 * State associated parsing at a given point in an expression tree.
 * @private
 */
var ParsingContext = function ParsingContext(
    definitions   ,
    path,
    expectedType   ,
    scope,
    errors
) {
    if ( path === void 0 ) path            = [];
    if ( scope === void 0 ) scope    = new Scope();
    if ( errors === void 0 ) errors                  = [];

    this.definitions = definitions;
    this.path = path;
    this.key = path.map(function (part) { return ("[" + part + "]"); }).join('');
    this.scope = scope;
    this.errors = errors;
    this.expectedType = expectedType;
};

ParsingContext.prototype.parse = function parse (expr   , index     , expectedType    , bindings                          )          {
    var context = this;
    if (index) {
        context = context.concat(index, expectedType, bindings);
    }

    if (expr === null || typeof expr === 'string' || typeof expr === 'boolean' || typeof expr === 'number') {
        expr = ['literal', expr];
    }

    if (Array.isArray(expr)) {
        if (expr.length === 0) {
            return context.error("Expected an array with at least one element. If you wanted a literal array, use [\"literal\", []].");
        }

        var op = expr[0];
        if (typeof op !== 'string') {
            context.error(("Expression name must be a string, but found " + (typeof op) + " instead. If you wanted a literal array, use [\"literal\", [...]]."), 0);
            return null;
        }

        var Expr = context.definitions[op];
        if (Expr) {
            var parsed = Expr.parse(expr, context);
            if (!parsed) { return null; }
            var expected = context.expectedType;
            var actual = parsed.type;
            if (expected) {
                // When we expect a number, string, or boolean but have a
                // Value, wrap it in a refining assertion, and when we expect
                // a Color but have a String or Value, wrap it in "to-color"
                // coercion.
                var canAssert = expected.kind === 'string' ||
                    expected.kind === 'number' ||
                    expected.kind === 'boolean';

                if (canAssert && actual.kind === 'value') {
                    var Assertion = require('./definitions/assertion');
                    parsed = new Assertion(expected, [parsed]);
                } else if (expected.kind === 'color' && (actual.kind === 'value' || actual.kind === 'string')) {
                    var Coercion = require('./definitions/coercion');
                    parsed = new Coercion(expected, [parsed]);
                }

                if (context.checkSubtype(expected, parsed.type)) {
                    return null;
                }
            }

            // If an expression's arguments are all literals, we can evaluate
            // it immediately and replace it with a literal value in the
            // parsed/compiled result.
            if (!(parsed instanceof Literal) && isConstant(parsed)) {
                var ec = new (require('./evaluation_context'))();
                try {
                    parsed = new Literal(parsed.type, parsed.evaluate(ec));
                } catch (e) {
                    context.error(e.message);
                    return null;
                }
            }

            return parsed;
        }

        return context.error(("Unknown expression \"" + op + "\". If you wanted a literal array, use [\"literal\", [...]]."), 0);
    } else if (typeof expr === 'undefined') {
        return context.error("'undefined' value invalid. Use null instead.");
    } else if (typeof expr === 'object') {
        return context.error("Bare objects invalid. Use [\"literal\", {...}] instead.");
    } else {
        return context.error(("Expected an array, but found " + (typeof expr) + " instead."));
    }
};

/**
 * Returns a copy of this context suitable for parsing the subexpression at
 * index `index`, optionally appending to 'let' binding map.
 *
 * Note that `errors` property, intended for collecting errors while
 * parsing, is copied by reference rather than cloned.
 * @private
 */
ParsingContext.prototype.concat = function concat (index    , expectedType    , bindings                          ) {
    var path = typeof index === 'number' ? this.path.concat(index) : this.path;
    var scope = bindings ? this.scope.concat(bindings) : this.scope;
    return new ParsingContext(
        this.definitions,
        path,
        expectedType || null,
        scope,
        this.errors
    );
};

/**
 * Push a parsing (or type checking) error into the `this.errors`
 * @param error The message
 * @param keys Optionally specify the source of the error at a child
 * of the current expression at `this.key`.
 * @private
 */
ParsingContext.prototype.error = function error (error$1           ) {
        var keys = [], len = arguments.length - 1;
        while ( len-- > 0 ) keys[ len ] = arguments[ len + 1 ];

    var key = "" + (this.key) + (keys.map(function (k) { return ("[" + k + "]"); }).join(''));
    this.errors.push(new ParsingError(key, error$1));
};

/**
 * Returns null if `t` is a subtype of `expected`; otherwise returns an
 * error message and also pushes it to `this.errors`.
 */
ParsingContext.prototype.checkSubtype = function checkSubtype$1 (expected  , t  )      {
    var error = checkSubtype(expected, t);
    if (error) { this.error(error); }
    return error;
};

module.exports = ParsingContext;

function isConstant(expression            ) {
    // requires within function body to workaround circular dependency
    var ref = require('./compound_expression');
    var CompoundExpression = ref.CompoundExpression;
    var ref$1 = require('./is_constant');
    var isGlobalPropertyConstant = ref$1.isGlobalPropertyConstant;
    var isFeatureConstant = ref$1.isFeatureConstant;
    var Var = require('./definitions/var');

    if (expression instanceof Var) {
        return false;
    } else if (expression instanceof CompoundExpression && expression.name === 'error') {
        return false;
    }

    var literalArgs = true;
    expression.eachChild(function (arg) {
        if (!(arg instanceof Literal)) { literalArgs = false; }
    });
    if (!literalArgs) {
        return false;
    }

    return isFeatureConstant(expression) &&
        isGlobalPropertyConstant(expression, ['zoom', 'heatmap-density']);
}

},{"./compound_expression":24,"./definitions/assertion":26,"./definitions/coercion":30,"./definitions/literal":35,"./definitions/var":38,"./evaluation_context":39,"./is_constant":41,"./parsing_error":43,"./scope":45,"./types":47}],43:[function(require,module,exports){
//      

var ParsingError = (function (Error) {
    function ParsingError(key        , message        ) {
        Error.call(this, message);
        this.message = message;
        this.key = key;
    }

    if ( Error ) ParsingError.__proto__ = Error;
    ParsingError.prototype = Object.create( Error && Error.prototype );
    ParsingError.prototype.constructor = ParsingError;

    return ParsingError;
}(Error));

module.exports = ParsingError;

},{}],44:[function(require,module,exports){
//      

var RuntimeError = function RuntimeError(message    ) {
    this.name = 'ExpressionEvaluationError';
    this.message = message;
};

RuntimeError.prototype.toJSON = function toJSON () {
    return this.message;
};

module.exports = RuntimeError;

},{}],45:[function(require,module,exports){
//      

                                             

/**
 * Tracks `let` bindings during expression parsing.
 * @private
 */
var Scope = function Scope(parent    , bindings) {
    var this$1 = this;
    if ( bindings === void 0 ) bindings                          = [];

    this.parent = parent;
    this.bindings = {};
    for (var i = 0, list = bindings; i < list.length; i += 1) {
        var ref = list[i];
        var name = ref[0];
        var expression = ref[1];

        this$1.bindings[name] = expression;
    }
};

Scope.prototype.concat = function concat (bindings                         ) {
    return new Scope(this, bindings);
};

Scope.prototype.get = function get (name    )         {
    if (this.bindings[name]) { return this.bindings[name]; }
    if (this.parent) { return this.parent.get(name); }
    throw new Error((name + " not found in scope."));
};

Scope.prototype.has = function has (name    )      {
    if (this.bindings[name]) { return true; }
    return this.parent ? this.parent.has(name) : false;
};

module.exports = Scope;

},{}],46:[function(require,module,exports){
//      

                                               

                                                

/**
 * Returns the index of the last stop <= input, or 0 if it doesn't exist.
 * @private
 */
function findStopLessThanOrEqualTo(stops               , input        ) {
    var n = stops.length;
    var lowerIndex = 0;
    var upperIndex = n - 1;
    var currentIndex = 0;
    var currentValue, upperValue;

    while (lowerIndex <= upperIndex) {
        currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
        currentValue = stops[currentIndex];
        upperValue = stops[currentIndex + 1];
        if (input === currentValue || input > currentValue && input < upperValue) { // Search complete
            return currentIndex;
        } else if (currentValue < input) {
            lowerIndex = currentIndex + 1;
        } else if (currentValue > input) {
            upperIndex = currentIndex - 1;
        }
    }

    return Math.max(currentIndex - 1, 0);
}

module.exports = {findStopLessThanOrEqualTo: findStopLessThanOrEqualTo};

},{}],47:[function(require,module,exports){
//      

                                         
                                             
                                             
                                               
                                           
                                             
                                           
                                           

                  
               
                 
                 
                  
                
                 
                
                                                           
              

                         
                  
                   
              
 

var NullType = { kind: 'null' };
var NumberType = { kind: 'number' };
var StringType = { kind: 'string' };
var BooleanType = { kind: 'boolean' };
var ColorType = { kind: 'color' };
var ObjectType = { kind: 'object' };
var ValueType = { kind: 'value' };
var ErrorType = { kind: 'error' };

function array(itemType      , N         )            {
    return {
        kind: 'array',
        itemType: itemType,
        N: N
    };
}

function toString(type      )         {
    if (type.kind === 'array') {
        var itemType = toString(type.itemType);
        return typeof type.N === 'number' ?
            ("array<" + itemType + ", " + (type.N) + ">") :
            type.itemType.kind === 'value' ? 'array' : ("array<" + itemType + ">");
    } else {
        return type.kind;
    }
}

var valueMemberTypes = [
    NullType,
    NumberType,
    StringType,
    BooleanType,
    ColorType,
    ObjectType,
    array(ValueType)
];

/**
 * Returns null if `t` is a subtype of `expected`; otherwise returns an
 * error message.
 * @private
 */
function checkSubtype(expected      , t      )          {
    if (t.kind === 'error') {
        // Error is a subtype of every type
        return null;
    } else if (expected.kind === 'array') {
        if (t.kind === 'array' &&
            !checkSubtype(expected.itemType, t.itemType) &&
            (typeof expected.N !== 'number' || expected.N === t.N)) {
            return null;
        }
    } else if (expected.kind === t.kind) {
        return null;
    } else if (expected.kind === 'value') {
        for (var i = 0, list = valueMemberTypes; i < list.length; i += 1) {
            var memberType = list[i];

            if (!checkSubtype(memberType, t)) {
                return null;
            }
        }
    }

    return ("Expected " + (toString(expected)) + " but found " + (toString(t)) + " instead.");
}

module.exports = {
    NullType: NullType,
    NumberType: NumberType,
    StringType: StringType,
    BooleanType: BooleanType,
    ColorType: ColorType,
    ObjectType: ObjectType,
    ValueType: ValueType,
    array: array,
    ErrorType: ErrorType,
    toString: toString,
    checkSubtype: checkSubtype
};

},{}],48:[function(require,module,exports){
//      

var assert = require('assert');
var Color = require('../util/color');

var ref = require('./types');
var NullType = ref.NullType;
var NumberType = ref.NumberType;
var StringType = ref.StringType;
var BooleanType = ref.BooleanType;
var ColorType = ref.ColorType;
var ObjectType = ref.ObjectType;
var ValueType = ref.ValueType;
var array = ref.array;

                                    

function validateRGBA(r       , g       , b       , a        )          {
    if (!(
        typeof r === 'number' && r >= 0 && r <= 255 &&
        typeof g === 'number' && g >= 0 && g <= 255 &&
        typeof b === 'number' && b >= 0 && b <= 255
    )) {
        var value = typeof a === 'number' ? [r, g, b, a] : [r, g, b];
        return ("Invalid rgba value [" + (value.join(', ')) + "]: 'r', 'g', and 'b' must be between 0 and 255.");
    }

    if (!(
        typeof a === 'undefined' || (typeof a === 'number' && a >= 0 && a <= 1)
    )) {
        return ("Invalid rgba value [" + ([r, g, b, a].join(', ')) + "]: 'a' must be between 0 and 1.");
    }

    return null;
}

                                                                                                           

function isValue(mixed       )          {
    if (mixed === null) {
        return true;
    } else if (typeof mixed === 'string') {
        return true;
    } else if (typeof mixed === 'boolean') {
        return true;
    } else if (typeof mixed === 'number') {
        return true;
    } else if (mixed instanceof Color) {
        return true;
    } else if (Array.isArray(mixed)) {
        for (var i = 0, list = mixed; i < list.length; i += 1) {
            var item = list[i];

            if (!isValue(item)) {
                return false;
            }
        }
        return true;
    } else if (typeof mixed === 'object') {
        for (var key in mixed) {
            if (!isValue(mixed[key])) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function typeOf(value       )       {
    if (value === null) {
        return NullType;
    } else if (typeof value === 'string') {
        return StringType;
    } else if (typeof value === 'boolean') {
        return BooleanType;
    } else if (typeof value === 'number') {
        return NumberType;
    } else if (value instanceof Color) {
        return ColorType;
    } else if (Array.isArray(value)) {
        var length = value.length;
        var itemType       ;

        for (var i = 0, list = value; i < list.length; i += 1) {
            var item = list[i];

            var t = typeOf(item);
            if (!itemType) {
                itemType = t;
            } else if (itemType === t) {
                continue;
            } else {
                itemType = ValueType;
                break;
            }
        }

        return array(itemType || ValueType, length);
    } else {
        assert(typeof value === 'object');
        return ObjectType;
    }
}

module.exports = {
    Color: Color,
    validateRGBA: validateRGBA,
    isValue: isValue,
    typeOf: typeOf
};

},{"../util/color":58,"./types":47,"assert":3}],49:[function(require,module,exports){
//      

var ref = require('../expression');
var createExpression = ref.createExpression;

                                                    
                                                                                                        

module.exports = createFilter;
module.exports.isExpressionFilter = isExpressionFilter;

function isExpressionFilter(filter) {
    if (!Array.isArray(filter) || filter.length === 0) {
        return false;
    }
    switch (filter[0]) {
    case 'has':
        return filter.length >= 2 && filter[1] !== '$id' && filter[1] !== '$type';

    case 'in':
    case '!in':
    case '!has':
    case 'none':
        return false;

    case '==':
    case '!=':
    case '>':
    case '>=':
    case '<':
    case '<=':
        return filter.length === 3 && (Array.isArray(filter[1]) || Array.isArray(filter[2]));

    case 'any':
    case 'all':
        for (var i = 0, list = filter.slice(1); i < list.length; i += 1) {
            var f = list[i];

        if (!isExpressionFilter(f) && typeof f !== 'boolean') {
                return false;
            }
        }
        return true;

    default:
        return true;
    }
}

var types = ['Unknown', 'Point', 'LineString', 'Polygon'];

var filterSpec = {
    'type': 'boolean',
    'default': false,
    'function': true,
    'property-function': true,
    'zoom-function': true
};

/**
 * Given a filter expressed as nested arrays, return a new function
 * that evaluates whether a given feature (with a .properties or .tags property)
 * passes its test.
 *
 * @private
 * @param {Array} filter mapbox gl filter
 * @returns {Function} filter-evaluating function
 */
function createFilter(filter     )                {
    if (!filter) {
        return function () { return true; };
    }

    if (!isExpressionFilter(filter)) {
        return (new Function('g', 'f', ("var p = (f && f.properties || {}); return " + (compile(filter))))     );
    }

    var compiled = createExpression(filter, filterSpec);
    if (compiled.result === 'error') {
        throw new Error(compiled.value.map(function (err) { return ((err.key) + ": " + (err.message)); }).join(', '));
    } else {
        return compiled.value.evaluate;
    }
}

function compile(filter) {
    if (!filter) { return 'true'; }
    var op = filter[0];
    if (filter.length <= 1) { return op === 'any' ? 'false' : 'true'; }
    var str =
        op === '==' ? compileComparisonOp(filter[1], filter[2], '===', false) :
        op === '!=' ? compileComparisonOp(filter[1], filter[2], '!==', false) :
        op === '<' ||
        op === '>' ||
        op === '<=' ||
        op === '>=' ? compileComparisonOp(filter[1], filter[2], op, true) :
        op === 'any' ? compileLogicalOp(filter.slice(1), '||') :
        op === 'all' ? compileLogicalOp(filter.slice(1), '&&') :
        op === 'none' ? compileNegation(compileLogicalOp(filter.slice(1), '||')) :
        op === 'in' ? compileInOp(filter[1], filter.slice(2)) :
        op === '!in' ? compileNegation(compileInOp(filter[1], filter.slice(2))) :
        op === 'has' ? compileHasOp(filter[1]) :
        op === '!has' ? compileNegation(compileHasOp(filter[1])) :
        'true';
    return ("(" + str + ")");
}

function compilePropertyReference(property) {
    var ref =
        property === '$type' ? 'f.type' :
        property === '$id' ? 'f.id' : ("p[" + (JSON.stringify(property)) + "]");
    return ref;
}

function compileComparisonOp(property, value, op, checkType) {
    var left = compilePropertyReference(property);
    var right = property === '$type' ? types.indexOf(value) : JSON.stringify(value);
    return (checkType ? ("typeof " + left + "=== typeof " + right + "&&") : '') + left + op + right;
}

function compileLogicalOp(expressions, op) {
    return expressions.map(compile).join(op);
}

function compileInOp(property, values) {
    if (property === '$type') { values = values.map(function (value) {
        return types.indexOf(value);
    }); }
    var left = JSON.stringify(values.sort(compare));
    var right = compilePropertyReference(property);

    if (values.length <= 200) { return (left + ".indexOf(" + right + ") !== -1"); }

    return ("" + ('function(v, a, i, j) {' +
        'while (i <= j) { var m = (i + j) >> 1;' +
        '    if (a[m] === v) return true; if (a[m] > v) j = m - 1; else i = m + 1;' +
        '}' +
    'return false; }(') + right + ", " + left + ",0," + (values.length - 1) + ")");
}

function compileHasOp(property) {
    return property === '$id' ? '"id" in f' : ((JSON.stringify(property)) + " in p");
}

function compileNegation(expression) {
    return ("!(" + expression + ")");
}

// Comparison function to sort numbers and strings
function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

},{"../expression":40}],50:[function(require,module,exports){

var reference = require('./reference/latest.js');
var sortObject = require('sort-object');

function sameOrderAs(reference) {
    var keyOrder = {};

    Object.keys(reference).forEach(function (k, i) {
        keyOrder[k] = i + 1;
    });

    return {
        sort: function (a, b) {
            return (keyOrder[a] || Infinity) -
                   (keyOrder[b] || Infinity);
        }
    };
}

/**
 * Format a Mapbox GL Style.  Returns a stringified style with its keys
 * sorted in the same order as the reference style.
 *
 * The optional `space` argument is passed to
 * [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
 * to generate formatted output.
 *
 * If `space` is unspecified, a default of `2` spaces will be used.
 *
 * @private
 * @param {Object} style a Mapbox GL Style
 * @param {number} [space] space argument to pass to `JSON.stringify`
 * @returns {string} stringified formatted JSON
 * @example
 * var fs = require('fs');
 * var format = require('mapbox-gl-style-spec').format;
 * var style = fs.readFileSync('./source.json', 'utf8');
 * fs.writeFileSync('./dest.json', format(style));
 * fs.writeFileSync('./dest.min.json', format(style, 0));
 */
function format(style, space) {
    if (space === undefined) { space = 2; }
    style = sortObject(style, sameOrderAs(reference.$root));

    if (style.layers) {
        style.layers = style.layers.map(function (layer) {
            return sortObject(layer, sameOrderAs(reference.layer));
        });
    }

    return JSON.stringify(style, null, space);
}

module.exports = format;

},{"./reference/latest.js":55,"sort-object":94}],51:[function(require,module,exports){
var assert = require('assert');
var extend = require('../util/extend');

module.exports = convertFunction;

function convertFunction(parameters, propertySpec, name) {
    var expression;

    parameters = extend({}, parameters);
    var defaultExpression;
    if (typeof parameters.default !== 'undefined') {
        defaultExpression = convertValue(parameters.default, propertySpec);
    } else {
        defaultExpression = convertValue(propertySpec.default, propertySpec);
        if (defaultExpression === null) {
            defaultExpression = ['error', 'No default property value available.'];
        }
    }

    if (parameters.stops) {
        var zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
        var featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
        var zoomDependent = zoomAndFeatureDependent || !featureDependent;

        var stops = parameters.stops.map(function (stop) {
            if (!featureDependent && (name === 'icon-image' || name === 'text-field') && typeof stop[1] === 'string') {
                return [stop[0], convertTokenString(stop[1])];

            }
            return [stop[0], convertValue(stop[1], propertySpec)];
        });

        if (parameters.colorSpace && parameters.colorSpace !== 'rgb') {
            throw new Error('Unimplemented');
        }

        if (zoomAndFeatureDependent) {
            expression = convertZoomAndPropertyFunction(parameters, propertySpec, stops, defaultExpression);
        } else if (zoomDependent) {
            expression = convertZoomFunction(parameters, propertySpec, stops);
        } else {
            expression = convertPropertyFunction(parameters, propertySpec, stops, defaultExpression);
        }
    } else {
        // identity function
        expression = convertIdentityFunction(parameters, propertySpec, defaultExpression);
    }

    return expression;
}

function convertIdentityFunction(parameters, propertySpec, defaultExpression) {
    var get = ['get', parameters.property];
    var type = propertySpec.type;

    if (type === 'color') {
        return parameters.default === undefined ? get : ['to-color', get, parameters.default];
    } else if (type === 'array' && typeof propertySpec.length === 'number') {
        return ['array', propertySpec.value, propertySpec.length, get];
    } else if (type === 'array') {
        return ['array', propertySpec.value, get];
    } else if (type === 'enum') {
        return [
            'let',
            'property_value', ['string', get],
            [
                'match',
                ['var', 'property_value'],
                Object.keys(propertySpec.values), ['var', 'property_value'],
                defaultExpression
            ]
        ];
    } else {
        return parameters.default === undefined ? get : [propertySpec.type, get, parameters.default];
    }
}

function convertValue(value, spec) {
    if (typeof value === 'undefined' || value === null) { return null; }
    if (spec.type === 'color') {
        return value;
    } else if (spec.type === 'array') {
        return ['literal', value];
    } else {
        return value;
    }
}

function convertZoomAndPropertyFunction(parameters, propertySpec, stops, defaultExpression) {
    var featureFunctionParameters = {};
    var featureFunctionStops = {};
    var zoomStops = [];
    for (var s = 0; s < stops.length; s++) {
        var stop = stops[s];
        var zoom = stop[0].zoom;
        if (featureFunctionParameters[zoom] === undefined) {
            featureFunctionParameters[zoom] = {
                zoom: zoom,
                type: parameters.type,
                property: parameters.property,
                default: parameters.default,
            };
            featureFunctionStops[zoom] = [];
            zoomStops.push(zoom);
        }
        featureFunctionStops[zoom].push([stop[0].value, stop[1]]);
    }

    // the interpolation type for the zoom dimension of a zoom-and-property
    // function is determined directly from the style property specification
    // for which it's being used: linear for interpolatable properties, step
    // otherwise.
    var functionType = getFunctionType({}, propertySpec);
    if (functionType === 'exponential') {
        var expression = ['interpolate', ['linear'], ['zoom']];

        for (var i = 0, list = zoomStops; i < list.length; i += 1) {
            var z = list[i];

            var output = convertPropertyFunction(featureFunctionParameters[z], propertySpec, featureFunctionStops[z], defaultExpression);
            appendStopPair(expression, z, output, false);
        }

        return expression;
    } else {
        var expression$1 = ['step', ['zoom']];

        for (var i$1 = 0, list$1 = zoomStops; i$1 < list$1.length; i$1 += 1) {
            var z$1 = list$1[i$1];

            var output$1 = convertPropertyFunction(featureFunctionParameters[z$1], propertySpec, featureFunctionStops[z$1], defaultExpression);
            appendStopPair(expression$1, z$1, output$1, true);
        }

        fixupDegenerateStepCurve(expression$1);

        return expression$1;
    }
}

function convertPropertyFunction(parameters, propertySpec, stops, defaultExpression) {
    var type = getFunctionType(parameters, propertySpec);

    var inputType = typeof stops[0][0];
    assert(
        inputType === 'string' ||
        inputType === 'number' ||
        inputType === 'boolean'
    );

    var input = [inputType, ['get', parameters.property]];

    var expression;
    var isStep = false;
    if (type === 'categorical' && inputType === 'boolean') {
        assert(parameters.stops.length > 0 && parameters.stops.length <= 2);
        if (parameters.stops[0][0] === false) {
            input = ['!', input];
        }
        expression = [ 'case', input, parameters.stops[0][1] ];
        if (parameters.stops.length > 1) {
            expression.push(parameters.stops[1][1]);
        } else {
            expression.push(defaultExpression);
        }
        return expression;
    } else if (type === 'categorical') {
        expression = ['match', input];
    } else if (type === 'interval') {
        expression = ['step', input];
        isStep = true;
    } else if (type === 'exponential') {
        var base = parameters.base !== undefined ? parameters.base : 1;
        expression = ['interpolate', ['exponential', base], input];
    } else {
        throw new Error(("Unknown property function type " + type));
    }

    for (var i = 0, list = stops; i < list.length; i += 1) {
        var stop = list[i];

        appendStopPair(expression, stop[0], stop[1], isStep);
    }

    if (expression[0] === 'match') {
        expression.push(defaultExpression);
    }

    fixupDegenerateStepCurve(expression);

    return expression;
}

function convertZoomFunction(parameters, propertySpec, stops, input) {
    if ( input === void 0 ) input = ['zoom'];

    var type = getFunctionType(parameters, propertySpec);
    var expression;
    var isStep = false;
    if (type === 'interval') {
        expression = ['step', input];
        isStep = true;
    } else if (type === 'exponential') {
        var base = parameters.base !== undefined ? parameters.base : 1;
        expression = ['interpolate', ['exponential', base], input];
    } else {
        throw new Error(("Unknown zoom function type \"" + type + "\""));
    }

    for (var i = 0, list = stops; i < list.length; i += 1) {
        var stop = list[i];

        appendStopPair(expression, stop[0], stop[1], isStep);
    }

    fixupDegenerateStepCurve(expression);

    return expression;
}

function fixupDegenerateStepCurve(expression) {
    // degenerate step curve (i.e. a constant function): add a noop stop
    if (expression[0] === 'step' && expression.length === 3) {
        expression.push(0);
        expression.push(expression[3]);
    }
}

function appendStopPair(curve, input, output, isStep) {
    // Skip duplicate stop values. They were not validated for functions, but they are for expressions.
    // https://github.com/mapbox/mapbox-gl-js/issues/4107
    if (curve.length > 3 && input === curve[curve.length - 2]) {
        return;
    }
    // step curves don't get the first input value, as it is redundant.
    if (!(isStep && curve.length === 2)) {
        curve.push(input);
    }
    curve.push(output);
}

function getFunctionType(parameters, propertySpec) {
    if (parameters.type) {
        return parameters.type;
    } else if (propertySpec.function) {
        return propertySpec.function === 'interpolated' ? 'exponential' : 'interval';
    } else {
        return 'exponential';
    }
}

// "String with {name} token" => ["concat", "String with ", ["get", "name"], " token"]
function convertTokenString(s) {
    var result = ['concat'];
    var re = /{([^{}]+)}/g;
    var pos = 0;
    var match;
    while ((match = re.exec(s)) !== null) {
        var literal = s.slice(pos, re.lastIndex - match[0].length);
        pos = re.lastIndex;
        if (literal.length > 0) { result.push(literal); }
        result.push(['to-string', ['get', match[1]]]);
    }

    if (result.length === 1) {
        return s;
    }

    if (pos < s.length) {
        result.push(s.slice(pos));
    }

    return result;
}

},{"../util/extend":60,"assert":3}],52:[function(require,module,exports){

var colorSpaces = require('../util/color_spaces');
var Color = require('../util/color');
var extend = require('../util/extend');
var getType = require('../util/get_type');
var interpolate = require('../util/interpolate');
var Interpolate = require('../expression/definitions/interpolate');

function isFunction(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function identityFunction(x) {
    return x;
}

function createFunction(parameters, propertySpec) {
    var isColor = propertySpec.type === 'color';
    var zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
    var featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
    var zoomDependent = zoomAndFeatureDependent || !featureDependent;
    var type = parameters.type || (propertySpec.function === 'interpolated' ? 'exponential' : 'interval');

    if (isColor) {
        parameters = extend({}, parameters);

        if (parameters.stops) {
            parameters.stops = parameters.stops.map(function (stop) {
                return [stop[0], Color.parse(stop[1])];
            });
        }

        if (parameters.default) {
            parameters.default = Color.parse(parameters.default);
        } else {
            parameters.default = Color.parse(propertySpec.default);
        }
    }

    var innerFun;
    var hashedStops;
    var categoricalKeyType;
    if (type === 'exponential') {
        innerFun = evaluateExponentialFunction;
    } else if (type === 'interval') {
        innerFun = evaluateIntervalFunction;
    } else if (type === 'categorical') {
        innerFun = evaluateCategoricalFunction;

        // For categorical functions, generate an Object as a hashmap of the stops for fast searching
        hashedStops = Object.create(null);
        for (var i = 0, list = parameters.stops; i < list.length; i += 1) {
            var stop = list[i];

            hashedStops[stop[0]] = stop[1];
        }

        // Infer key type based on first stop key-- used to encforce strict type checking later
        categoricalKeyType = typeof parameters.stops[0][0];

    } else if (type === 'identity') {
        innerFun = evaluateIdentityFunction;
    } else {
        throw new Error(("Unknown function type \"" + type + "\""));
    }

    var outputFunction;

    // If we're interpolating colors in a color system other than RGBA,
    // first translate all stop values to that color system, then interpolate
    // arrays as usual. The `outputFunction` option lets us then translate
    // the result of that interpolation back into RGBA.
    if (parameters.colorSpace && parameters.colorSpace !== 'rgb') {
        if (colorSpaces[parameters.colorSpace]) {
            var colorspace = colorSpaces[parameters.colorSpace];
            // Avoid mutating the parameters value
            parameters = JSON.parse(JSON.stringify(parameters));
            for (var s = 0; s < parameters.stops.length; s++) {
                parameters.stops[s] = [
                    parameters.stops[s][0],
                    colorspace.forward(parameters.stops[s][1])
                ];
            }
            outputFunction = colorspace.reverse;
        } else {
            throw new Error(("Unknown color space: " + (parameters.colorSpace)));
        }
    } else {
        outputFunction = identityFunction;
    }

    if (zoomAndFeatureDependent) {
        var featureFunctions = {};
        var zoomStops = [];
        for (var s$1 = 0; s$1 < parameters.stops.length; s$1++) {
            var stop$1 = parameters.stops[s$1];
            var zoom = stop$1[0].zoom;
            if (featureFunctions[zoom] === undefined) {
                featureFunctions[zoom] = {
                    zoom: zoom,
                    type: parameters.type,
                    property: parameters.property,
                    default: parameters.default,
                    stops: []
                };
                zoomStops.push(zoom);
            }
            featureFunctions[zoom].stops.push([stop$1[0].value, stop$1[1]]);
        }

        var featureFunctionStops = [];
        for (var i$1 = 0, list$1 = zoomStops; i$1 < list$1.length; i$1 += 1) {
            var z = list$1[i$1];

            featureFunctionStops.push([featureFunctions[z].zoom, createFunction(featureFunctions[z], propertySpec)]);
        }

        return {
            kind: 'composite',
            interpolationFactor: Interpolate.interpolationFactor.bind(undefined, {name: 'linear'}),
            zoomStops: featureFunctionStops.map(function (s) { return s[0]; }),
            evaluate: function evaluate(ref, properties) {
                var zoom = ref.zoom;

                return outputFunction(evaluateExponentialFunction({
                    stops: featureFunctionStops,
                    base: parameters.base
                }, propertySpec, zoom).evaluate(zoom, properties));
            }
        };
    } else if (zoomDependent) {
        return {
            kind: 'camera',
            interpolationFactor: type === 'exponential' ?
                Interpolate.interpolationFactor.bind(undefined, {name: 'exponential', base: parameters.base !== undefined ? parameters.base : 1}) :
                function () { return 0; },
            zoomStops: parameters.stops.map(function (s) { return s[0]; }),
            evaluate: function (ref) {
                var zoom = ref.zoom;

                return outputFunction(innerFun(parameters, propertySpec, zoom, hashedStops, categoricalKeyType));
        }
        };
    } else {
        return {
            kind: 'source',
            evaluate: function evaluate(_, feature) {
                var value = feature && feature.properties ? feature.properties[parameters.property] : undefined;
                if (value === undefined) {
                    return coalesce(parameters.default, propertySpec.default);
                }
                return outputFunction(innerFun(parameters, propertySpec, value, hashedStops, categoricalKeyType));
            }
        };
    }
}

function coalesce(a, b, c) {
    if (a !== undefined) { return a; }
    if (b !== undefined) { return b; }
    if (c !== undefined) { return c; }
}

function evaluateCategoricalFunction(parameters, propertySpec, input, hashedStops, keyType) {
    var evaluated = typeof input === keyType ? hashedStops[input] : undefined; // Enforce strict typing on input
    return coalesce(evaluated, parameters.default, propertySpec.default);
}

function evaluateIntervalFunction(parameters, propertySpec, input) {
    // Edge cases
    if (getType(input) !== 'number') { return coalesce(parameters.default, propertySpec.default); }
    var n = parameters.stops.length;
    if (n === 1) { return parameters.stops[0][1]; }
    if (input <= parameters.stops[0][0]) { return parameters.stops[0][1]; }
    if (input >= parameters.stops[n - 1][0]) { return parameters.stops[n - 1][1]; }

    var index = findStopLessThanOrEqualTo(parameters.stops, input);

    return parameters.stops[index][1];
}

function evaluateExponentialFunction(parameters, propertySpec, input) {
    var base = parameters.base !== undefined ? parameters.base : 1;

    // Edge cases
    if (getType(input) !== 'number') { return coalesce(parameters.default, propertySpec.default); }
    var n = parameters.stops.length;
    if (n === 1) { return parameters.stops[0][1]; }
    if (input <= parameters.stops[0][0]) { return parameters.stops[0][1]; }
    if (input >= parameters.stops[n - 1][0]) { return parameters.stops[n - 1][1]; }

    var index = findStopLessThanOrEqualTo(parameters.stops, input);
    var t = interpolationFactor(
        input, base,
        parameters.stops[index][0],
        parameters.stops[index + 1][0]);

    var outputLower = parameters.stops[index][1];
    var outputUpper = parameters.stops[index + 1][1];
    var interp = interpolate[propertySpec.type] || identityFunction;

    if (typeof outputLower.evaluate === 'function') {
        return {
            evaluate: function evaluate() {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                var evaluatedLower = outputLower.evaluate.apply(undefined, args);
                var evaluatedUpper = outputUpper.evaluate.apply(undefined, args);
                // Special case for fill-outline-color, which has no spec default.
                if (evaluatedLower === undefined || evaluatedUpper === undefined) {
                    return undefined;
                }
                return interp(evaluatedLower, evaluatedUpper, t);
            }
        };
    }

    return interp(outputLower, outputUpper, t);
}

function evaluateIdentityFunction(parameters, propertySpec, input) {
    if (propertySpec.type === 'color') {
        input = Color.parse(input);
    } else if (getType(input) !== propertySpec.type && (propertySpec.type !== 'enum' || !propertySpec.values[input])) {
        input = undefined;
    }
    return coalesce(input, parameters.default, propertySpec.default);
}

/**
 * Returns the index of the last stop <= input, or 0 if it doesn't exist.
 *
 * @private
 */
function findStopLessThanOrEqualTo(stops, input) {
    var n = stops.length;
    var lowerIndex = 0;
    var upperIndex = n - 1;
    var currentIndex = 0;
    var currentValue, upperValue;

    while (lowerIndex <= upperIndex) {
        currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
        currentValue = stops[currentIndex][0];
        upperValue = stops[currentIndex + 1][0];
        if (input === currentValue || input > currentValue && input < upperValue) { // Search complete
            return currentIndex;
        } else if (currentValue < input) {
            lowerIndex = currentIndex + 1;
        } else if (currentValue > input) {
            upperIndex = currentIndex - 1;
        }
    }

    return Math.max(currentIndex - 1, 0);
}

/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 *
 * How it works:
 * Two consecutive stop values define a (scaled and shifted) exponential
 * function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
 */
function interpolationFactor(input, base, lowerValue, upperValue) {
    var difference = upperValue - lowerValue;
    var progress = input - lowerValue;

    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}

module.exports = {
    createFunction: createFunction,
    isFunction: isFunction
};

},{"../expression/definitions/interpolate":33,"../util/color":58,"../util/color_spaces":59,"../util/extend":60,"../util/get_type":61,"../util/interpolate":62}],53:[function(require,module,exports){

/**
 * Migrate a Mapbox GL Style to the latest version.
 *
 * @private
 * @alias migrate
 * @param {object} style a Mapbox GL Style
 * @returns {Object} a migrated style
 * @example
 * var fs = require('fs');
 * var migrate = require('mapbox-gl-style-spec').migrate;
 * var style = fs.readFileSync('./style.json', 'utf8');
 * fs.writeFileSync('./style.json', JSON.stringify(migrate(style)));
 */
module.exports = function(style) {
    var migrated = false;

    if (style.version === 7 || style.version === 8) {
        style = require('./migrate/v8')(style);
        migrated = true;
    }

    if (!migrated) {
        throw new Error('cannot migrate from', style.version);
    }

    return style;
};

},{"./migrate/v8":54}],54:[function(require,module,exports){

var Reference = require('../reference/v8.json');
var URL = require('url');

function getPropertyReference(propertyName) {
    for (var i = 0; i < Reference.layout.length; i++) {
        for (var key in Reference[Reference.layout[i]]) {
            if (key === propertyName) { return Reference[Reference.layout[i]][key]; }
        }
    }
    for (var i$1 = 0; i$1 < Reference.paint.length; i$1++) {
        for (var key$1 in Reference[Reference.paint[i$1]]) {
            if (key$1 === propertyName) { return Reference[Reference.paint[i$1]][key$1]; }
        }
    }
}

function eachSource(style, callback) {
    for (var k in style.sources) {
        callback(style.sources[k]);
    }
}

function eachLayer(style, callback) {
    for (var k in style.layers) {
        callback(style.layers[k]);
        eachLayer(style.layers[k], callback);
    }
}

function eachLayout(layer, callback) {
    for (var k in layer) {
        if (k.indexOf('layout') === 0) {
            callback(layer[k], k);
        }
    }
}

function eachPaint(layer, callback) {
    for (var k in layer) {
        if (k.indexOf('paint') === 0) {
            callback(layer[k], k);
        }
    }
}

function resolveConstant(style, value) {
    if (typeof value === 'string' && value[0] === '@') {
        return resolveConstant(style, style.constants[value]);
    } else {
        return value;
    }
}

function eachProperty(style, options, callback) {
    if (arguments.length === 2) {
        callback = options;
        options = {};
    }

    options.layout = options.layout === undefined ? true : options.layout;
    options.paint = options.paint === undefined ? true : options.paint;

    function inner(layer, properties) {
        Object.keys(properties).forEach(function (key) {
            callback({
                key: key,
                value: properties[key],
                reference: getPropertyReference(key),
                set: function(x) {
                    properties[key] = x;
                }
            });
        });
    }

    eachLayer(style, function (layer) {
        if (options.paint) {
            eachPaint(layer, function (paint) {
                inner(layer, paint);
            });
        }
        if (options.layout) {
            eachLayout(layer, function (layout) {
                inner(layer, layout);
            });
        }
    });
}

function isFunction(value) {
    return Array.isArray(value.stops);
}

function renameProperty(obj, from, to) {
    obj[to] = obj[from]; delete obj[from];
}

module.exports = function(style) {
    style.version = 8;

    // Rename properties, reverse coordinates in source and layers
    eachSource(style, function (source) {
        if (source.type === 'video' && source.url !== undefined) {
            renameProperty(source, 'url', 'urls');
        }
        if (source.type === 'video') {
            source.coordinates.forEach(function (coord) {
                return coord.reverse();
            });
        }
    });

    eachLayer(style, function (layer) {
        eachLayout(layer, function (layout) {
            if (layout['symbol-min-distance'] !== undefined) {
                renameProperty(layout, 'symbol-min-distance', 'symbol-spacing');
            }
        });

        eachPaint(layer, function (paint) {
            if (paint['background-image'] !== undefined) {
                renameProperty(paint, 'background-image', 'background-pattern');
            }
            if (paint['line-image'] !== undefined) {
                renameProperty(paint, 'line-image', 'line-pattern');
            }
            if (paint['fill-image'] !== undefined) {
                renameProperty(paint, 'fill-image', 'fill-pattern');
            }
        });
    });

    // Inline Constants
    eachProperty(style, function (property) {
        var value = resolveConstant(style, property.value);

        if (isFunction(value)) {
            value.stops.forEach(function (stop) {
                stop[1] = resolveConstant(style, stop[1]);
            });
        }

        property.set(value);
    });
    delete style.constants;

    eachLayer(style, function (layer) {
        // get rid of text-max-size, icon-max-size
        // turn text-size, icon-size into layout properties
        // https://github.com/mapbox/mapbox-gl-style-spec/issues/255

        eachLayout(layer, function (layout) {
            delete layout['text-max-size'];
            delete layout['icon-max-size'];
        });

        eachPaint(layer, function (paint) {
            if (paint['text-size']) {
                if (!layer.layout) { layer.layout = {}; }
                layer.layout['text-size'] = paint['text-size'];
                delete paint['text-size'];
            }

            if (paint['icon-size']) {
                if (!layer.layout) { layer.layout = {}; }
                layer.layout['icon-size'] = paint['icon-size'];
                delete paint['icon-size'];
            }
        });
    });

    function migrateFontstackURL(input) {
        var inputParsed = URL.parse(input);
        var inputPathnameParts = inputParsed.pathname.split('/');

        if (inputParsed.protocol !== 'mapbox:') {
            return input;

        } else if (inputParsed.hostname === 'fontstack') {
            assert(decodeURI(inputParsed.pathname) === '/{fontstack}/{range}.pbf');
            return 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf';

        } else if (inputParsed.hostname === 'fonts') {
            assert(inputPathnameParts[1] === 'v1');
            assert(decodeURI(inputPathnameParts[3]) === '{fontstack}');
            assert(decodeURI(inputPathnameParts[4]) === '{range}.pbf');
            return ("mapbox://fonts/" + (inputPathnameParts[2]) + "/{fontstack}/{range}.pbf");

        } else {
            assert(false);
        }

        function assert(predicate) {
            if (!predicate) {
                throw new Error(("Invalid font url: \"" + input + "\""));
            }
        }
    }

    if (style.glyphs) {
        style.glyphs = migrateFontstackURL(style.glyphs);
    }

    function migrateFontStack(font) {
        function splitAndTrim(string) {
            return string.split(',').map(function (s) {
                return s.trim();
            });
        }

        if (Array.isArray(font)) {
            // Assume it's a previously migrated font-array.
            return font;

        } else if (typeof font === 'string') {
            return splitAndTrim(font);

        } else if (typeof font === 'object') {
            font.stops.forEach(function (stop) {
                stop[1] = splitAndTrim(stop[1]);
            });
            return font;

        } else {
            throw new Error("unexpected font value");
        }
    }

    eachLayer(style, function (layer) {
        eachLayout(layer, function (layout) {
            if (layout['text-font']) {
                layout['text-font'] = migrateFontStack(layout['text-font']);
            }
        });
    });

    // Reverse order of symbol layers. This is an imperfect migration.
    //
    // The order of a symbol layer in the layers list affects two things:
    // - how it is drawn relative to other layers (like oneway arrows below bridges)
    // - the placement priority compared to other layers
    //
    // It's impossible to reverse the placement priority without breaking the draw order
    // in some cases. This migration only reverses the order of symbol layers that
    // are above all other types of layers.
    //
    // Symbol layers that are at the top of the map preserve their priority.
    // Symbol layers that are below another type (line, fill) of layer preserve their draw order.

    var firstSymbolLayer = 0;
    for (var i = style.layers.length - 1; i >= 0; i--) {
        var layer = style.layers[i];
        if (layer.type !== 'symbol') {
            firstSymbolLayer = i + 1;
            break;
        }
    }

    var symbolLayers = style.layers.splice(firstSymbolLayer);
    symbolLayers.reverse();
    style.layers = style.layers.concat(symbolLayers);

    return style;
};

},{"../reference/v8.json":56,"url":95}],55:[function(require,module,exports){

module.exports = require('./v8.json');

},{"./v8.json":56}],56:[function(require,module,exports){
module.exports={
  "$version": 8,
  "$root": {
    "version": {
      "required": true,
      "type": "enum",
      "values": [8],
      "doc": "Style specification version number. Must be 8.",
      "example": 8
    },
    "name": {
      "type": "string",
      "doc": "A human-readable name for the style.",
      "example": "Bright"
    },
    "metadata": {
      "type": "*",
      "doc": "Arbitrary properties useful to track with the stylesheet, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'."
    },
    "center": {
      "type": "array",
      "value": "number",
      "doc": "Default map center in longitude and latitude.  The style center will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": [-73.9749, 40.7736]
    },
    "zoom": {
      "type": "number",
      "doc": "Default zoom level.  The style zoom will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": 12.5
    },
    "bearing": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "doc": "Default bearing, in degrees clockwise from true north.  The style bearing will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": 29
    },
    "pitch": {
      "type": "number",
      "default": 0,
      "units": "degrees",
      "doc": "Default pitch, in degrees. Zero is perpendicular to the surface, for a look straight down at the map, while a greater value like 60 looks ahead towards the horizon. The style pitch will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": 50
    },
    "light": {
      "type": "light",
      "doc": "The global light source.",
      "example": {
        "anchor": "viewport",
        "color": "white",
        "intensity": 0.4
      }
    },
    "sources": {
      "required": true,
      "type": "sources",
      "doc": "Data source specifications.",
      "example": {
        "mapbox-streets": {
          "type": "vector",
          "url": "mapbox://mapbox.mapbox-streets-v6"
        }
      }
    },
    "sprite": {
      "type": "string",
      "doc": "A base URL for retrieving the sprite image and metadata. The extensions `.png`, `.json` and scale factor `@2x.png` will be automatically appended. This property is required if any layer uses the `background-pattern`, `fill-pattern`, `line-pattern`, `fill-extrusion-pattern`, or `icon-image` properties.",
      "example": "mapbox://sprites/mapbox/bright-v8"
    },
    "glyphs": {
      "type": "string",
      "doc": "A URL template for loading signed-distance-field glyph sets in PBF format. The URL must include `{fontstack}` and `{range}` tokens. This property is required if any layer uses the `text-field` layout property.",
      "example": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf"
    },
    "transition": {
      "type": "transition",
      "doc": "A global transition definition to use as a default across properties.",
      "example": {
        "duration": 300,
        "delay": 0
      }
    },
    "layers": {
      "required": true,
      "type": "array",
      "value": "layer",
      "doc": "Layers will be drawn in the order of this array.",
      "example": [
        {
          "id": "water",
          "source": "mapbox-streets",
          "source-layer": "water",
          "type": "fill",
          "paint": {
            "fill-color": "#00ffff"
          }
        }
      ]
    }
  },
  "sources": {
    "*": {
      "type": "source",
      "doc": "Specification of a data source. For vector and raster sources, either TileJSON or a URL to a TileJSON must be provided. For image and video sources, a URL must be provided. For GeoJSON sources, a URL or inline GeoJSON must be provided."
    }
  },
  "source": [
    "source_vector",
    "source_raster",
    "source_geojson",
    "source_video",
    "source_image",
    "source_canvas"
  ],
  "source_vector": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "vector": {
          "doc": "A vector tile source."
        }
      },
      "doc": "The type of the source."
    },
    "url": {
      "type": "string",
      "doc": "A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<mapid>`."
    },
    "tiles": {
      "type": "array",
      "value": "string",
      "doc": "An array of one or more tile source URLs, as in the TileJSON spec."
    },
    "bounds": {
      "type": "array",
      "value": "number",
      "length": 4,
      "default": [-180, -85.0511, 180, 85.0511],
      "doc": "An array containing the longitude and latitude of the southwest and northeast corners of the source's bounding box in the following order: `[sw.lng, sw.lat, ne.lng, ne.lat]`. When this property is included in a source, no tiles outside of the given bounds are requested by Mapbox GL."
    },
    "minzoom": {
      "type": "number",
      "default": 0,
      "doc": "Minimum zoom level for which tiles are available, as in the TileJSON spec."
    },
    "maxzoom": {
      "type": "number",
      "default": 22,
      "doc": "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
    },
    "attribution": {
      "type": "string",
      "doc": "Contains an attribution to be displayed when the map is shown to a user."
    },
    "*": {
      "type": "*",
      "doc": "Other keys to configure the data source."
    }
  },
  "source_raster": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "raster": {
          "doc": "A raster tile source."
        }
      },
      "doc": "The type of the source."
    },
    "url": {
      "type": "string",
      "doc": "A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<mapid>`."
    },
    "tiles": {
      "type": "array",
      "value": "string",
      "doc": "An array of one or more tile source URLs, as in the TileJSON spec."
    },
    "bounds": {
      "type": "array",
      "value": "number",
      "length": 4,
      "default": [-180, -85.0511, 180, 85.0511],
      "doc": "An array containing the longitude and latitude of the southwest and northeast corners of the source's bounding box in the following order: `[sw.lng, sw.lat, ne.lng, ne.lat]`. When this property is included in a source, no tiles outside of the given bounds are requested by Mapbox GL."
    },
    "minzoom": {
      "type": "number",
      "default": 0,
      "doc": "Minimum zoom level for which tiles are available, as in the TileJSON spec."
    },
    "maxzoom": {
      "type": "number",
      "default": 22,
      "doc": "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
    },
    "tileSize": {
      "type": "number",
      "default": 512,
      "units": "pixels",
      "doc": "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
    },
    "scheme": {
      "type": "enum",
      "values": {
        "xyz": {
          "doc": "Slippy map tilenames scheme."
        },
        "tms": {
          "doc": "OSGeo spec scheme."
        }
      },
      "default": "xyz",
      "doc": "Influences the y direction of the tile coordinates. The global-mercator (aka Spherical Mercator) profile is assumed."
    },
    "attribution": {
      "type": "string",
      "doc": "Contains an attribution to be displayed when the map is shown to a user."
    },
    "*": {
      "type": "*",
      "doc": "Other keys to configure the data source."
    }
  },
  "source_geojson": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "geojson": {
          "doc": "A GeoJSON data source."
        }
      },
      "doc": "The data type of the GeoJSON source."
    },
    "data": {
      "type": "*",
      "doc": "A URL to a GeoJSON file, or inline GeoJSON."
    },
    "maxzoom": {
      "type": "number",
      "default": 18,
      "doc": "Maximum zoom level at which to create vector tiles (higher means greater detail at high zoom levels)."
    },
    "buffer": {
      "type": "number",
      "default": 128,
      "maximum": 512,
      "minimum": 0,
      "doc": "Size of the tile buffer on each side. A value of 0 produces no buffer. A value of 512 produces a buffer as wide as the tile itself. Larger values produce fewer rendering artifacts near tile edges and slower performance."
    },
    "tolerance": {
      "type": "number",
      "default": 0.375,
      "doc": "Douglas-Peucker simplification tolerance (higher means simpler geometries and faster performance)."
    },
    "cluster": {
      "type": "boolean",
      "default": false,
      "doc": "If the data is a collection of point features, setting this to true clusters the points by radius into groups."
    },
    "clusterRadius": {
      "type": "number",
      "default": 50,
      "minimum": 0,
      "doc": "Radius of each cluster if clustering is enabled. A value of 512 indicates a radius equal to the width of a tile."
    },
    "clusterMaxZoom": {
      "type": "number",
      "doc": "Max zoom on which to cluster points if clustering is enabled. Defaults to one zoom less than maxzoom (so that last zoom features are not clustered)."
    }
  },
  "source_video": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "video": {
          "doc": "A video data source."
        }
      },
      "doc": "The data type of the video source."
    },
    "urls": {
      "required": true,
      "type": "array",
      "value": "string",
      "doc": "URLs to video content in order of preferred format."
    },
    "coordinates": {
      "required": true,
      "doc": "Corners of video specified in longitude, latitude pairs.",
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number",
        "doc": "A single longitude, latitude pair."
      }
    }
  },
  "source_image": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "image": {
          "doc": "An image data source."
        }
      },
      "doc": "The data type of the image source."
    },
    "url": {
      "required": true,
      "type": "string",
      "doc": "URL that points to an image."
    },
    "coordinates": {
      "required": true,
      "doc": "Corners of image specified in longitude, latitude pairs.",
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number",
        "doc": "A single longitude, latitude pair."
      }
    }
  },
  "source_canvas": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "canvas": {
          "doc": "A canvas data source."
        }
      },
      "doc": "The data type of the canvas source."
    },
    "coordinates": {
      "required": true,
      "doc": "Corners of canvas specified in longitude, latitude pairs.",
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number",
        "doc": "A single longitude, latitude pair."
      }
    },
    "animate": {
      "type": "boolean",
      "default": "true",
      "doc": "Whether the canvas source is animated. If the canvas is static, `animate` should be set to `false` to improve performance."
    },
    "canvas": {
      "type": "string",
      "required": true,
      "doc": "HTML ID of the canvas from which to read pixels."
    }
  },
  "layer": {
    "id": {
      "type": "string",
      "doc": "Unique layer name.",
      "required": true
    },
    "type": {
      "type": "enum",
      "values": {
        "fill": {
          "doc": "A filled polygon with an optional stroked border.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "line": {
          "doc": "A stroked line.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "symbol": {
          "doc": "An icon or a text label.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "circle": {
          "doc": "A filled circle.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "heatmap": {
          "doc": "A heatmap.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.41.0"
            }
          }
        },
        "fill-extrusion": {
          "doc": "An extruded (3D) polygon.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.27.0",
              "android": "5.1.0",
              "ios": "3.6.0",
              "macos": "0.5.0"
            }
          }
        },
        "raster": {
          "doc": "Raster map textures such as satellite imagery.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "background": {
          "doc": "The background color or pattern of the map.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        }
      },
      "doc": "Rendering type of this layer."
    },
    "metadata": {
      "type": "*",
      "doc": "Arbitrary properties useful to track with the layer, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'."
    },
    "source": {
      "type": "string",
      "doc": "Name of a source description to be used for this layer. Required for all layer types except `background`."
    },
    "source-layer": {
      "type": "string",
      "doc": "Layer to use from a vector tile source. Required for vector tile sources; prohibited for all other source types, including GeoJSON sources."
    },
    "minzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 24,
      "doc": "The minimum zoom level on which the layer gets parsed and appears on."
    },
    "maxzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 24,
      "doc": "The maximum zoom level on which the layer gets parsed and appears on."
    },
    "filter": {
      "type": "filter",
      "doc": "A expression specifying conditions on source features. Only features that match the filter are displayed."
    },
    "layout": {
      "type": "layout",
      "doc": "Layout properties for the layer."
    },
    "paint": {
      "type": "paint",
      "doc": "Default paint properties for this layer."
    }
  },
  "layout": [
    "layout_fill",
    "layout_line",
    "layout_circle",
    "layout_heatmap",
    "layout_fill-extrusion",
    "layout_symbol",
    "layout_raster",
    "layout_background"
  ],
  "layout_background": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "layout_fill": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "layout_circle": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "layout_heatmap": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        }
      }
    }
  },
  "layout_fill-extrusion": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    }
  },
  "layout_line": {
    "line-cap": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "butt": {
            "doc": "A cap with a squared-off end which is drawn to the exact endpoint of the line."
        },
        "round": {
            "doc": "A cap with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line."
        },
        "square": {
            "doc": "A cap with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width."
        }
      },
      "default": "butt",
      "doc": "The display of line endings.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-join": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "bevel": {
            "doc": "A join with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width."
        },
        "round": {
            "doc": "A join with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line."
        },
        "miter": {
            "doc": "A join with a sharp, angled corner which is drawn with the outer sides beyond the endpoint of the path until they meet."
        }
      },
      "default": "miter",
      "doc": "The display of lines when joining.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.40.0"
        }
      }
    },
    "line-miter-limit": {
      "type": "number",
      "default": 2,
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Used to automatically convert miter joins to bevel joins for sharp angles.",
      "requires": [
        {
          "line-join": "miter"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-round-limit": {
      "type": "number",
      "default": 1.05,
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Used to automatically convert round joins to miter joins for shallow angles.",
      "requires": [
        {
          "line-join": "round"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "layout_symbol": {
    "symbol-placement": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
          "point": {
              "doc": "The label is placed at the point where the geometry is located."
          },
          "line": {
              "doc": "The label is placed along the line of the geometry. Can only be used on `LineString` and `Polygon` geometries."
          }
      },
      "default": "point",
      "doc": "Label placement relative to its geometry.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "symbol-spacing": {
      "type": "number",
      "default": 250,
      "minimum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "units": "pixels",
      "doc": "Distance between two symbol anchors.",
      "requires": [
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "symbol-avoid-edges": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the symbols will not cross tile edges to avoid mutual collisions. Recommended in layers that don't have enough padding in the vector tile to prevent collisions, or if it is a point symbol layer placed after a line symbol layer.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the icon will be visible even if it collides with other previously drawn symbols.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, other symbols can be visible even if they collide with the icon.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, text will display without their corresponding icons when the icon collides with other symbols and the text does not.",
      "requires": [
        "icon-image",
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "When `symbol-placement` is set to `point`, aligns icons east-west. When `symbol-placement` is set to `line`, aligns icon x-axes with the line."
        },
        "viewport": {
            "doc": "Produces icons whose x-axes are aligned with the x-axis of the viewport, regardless of the value of `symbol-placement`."
        },
        "auto": {
            "doc": "When `symbol-placement` is set to `point`, this is equivalent to `viewport`. When `symbol-placement` is set to `line`, this is equivalent to `map`."
        }
      },
      "default": "auto",
      "doc": "In combination with `symbol-placement`, determines the rotation behavior of icons.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "`auto` value": {
          "js": "0.25.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.3.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-size": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "units": "factor of the original icon size",
      "doc": "Scales the original size of the icon by the provided factor. The new pixel size of the image will be the original pixel size multiplied by `icon-size`. 1 is the original size; 3 triples the size of the image.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "icon-text-fit": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "none": {
            "doc": "The icon is displayed at its intrinsic aspect ratio."
        },
        "width": {
            "doc": "The icon is scaled in the x-dimension to fit the width of the text."
        },
        "height": {
            "doc": "The icon is scaled in the y-dimension to fit the height of the text."
        },
        "both": {
            "doc": "The icon is scaled in both x- and y-dimensions."
        }
      },
      "default": "none",
      "doc": "Scales the icon to fit around the associated text.",
      "requires": [
        "icon-image",
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "data-driven styling": {}
      }
    },
    "icon-text-fit-padding": {
      "type": "array",
      "value": "number",
      "length": 4,
      "default": [
        0,
        0,
        0,
        0
      ],
      "units": "pixels",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Size of the additional area added to dimensions determined by `icon-text-fit`, in clockwise order: top, right, bottom, left.",
      "requires": [
        "icon-image",
        "text-field",
        {
          "icon-text-fit": [
            "both",
            "width",
            "height"
          ]
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "data-driven styling": {}
      }
    },
    "icon-image": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "doc": "Name of image in sprite to use for drawing an image background. A string with `{tokens}` replaced, referencing the data property to pull from. (`{token}` replacement is only supported for literal `icon-image` values; not for property functions.)",
      "tokens": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "icon-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "units": "degrees",
      "doc": "Rotates the icon clockwise.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.21.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "units": "pixels",
      "doc": "Size of the additional area around the icon bounding box used for detecting symbol collisions.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the icon may be flipped to prevent it from being rendered upside-down.",
      "requires": [
        "icon-image",
        {
          "icon-rotation-alignment": "map"
        },
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-offset": {
      "type": "array",
      "value": "number",
      "units": "pixels multiplied by the value of \"icon-size\"",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Offset distance of icon from its anchor. Positive values indicate right and down, while negative values indicate left and up. When combined with `icon-rotate` the offset will be as if the rotated direction was up.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "center": {
            "doc": "The center of the icon is placed closest to the anchor."
        },
        "left": {
            "doc": "The left side of the icon is placed closest to the anchor."
        },
        "right": {
            "doc": "The right side of the icon is placed closest to the anchor."
        },
        "top": {
            "doc": "The top of the icon is placed closest to the anchor."
        },
        "bottom": {
            "doc": "The bottom of the icon is placed closest to the anchor."
        },
        "top-left": {
            "doc": "The top left corner of the icon is placed closest to the anchor."
        },
        "top-right": {
            "doc": "The top right corner of the icon is placed closest to the anchor."
        },
        "bottom-left": {
            "doc": "The bottom left corner of the icon is placed closest to the anchor."
        },
        "bottom-right": {
            "doc": "The bottom right corner of the icon is placed closest to the anchor."
        }
      },
      "default": "center",
      "doc": "Part of the icon placed closest to the anchor.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.40.0"
        },
        "data-driven styling": {
          "js": "0.40.0"
        }
      }
    },
    "icon-pitch-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The icon is aligned to the plane of the map."
        },
        "viewport": {
            "doc": "The icon is aligned to the plane of the viewport."
        },
        "auto": {
            "doc": "Automatically matches the value of `icon-rotation-alignment`."
        }
      },
      "default": "auto",
      "doc": "Orientation of icon when map is pitched.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.39.0"
        },
        "data-driven styling": {}
      }
    },
    "text-pitch-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The text is aligned to the plane of the map."
        },
        "viewport": {
            "doc": "The text is aligned to the plane of the viewport."
        },
        "auto": {
            "doc": "Automatically matches the value of `text-rotation-alignment`."
        }
      },
      "default": "auto",
      "doc": "Orientation of text when map is pitched.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "`auto` value": {
          "js": "0.25.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.3.0"
        },
        "data-driven styling": {}
      }
    },
    "text-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "When `symbol-placement` is set to `point`, aligns text east-west. When `symbol-placement` is set to `line`, aligns text x-axes with the line."
        },
        "viewport": {
            "doc": "Produces glyphs whose x-axes are aligned with the x-axis of the viewport, regardless of the value of `symbol-placement`."
        },
        "auto": {
            "doc": "When `symbol-placement` is set to `point`, this is equivalent to `viewport`. When `symbol-placement` is set to `line`, this is equivalent to `map`."
        }
      },
      "default": "auto",
      "doc": "In combination with `symbol-placement`, determines the rotation behavior of the individual glyphs forming the text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "`auto` value": {
          "js": "0.25.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.3.0"
        },
        "data-driven styling": {}
      }
    },
    "text-field": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "default": "",
      "tokens": true,
      "doc": "Value to use for a text label. Feature properties are specified using tokens like `{field_name}`. (`{token}` replacement is only supported for literal `text-field` values; not for property functions.)",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-font": {
      "type": "array",
      "value": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": ["Open Sans Regular", "Arial Unicode MS Regular"],
      "doc": "Font stack to use for displaying text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Font size.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "text-max-width": {
      "type": "number",
      "default": 10,
      "minimum": 0,
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "The maximum line width for text wrapping.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.40.0"
        }
      }
    },
    "text-line-height": {
      "type": "number",
      "default": 1.2,
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Text leading value for multi-line text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-letter-spacing": {
      "type": "number",
      "default": 0,
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Text tracking amount.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.40.0"
        }
      }
    },
    "text-justify": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "left": {
            "doc": "The text is aligned to the left."
        },
        "center": {
            "doc": "The text is centered."
        },
        "right": {
            "doc": "The text is aligned to the right."
        }
      },
      "default": "center",
      "doc": "Text justification options.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.39.0"
        }
      }
    },
    "text-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "center": {
            "doc": "The center of the text is placed closest to the anchor."
        },
        "left": {
            "doc": "The left side of the text is placed closest to the anchor."
        },
        "right": {
            "doc": "The right side of the text is placed closest to the anchor."
        },
        "top": {
            "doc": "The top of the text is placed closest to the anchor."
        },
        "bottom": {
            "doc": "The bottom of the text is placed closest to the anchor."
        },
        "top-left": {
            "doc": "The top left corner of the text is placed closest to the anchor."
        },
        "top-right": {
            "doc": "The top right corner of the text is placed closest to the anchor."
        },
        "bottom-left": {
            "doc": "The bottom left corner of the text is placed closest to the anchor."
        },
        "bottom-right": {
            "doc": "The bottom right corner of the text is placed closest to the anchor."
        }
      },
      "default": "center",
      "doc": "Part of the text placed closest to the anchor.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.39.0"
        }
      }
    },
    "text-max-angle": {
      "type": "number",
      "default": 45,
      "units": "degrees",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Maximum angle change between adjacent characters.",
      "requires": [
        "text-field",
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Rotates the text clockwise.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "text-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Size of the additional area around the text bounding box used for detecting symbol collisions.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": true,
      "doc": "If true, the text may be flipped vertically to prevent it from being rendered upside-down.",
      "requires": [
        "text-field",
        {
          "text-rotation-alignment": "map"
        },
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-transform": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "none": {
            "doc": "The text is not altered."
        },
        "uppercase": {
            "doc": "Forces all letters to be displayed in uppercase."
        },
        "lowercase": {
            "doc": "Forces all letters to be displayed in lowercase."
        }
      },
      "default": "none",
      "doc": "Specifies how to capitalize text, similar to the CSS `text-transform` property.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-offset": {
      "type": "array",
      "doc": "Offset distance of text from its anchor. Positive values indicate right and down, while negative values indicate left and up.",
      "value": "number",
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "length": 2,
      "default": [
        0,
        0
      ],
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "text-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the text will be visible even if it collides with other previously drawn symbols.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, other symbols can be visible even if they collide with the text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, icons will display without their corresponding text when the text collides with other symbols and the icon does not.",
      "requires": [
        "text-field",
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "layout_raster": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "filter": {
    "type": "array",
    "value": "*",
    "doc": "A filter selects specific features from a layer."
  },
  "filter_operator": {
    "type": "enum",
    "values": {
      "==": {
          "doc": "`[\"==\", key, value]` equality: `feature[key] = value`"
      },
      "!=": {
          "doc": "`[\"!=\", key, value]` inequality: `feature[key] ≠ value`"
      },
      ">": {
          "doc": "`[\">\", key, value]` greater than: `feature[key] > value`"
      },
      ">=": {
          "doc": "`[\">=\", key, value]` greater than or equal: `feature[key] ≥ value`"
      },
      "<": {
          "doc": "`[\"<\", key, value]` less than: `feature[key] < value`"
      },
      "<=": {
          "doc": "`[\"<=\", key, value]` less than or equal: `feature[key] ≤ value`"
      },
      "in": {
          "doc": "`[\"in\", key, v0, ..., vn]` set inclusion: `feature[key] ∈ {v0, ..., vn}`"
      },
      "!in": {
          "doc": "`[\"!in\", key, v0, ..., vn]` set exclusion: `feature[key] ∉ {v0, ..., vn}`"
      },
      "all": {
          "doc": "`[\"all\", f0, ..., fn]` logical `AND`: `f0 ∧ ... ∧ fn`"
      },
      "any": {
          "doc": "`[\"any\", f0, ..., fn]` logical `OR`: `f0 ∨ ... ∨ fn`"
      },
      "none": {
          "doc": "`[\"none\", f0, ..., fn]` logical `NOR`: `¬f0 ∧ ... ∧ ¬fn`"
      },
      "has": {
          "doc": "`[\"has\", key]` `feature[key]` exists"
      },
      "!has": {
          "doc": "`[\"!has\", key]` `feature[key]` does not exist"
      }
    },
    "doc": "The filter operator."
  },
  "geometry_type": {
    "type": "enum",
    "values": {
      "Point": {
          "doc": "Filter to point geometries."
      },
      "LineString": {
          "doc": "Filter to line geometries."
      },
      "Polygon": {
          "doc": "Filter to polygon geometries."
      }
    },
    "doc": "The geometry type for the filter to select."
  },
  "function": {
    "expression": {
      "type": "expression",
      "doc": "An expression."
    },
    "stops": {
      "type": "array",
      "doc": "An array of stops.",
      "value": "function_stop"
    },
    "base": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "doc": "The exponential base of the interpolation curve. It controls the rate at which the result increases. Higher values make the result increase more towards the high end of the range. With `1` the stops are interpolated linearly."
    },
    "property": {
      "type": "string",
      "doc": "The name of a feature property to use as the function input.",
      "default": "$zoom"
    },
    "type": {
      "type": "enum",
      "values": {
          "identity": {
              "doc": "Return the input value as the output value."
          },
          "exponential": {
              "doc": "Generate an output by interpolating between stops just less than and just greater than the function input."
          },
          "interval": {
              "doc": "Return the output value of the stop just less than the function input."
          },
          "categorical": {
              "doc": "Return the output value of the stop equal to the function input."
          }
      },
      "doc": "The interpolation strategy to use in function evaluation.",
      "default": "exponential"
    },
    "colorSpace": {
      "type": "enum",
      "values": {
          "rgb": {
              "doc": "Use the RGB color space to interpolate color values"
          },
          "lab": {
              "doc": "Use the LAB color space to interpolate color values."
          },
          "hcl": {
              "doc": "Use the HCL color space to interpolate color values, interpolating the Hue, Chroma, and Luminance channels individually."
          }
      },
      "doc": "The color space in which colors interpolated. Interpolating colors in perceptual color spaces like LAB and HCL tend to produce color ramps that look more consistent and produce colors that can be differentiated more easily than those interpolated in RGB space.",
      "default": "rgb"
    },
    "default": {
      "type": "*",
      "required": false,
      "doc": "A value to serve as a fallback function result when a value isn't otherwise available. It is used in the following circumstances:\n* In categorical functions, when the feature value does not match any of the stop domain values.\n* In property and zoom-and-property functions, when a feature does not contain a value for the specified property.\n* In identity functions, when the feature value is not valid for the style property (for example, if the function is being used for a `circle-color` property but the feature property value is not a string or not a valid color).\n* In interval or exponential property and zoom-and-property functions, when the feature value is not numeric.\nIf no default is provided, the style property's default is used in these circumstances."
    }
  },
  "function_stop": {
    "type": "array",
    "minimum": 0,
    "maximum": 22,
    "value": [
      "number",
      "color"
    ],
    "length": 2,
    "doc": "Zoom level and value pair."
  },
  "expression": {
    "type": "array",
    "value": "*",
    "minimum": 1,
    "doc": "An expression defines a function that can be used for data-driven style properties or feature filters."
  },
  "expression_name": {
    "doc": "",
    "type": "enum",
    "values": {
      "let": {
        "doc": "Binds expressions to named variables, which can then be referenced in the result expression using [\"var\", \"variable_name\"].",
        "group": "Variable binding"
      },
      "var": {
        "doc": "References variable bound using \"let\".",
        "group": "Variable binding"
      },
      "literal": {
        "doc": "Provides a literal array or object value.",
        "group": "Types"
      },
      "array": {
        "doc": "Asserts that the input is an array (optionally with a specific item type and length).  If, when the input expression is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "at": {
        "doc": "Retrieves an item from an array.",
        "group": "Lookup"
      },
        "case": {
        "doc": "Selects the first output whose corresponding test condition evaluates to true.",
        "group": "Decision"
      },
      "match": {
        "doc": "Selects the output whose label value matches the input value, or the fallback value if no match is found. The `input` can be any string or number expression (e.g. `[\"get\", \"building_type\"]`). Each label can either be a single literal value or an array of values.",
        "group": "Decision"
      },
      "coalesce": {
        "doc": "Evaluates each expression in turn until the first non-null value is obtained, and returns that value.",
        "group": "Decision"
      },
      "step": {
        "doc": "Produces discrete, stepped results by evaluating a piecewise-constant function defined by pairs of input and output values (\"stops\"). The `input` may be any numeric expression (e.g., `[\"get\", \"population\"]`). Stop inputs must be numeric literals in strictly ascending order. Returns the output value of the stop just less than the input, or the first input if the input is less than the first stop.",
        "group": "Ramps, scales, curves"
      },
      "interpolate": {
        "doc": "Produces continuous, smooth results by interpolating between pairs of input and output values (\"stops\"). The `input` may be any numeric expression (e.g., `[\"get\", \"population\"]`). Stop inputs must be numeric literals in strictly ascending order. The output type must be `number`, `array<number>`, or `color`.\n\nInterpolation types:\n- `[\"linear\"]`: interpolates linearly between the pair of stops just less than and just greater than the input.\n- `[\"exponential\", base]`: interpolates exponentially between the stops just less than and just greater than the input. `base` controls the rate at which the output increases: higher values make the output increase more towards the high end of the range. With values close to 1 the output increases linearly.\n- `[\"cubic-bezier\", x1, y2, x2, y2]`: interpolates using the cubic bezier curve defined by the given control points.",
        "group": "Ramps, scales, curves"
      },
      "ln2": {
        "doc": "Returns mathematical constant ln(2).",
        "group": "Math"
      },
      "pi": {
        "doc": "Returns the mathematical constant pi.",
        "group": "Math"
      },
      "e": {
        "doc": "Returns the mathematical constant e.",
        "group": "Math"
      },
      "typeof": {
        "doc": "Returns a string describing the type of the given value.",
        "group": "Types"
      },
      "string": {
        "doc": "Asserts that the input value is a string. If multiple values are provided, each one is evaluated in order until a string value is obtained. If, when the last provided input is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "number": {
        "doc": "Asserts that the input value is a number. If multiple values are provided, each one is evaluated in order until a number value is obtained. If, when the last provided input is evaluated, it is not a number, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "boolean": {
        "doc": "Asserts that the input value is a boolean. If multiple values are provided, each one is evaluated in order until a boolean value is obtained. If, when the last provided input is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "object": {
        "doc": "Asserts that the input value is an Objects.",
        "group": "Types"
      },
      "to-string": {
        "doc": "Coerces the input value to a string.",
        "group": "Types"
      },
      "to-number": {
        "doc": "Coerces the input value to a number, if possible. If multiple values are provided, each one is evaluated in order until the first successful conversion is obtained.",
        "group": "Types"
      },
      "to-boolean": {
        "doc": "Coerces the input value to a boolean.",
        "group": "Types"
      },
      "to-rgba": {
        "doc": "Returns the an array of the given color's r, g, b, a components.",
        "group": "Color"
      },
      "to-color": {
        "doc": "Coerces the input value to a color. If multiple values are provided, each one is evaluated in order until the first successful conversion is obtained.",
        "group": "Types"
      },
      "rgb": {
        "doc": "Creates a color value from r, g, b components.",
        "group": "Color"
      },
      "rgba": {
        "doc": "Creates a color value from r, g, b, a components.",
        "group": "Color"
      },
      "get": {
        "doc": "Retrieves a property value from the current feature's properties (or from another object if one is provided).  Returns null if the requested property is missing.",
        "group": "Lookup"
      },
      "has": {
        "doc": "Tests for the presence of an property value in the current featur's properties (or from another object if one is provided).",
        "group": "Lookup"
      },
      "length": {
        "doc": "Gets the length of an array or string.",
        "group": "Lookup"
      },
      "properties": {
        "doc": "Gets the feature properties object.  Note that in some cases, it may be more efficient to use [\"get\", \"property_name\"] directly.",
        "group": "Feature data"
      },
      "geometry-type": {
        "doc": "Gets the feature's geometry type: Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon.",
        "group": "Feature data"
      },
      "id": {
        "doc": "Gets the feature's id, if it has one.",
        "group": "Feature data"
      },
      "zoom": {
        "doc": "Gets the current zoom level.  Note that in style layout and paint properties, [\"zoom\"] may only appear as the input to a top-level \"step\" or \"interpolate\" expression.",
        "group": "Zoom"
      },
      "heatmap-density": {
        "doc": "Gets the kernel density estimation of a pixel in a heatmap layer, which is a relative measure of how many data points are crowded around a particular pixel. Can only be used in the `heatmap-color` property.",
        "group": "Heatmap"
      },
      "+": {
        "doc": "",
        "group": "Math"
      },
      "*": {
        "doc": "",
        "group": "Math"
      },
      "-": {
        "doc": "",
        "group": "Math"
      },
      "/": {
        "doc": "",
        "group": "Math"
      },
      "%": {
        "doc": "",
        "group": "Math"
      },
      "^": {
        "doc": "",
        "group": "Math"
      },
      "sqrt": {
        "doc": "",
        "group": "Math"
      },
      "log10": {
        "doc": "",
        "group": "Math"
      },
      "ln": {
        "doc": "",
        "group": "Math"
      },
      "log2": {
        "doc": "",
        "group": "Math"
      },
      "sin": {
        "doc": "",
        "group": "Math"
      },
      "cos": {
        "doc": "",
        "group": "Math"
      },
      "tan": {
        "doc": "",
        "group": "Math"
      },
      "asin": {
        "doc": "",
        "group": "Math"
      },
      "acos": {
        "doc": "",
        "group": "Math"
      },
      "atan": {
        "doc": "",
        "group": "Math"
      },
      "min": {
        "doc": "",
        "group": "Math"
      },
      "max": {
        "doc": "",
        "group": "Math"
      },
      "==": {
        "doc": "",
        "group": "Decision"
      },
      "!=": {
        "doc": "",
        "group": "Decision"
      },
      ">": {
        "doc": "",
        "group": "Decision"
      },
      "<": {
        "doc": "",
        "group": "Decision"
      },
      ">=": {
        "doc": "",
        "group": "Decision"
      },
      "<=": {
        "doc": "",
        "group": "Decision"
      },
      "all": {
        "doc": "",
        "group": "Decision"
      },
      "any": {
        "doc": "",
        "group": "Decision"
      },
      "!": {
        "doc": "",
        "group": "Decision"
      },
      "upcase": {
        "doc": "",
        "group": "String"
      },
      "downcase": {
        "doc": "",
        "group": "String"
      },
      "concat": {
        "doc": "Concetenate the given strings.",
        "group": "String"
      }
    }
  },
  "light": {
    "anchor": {
      "type": "enum",
      "default": "viewport",
      "values": {
        "map": {
          "doc": "The position of the light source is aligned to the rotation of the map."
        },
        "viewport": {
          "doc": "The position of the light source is aligned to the rotation of the viewport."
        }
      },
      "transition": false,
      "zoom-function": true,
      "property-function": false,
      "function": "piecewise-constant",
      "doc": "Whether extruded geometries are lit relative to the map or viewport.",
      "example": "map",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "position": {
      "type": "array",
      "default": [1.15, 210, 30],
      "length": 3,
      "value": "number",
      "transition": true,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "doc": "Position of the light source relative to lit (extruded) geometries, in [r radial coordinate, a azimuthal angle, p polar angle] where r indicates the distance from the center of the base of an object to its light, a indicates the position of the light relative to 0° (0° when `light.anchor` is set to `viewport` corresponds to the top of the viewport, or 0° when `light.anchor` is set to `map` corresponds to due north, and degrees proceed clockwise), and p indicates the height of the light (from 0°, directly above, to 180°, directly below).",
      "example": [1.5, 90, 80],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "color": {
      "type": "color",
      "default": "#ffffff",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "doc": "Color tint for lighting extruded geometries.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "intensity": {
      "type": "number",
      "default": 0.5,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "doc": "Intensity of lighting (on a scale from 0 to 1). Higher numbers will present as more extreme contrast.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    }
  },
  "paint": [
    "paint_fill",
    "paint_line",
    "paint_circle",
    "paint_heatmap",
    "paint_fill-extrusion",
    "paint_symbol",
    "paint_raster",
    "paint_background"
  ],
  "paint_fill": {
    "fill-antialias": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": true,
      "doc": "Whether or not the fill should be antialiased.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-opacity": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity of the entire fill layer. In contrast to the `fill-color`, this value will also affect the 1px stroke around the fill, if the stroke is used.",
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.21.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "fill-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color of the filled part of this layer. This color can be specified as `rgba` with an alpha component and the color's opacity will not affect the opacity of the 1px stroke, if it is used.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.19.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "fill-outline-color": {
      "type": "color",
      "doc": "The outline color of the fill. Matches the value of `fill-color` if unspecified.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-pattern"
        },
        {
          "fill-antialias": true
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.19.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "fill-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The fill is translated relative to the map."
        },
        "viewport": {
            "doc": "The fill is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `fill-translate`.",
      "default": "map",
      "requires": [
        "fill-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_fill-extrusion": {
    "fill-extrusion-opacity": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity of the entire fill extrusion layer. This is rendered on a per-layer, not per-feature, basis, and data-driven styling is not available.",
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "fill-extrusion-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The base color of the extruded fill. The extrusion's surfaces will be shaded differently based on this color in combination with the root `light` settings. If this color is specified as `rgba` with an alpha component, the alpha component will be ignored; use `fill-extrusion-opacity` to set layer opacity.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-extrusion-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "fill-extrusion-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up (on the flat plane), respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-extrusion-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The fill extrusion is translated relative to the map."
        },
        "viewport": {
            "doc": "The fill extrusion is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `fill-extrusion-translate`.",
      "default": "map",
      "requires": [
        "fill-extrusion-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-extrusion-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing images on extruded fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-extrusion-height": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 0,
      "minimum": 0,
      "units": "meters",
      "doc": "The height with which to extrude this layer.",
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "fill-extrusion-base": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 0,
      "minimum": 0,
      "units": "meters",
      "doc": "The height with which to extrude the base of this layer. Must be less than or equal to `fill-extrusion-height`.",
      "transition": true,
      "requires": [
        "fill-extrusion-height"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    }
  },
  "paint_line": {
    "line-opacity": {
      "type": "number",
      "doc": "The opacity at which the line will be drawn.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-color": {
      "type": "color",
      "doc": "The color with which the line will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "line-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.23.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The line is translated relative to the map."
        },
        "viewport": {
            "doc": "The line is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `line-translate`.",
      "default": "map",
      "requires": [
        "line-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-width": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Stroke thickness.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.39.0"
        }
      }
    },
    "line-gap-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "doc": "Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-offset": {
      "type": "number",
      "default": 0,
      "doc": "The line's offset. For linear features, a positive value offsets the line to the right, relative to the direction of the line, and a negative value to the left. For polygon features, a positive value results in an inset, and a negative value results in an outset.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "sdk-support": {
        "basic functionality": {
          "js": "0.12.1",
          "android": "3.0.0",
          "ios": "3.1.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Blur applied to the line, in pixels.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-dasharray": {
      "type": "array",
      "value": "number",
      "function": "piecewise-constant",
      "zoom-function": true,
      "doc": "Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width.",
      "minimum": 0,
      "transition": true,
      "units": "line widths",
      "requires": [
        {
          "!": "line-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image lines. For seamless patterns, image width must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_circle": {
    "circle-radius": {
      "type": "number",
      "default": 5,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Circle radius.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.18.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The fill color of the circle.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.18.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-blur": {
      "type": "number",
      "default": 0,
      "doc": "Amount to blur the circle. 1 blurs the circle such that only the centerpoint is full opacity.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.20.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-opacity": {
      "type": "number",
      "doc": "The opacity at which the circle will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.20.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [0, 0],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "circle-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The circle is translated relative to the map."
        },
        "viewport": {
            "doc": "The circle is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `circle-translate`.",
      "default": "map",
      "requires": [
        "circle-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "circle-pitch-scale": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "Circles are scaled according to their apparent distance to the camera."
        },
        "viewport": {
            "doc": "Circles are not scaled."
        }
      },
      "default": "map",
      "doc": "Controls the scaling behavior of the circle when the map is pitched.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "data-driven styling": {}
      }
    },
    "circle-pitch-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The circle is aligned to the plane of the map."
        },
        "viewport": {
            "doc": "The circle is aligned to the plane of the viewport."
        }
      },
      "default": "viewport",
      "doc": "Orientation of circle when map is pitched.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.39.0"
        },
        "data-driven styling": {}
      }
    },
    "circle-stroke-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The width of the circle's stroke. Strokes are placed outside of the `circle-radius`.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-stroke-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The stroke color of the circle.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-stroke-opacity": {
      "type": "number",
      "doc": "The opacity of the circle's stroke.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    }
  },
  "paint_heatmap": {
    "heatmap-radius": {
      "type": "number",
      "default": 30,
      "minimum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "units": "pixels",
      "doc": "Radius of influence of one heatmap point in pixels. Increasing the value makes the heatmap smoother, but less detailed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    },
    "heatmap-weight": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": false,
      "doc": "A measure of how much an individual point contributes to the heatmap. A value of 10 would be equivalent to having 10 points of weight 1 in the same spot. Especially useful when combined with clustering.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {
          "js": "0.41.0"
        }
      }
    },
    "heatmap-intensity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "doc": "Similar to `heatmap-weight` but controls the intensity of the heatmap globally. Primarily used for adjusting the heatmap based on zoom level.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    },
    "heatmap-color": {
      "type": "color",
      "default": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0, "rgba(0, 0, 255, 0)",
        0.1, "royalblue",
        0.3, "cyan",
        0.5, "lime",
        0.7, "yellow",
        1, "red"
      ],
      "doc": "Defines the color of each pixel based on its density value in a heatmap.  Should be an expression that uses `[\"heatmap-density\"]` as input.",
      "function": "interpolated",
      "zoom-function": false,
      "property-function": false,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    },
    "heatmap-opacity": {
      "type": "number",
      "doc": "The global opacity at which the heatmap layer will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_symbol": {
    "icon-opacity": {
      "doc": "The opacity at which the icon will be drawn.",
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-color": {
      "type": "color",
      "default": "#000000",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "doc": "The color of the icon. This can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "doc": "The color of the icon's halo. Icon halos can only be used with SDF icons.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the icon outline.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Fade out the halo towards the outside.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance that the icon's anchor is moved from its original placement. Positive values indicate right and down, while negative values indicate left and up.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "Icons are translated relative to the map."
        },
        "viewport": {
            "doc": "Icons are translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `icon-translate`.",
      "default": "map",
      "requires": [
        "icon-image",
        "icon-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-opacity": {
      "type": "number",
      "doc": "The opacity at which the text will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-color": {
      "type": "color",
      "doc": "The color with which the text will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "doc": "The color of the text's halo, which helps it stand out from backgrounds.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the font outline. Max text halo width is 1/4 of the font-size.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The halo's fadeout distance towards the outside.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance that the text's anchor is moved from its original placement. Positive values indicate right and down, while negative values indicate left and up.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The text is translated relative to the map."
        },
        "viewport": {
            "doc": "The text is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `text-translate`.",
      "default": "map",
      "requires": [
        "text-field",
        "text-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_raster": {
    "raster-opacity": {
      "type": "number",
      "doc": "The opacity at which the image will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-hue-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "degrees",
      "doc": "Rotates hues around the color wheel.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-brightness-min": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Increase or reduce the brightness of the image. The value is the minimum brightness.",
      "default": 0,
      "minimum": 0,
      "maximum": 1,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-brightness-max": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Increase or reduce the brightness of the image. The value is the maximum brightness.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-saturation": {
      "type": "number",
      "doc": "Increase or reduce the saturation of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-contrast": {
      "type": "number",
      "doc": "Increase or reduce the contrast of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-fade-duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "milliseconds",
      "doc": "Fade duration when a new tile is added.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_background": {
    "background-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color with which the background will be drawn.",
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "requires": [
        {
          "!": "background-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    },
    "background-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing an image background. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    },
    "background-opacity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity at which the background will be drawn.",
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "transition": {
    "duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Time allotted for transitions to complete."
    },
    "delay": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Length of time before a transition begins."
    }
  }
}

},{}],57:[function(require,module,exports){
//      

                                          
                   
                        
                                 
                             
                    
     
                   
                        
                                 
                             
                    
     
                    
                        
                                 
                             
                     
     
                 
                        
                                 
                             
                           
                    
     
                  
                        
                                 
                             
                    
     
                  
                    
                        
                                 
                             
                    
                           
     
                  
                    
                        
                                 
                             
                    
                           
  

exports.v8 = require('./reference/v8.json');
exports.latest = require('./reference/latest');

exports.format = require('./format');
exports.migrate = require('./migrate');
exports.composite = require('./composite');
exports.diff = require('./diff');
exports.ValidationError = require('./error/validation_error');
exports.ParsingError = require('./error/parsing_error');
exports.expression = require('./expression');
exports.featureFilter = require('./feature_filter');

exports.function = require('./function');
exports.function.convertFunction = require('./function/convert');

exports.validate = require('./validate_style');
exports.validate.parsed = require('./validate_style');
exports.validate.latest = require('./validate_style');

},{"./composite":20,"./diff":21,"./error/parsing_error":22,"./error/validation_error":23,"./expression":40,"./feature_filter":49,"./format":50,"./function":52,"./function/convert":51,"./migrate":53,"./reference/latest":55,"./reference/v8.json":56,"./validate_style":84}],58:[function(require,module,exports){
//      

var ref = require('csscolorparser');
var parseCSSColor = ref.parseCSSColor;

/**
 * An RGBA color value. All components are in the range [0, 1] and R, B, and G are premultiplied by A.
 * @private
 */
var Color = function Color(r    , g    , b    , a) {
    if ( a === void 0 ) a     = 1;

    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};

Color.parse = function parse (input     )           {
    if (!input) {
        return undefined;
    }

    if (input instanceof Color) {
        return input;
    }

    if (typeof input !== 'string') {
        return undefined;
    }

    var rgba = parseCSSColor(input);
    if (!rgba) {
        return undefined;
    }

    return new Color(
        rgba[0] / 255 * rgba[3],
        rgba[1] / 255 * rgba[3],
        rgba[2] / 255 * rgba[3],
        rgba[3]
    );
};

module.exports = Color;

},{"csscolorparser":7}],59:[function(require,module,exports){
//      

var Color = require('./color');

                 
              
              
              
                 
  

                 
              
              
              
                 
  

// Constants
var Xn = 0.950470, // D65 standard referent
    Yn = 1,
    Zn = 1.088830,
    t0 = 4 / 29,
    t1 = 6 / 29,
    t2 = 3 * t1 * t1,
    t3 = t1 * t1 * t1,
    deg2rad = Math.PI / 180,
    rad2deg = 180 / Math.PI;

// Utilities
function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
    x /= 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

// LAB
function rgbToLab(rgbColor       )           {
    var b = rgb2xyz(rgbColor.r),
        a = rgb2xyz(rgbColor.g),
        l = rgb2xyz(rgbColor.b),
        x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
        y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
        z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);

    return {
        l: 116 * y - 16,
        a: 500 * (x - y),
        b: 200 * (y - z),
        alpha: rgbColor.a
    };
}

function labToRgb(labColor          )        {
    var y = (labColor.l + 16) / 116,
        x = isNaN(labColor.a) ? y : y + labColor.a / 500,
        z = isNaN(labColor.b) ? y : y - labColor.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Color(
        xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
        xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
        xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
        labColor.alpha
    );
}

// HCL
function rgbToHcl(rgbColor       )           {
    var ref = rgbToLab(rgbColor);
    var l = ref.l;
    var a = ref.a;
    var b = ref.b;
    var h = Math.atan2(b, a) * rad2deg;
    return {
        h: h < 0 ? h + 360 : h,
        c: Math.sqrt(a * a + b * b),
        l: l,
        alpha: rgbColor.a
    };
}

function hclToRgb(hclColor          )        {
    var h = hclColor.h * deg2rad,
        c = hclColor.c,
        l = hclColor.l;
    return labToRgb({
        l: l,
        a: Math.cos(h) * c,
        b: Math.sin(h) * c,
        alpha: hclColor.alpha
    });
}

module.exports = {
    lab: {
        forward: rgbToLab,
        reverse: labToRgb
    },
    hcl: {
        forward: rgbToHcl,
        reverse: hclToRgb
    }
};

},{"./color":58}],60:[function(require,module,exports){

module.exports = function (output) {
    var inputs = [], len = arguments.length - 1;
    while ( len-- > 0 ) inputs[ len ] = arguments[ len + 1 ];

    for (var i = 0, list = inputs; i < list.length; i += 1) {
        var input = list[i];

        for (var k in input) {
            output[k] = input[k];
        }
    }
    return output;
};

},{}],61:[function(require,module,exports){

module.exports = function getType(val) {
    if (val instanceof Number) {
        return 'number';
    } else if (val instanceof String) {
        return 'string';
    } else if (val instanceof Boolean) {
        return 'boolean';
    } else if (Array.isArray(val)) {
        return 'array';
    } else if (val === null) {
        return 'null';
    } else {
        return typeof val;
    }
};

},{}],62:[function(require,module,exports){
//      

var Color = require('./color');

module.exports = {
    number: number,
    color: color,
    array: array
};

function number(a        , b        , t        ) {
    return (a * (1 - t)) + (b * t);
}

function color(from       , to       , t        ) {
    return new Color(
        number(from.r, to.r, t),
        number(from.g, to.g, t),
        number(from.b, to.b, t),
        number(from.a, to.a, t)
    );
}

function array(from               , to               , t        ) {
    return from.map(function (d, i) {
        return number(d, to[i], t);
    });
}

},{"./color":58}],63:[function(require,module,exports){
//      

/**
 * A type used for returning and propagating errors. The first element of the union
 * represents success and contains a value, and the second represents an error and
 * contains an error value.
 */
                          
                                       
                                      

function success      (value   )               {
    return { result: 'success', value: value };
}

function error      (value   )               {
    return { result: 'error', value: value };
}

module.exports = {
    success: success,
    error: error
};

},{}],64:[function(require,module,exports){

// Turn jsonlint-lines-primitives objects into primitive objects
function unbundle(value) {
    if (value instanceof Number || value instanceof String || value instanceof Boolean) {
        return value.valueOf();
    } else {
        return value;
    }
}

function deepUnbundle(value) {
    if (Array.isArray(value)) {
        return value.map(deepUnbundle);
    }
    return unbundle(value);
}

module.exports = unbundle;
module.exports.deep = deepUnbundle;

},{}],65:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var getType = require('../util/get_type');
var extend = require('../util/extend');
var unbundle = require('../util/unbundle_jsonlint');
var ref = require('../expression');
var isExpression = ref.isExpression;
var ref$1 = require('../function');
var isFunction = ref$1.isFunction;

// Main recursive validation function. Tracks:
//
// - key: string representing location of validation in style tree. Used only
//   for more informative error reporting.
// - value: current value from style being evaluated. May be anything from a
//   high level object that needs to be descended into deeper or a simple
//   scalar value.
// - valueSpec: current spec being evaluated. Tracks value.

module.exports = function validate(options) {

    var validateFunction = require('./validate_function');
    var validateExpression = require('./validate_expression');
    var validateObject = require('./validate_object');
    var VALIDATORS = {
        '*': function() {
            return [];
        },
        'array': require('./validate_array'),
        'boolean': require('./validate_boolean'),
        'number': require('./validate_number'),
        'color': require('./validate_color'),
        'constants': require('./validate_constants'),
        'enum': require('./validate_enum'),
        'filter': require('./validate_filter'),
        'function': require('./validate_function'),
        'layer': require('./validate_layer'),
        'object': require('./validate_object'),
        'source': require('./validate_source'),
        'light': require('./validate_light'),
        'string': require('./validate_string')
    };

    var value = options.value;
    var valueSpec = options.valueSpec;
    var key = options.key;
    var styleSpec = options.styleSpec;
    var style = options.style;

    if (getType(value) === 'string' && value[0] === '@') {
        if (styleSpec.$version > 7) {
            return [new ValidationError(key, value, 'constants have been deprecated as of v8')];
        }
        if (!(value in style.constants)) {
            return [new ValidationError(key, value, 'constant "%s" not found', value)];
        }
        options = extend({}, options, { value: style.constants[value] });
    }

    if (valueSpec.function && isFunction(unbundle(value))) {
        return validateFunction(options);

    } else if (valueSpec.function && isExpression(unbundle.deep(value))) {
        return validateExpression(options);

    } else if (valueSpec.type && VALIDATORS[valueSpec.type]) {
        return VALIDATORS[valueSpec.type](options);

    } else {
        return validateObject(extend({}, options, {
            valueSpec: valueSpec.type ? styleSpec[valueSpec.type] : valueSpec
        }));
    }
};

},{"../error/validation_error":23,"../expression":40,"../function":52,"../util/extend":60,"../util/get_type":61,"../util/unbundle_jsonlint":64,"./validate_array":66,"./validate_boolean":67,"./validate_color":68,"./validate_constants":69,"./validate_enum":70,"./validate_expression":71,"./validate_filter":72,"./validate_function":73,"./validate_layer":75,"./validate_light":77,"./validate_number":78,"./validate_object":79,"./validate_source":82,"./validate_string":83}],66:[function(require,module,exports){

var getType = require('../util/get_type');
var validate = require('./validate');
var ValidationError = require('../error/validation_error');

module.exports = function validateArray(options) {
    var array = options.value;
    var arraySpec = options.valueSpec;
    var style = options.style;
    var styleSpec = options.styleSpec;
    var key = options.key;
    var validateArrayElement = options.arrayElementValidator || validate;

    if (getType(array) !== 'array') {
        return [new ValidationError(key, array, 'array expected, %s found', getType(array))];
    }

    if (arraySpec.length && array.length !== arraySpec.length) {
        return [new ValidationError(key, array, 'array length %d expected, length %d found', arraySpec.length, array.length)];
    }

    if (arraySpec['min-length'] && array.length < arraySpec['min-length']) {
        return [new ValidationError(key, array, 'array length at least %d expected, length %d found', arraySpec['min-length'], array.length)];
    }

    var arrayElementSpec = {
        "type": arraySpec.value
    };

    if (styleSpec.$version < 7) {
        arrayElementSpec.function = arraySpec.function;
    }

    if (getType(arraySpec.value) === 'object') {
        arrayElementSpec = arraySpec.value;
    }

    var errors = [];
    for (var i = 0; i < array.length; i++) {
        errors = errors.concat(validateArrayElement({
            array: array,
            arrayIndex: i,
            value: array[i],
            valueSpec: arrayElementSpec,
            style: style,
            styleSpec: styleSpec,
            key: (key + "[" + i + "]")
        }));
    }
    return errors;
};

},{"../error/validation_error":23,"../util/get_type":61,"./validate":65}],67:[function(require,module,exports){

var getType = require('../util/get_type');
var ValidationError = require('../error/validation_error');

module.exports = function validateBoolean(options) {
    var value = options.value;
    var key = options.key;
    var type = getType(value);

    if (type !== 'boolean') {
        return [new ValidationError(key, value, 'boolean expected, %s found', type)];
    }

    return [];
};

},{"../error/validation_error":23,"../util/get_type":61}],68:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var getType = require('../util/get_type');
var parseCSSColor = require('csscolorparser').parseCSSColor;

module.exports = function validateColor(options) {
    var key = options.key;
    var value = options.value;
    var type = getType(value);

    if (type !== 'string') {
        return [new ValidationError(key, value, 'color expected, %s found', type)];
    }

    if (parseCSSColor(value) === null) {
        return [new ValidationError(key, value, 'color expected, "%s" found', value)];
    }

    return [];
};

},{"../error/validation_error":23,"../util/get_type":61,"csscolorparser":7}],69:[function(require,module,exports){

var ValidationError = require('../error/validation_error');

module.exports = function validateConstants(options) {
    var key = options.key;
    var constants = options.value;

    if (constants) {
        return [new ValidationError(key, constants, 'constants have been deprecated as of v8')];
    } else {
        return [];
    }
};

},{"../error/validation_error":23}],70:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var unbundle = require('../util/unbundle_jsonlint');

module.exports = function validateEnum(options) {
    var key = options.key;
    var value = options.value;
    var valueSpec = options.valueSpec;
    var errors = [];

    if (Array.isArray(valueSpec.values)) { // <=v7
        if (valueSpec.values.indexOf(unbundle(value)) === -1) {
            errors.push(new ValidationError(key, value, 'expected one of [%s], %s found', valueSpec.values.join(', '), JSON.stringify(value)));
        }
    } else { // >=v8
        if (Object.keys(valueSpec.values).indexOf(unbundle(value)) === -1) {
            errors.push(new ValidationError(key, value, 'expected one of [%s], %s found', Object.keys(valueSpec.values).join(', '), JSON.stringify(value)));
        }
    }
    return errors;
};

},{"../error/validation_error":23,"../util/unbundle_jsonlint":64}],71:[function(require,module,exports){
//      

var ValidationError = require('../error/validation_error');
var ref = require('../expression');
var createExpression = ref.createExpression;
var createPropertyExpression = ref.createPropertyExpression;
var unbundle = require('../util/unbundle_jsonlint');

module.exports = function validateExpression(options     ) {
    var expression = (options.expressionContext === 'property' ? createPropertyExpression : createExpression)(unbundle.deep(options.value), options.valueSpec);
    if (expression.result !== 'error') {
        return [];
    }

    return expression.value.map(function (error) {
        return new ValidationError(("" + (options.key) + (error.key)), options.value, error.message);
    });
};

},{"../error/validation_error":23,"../expression":40,"../util/unbundle_jsonlint":64}],72:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var validateExpression = require('./validate_expression');
var validateEnum = require('./validate_enum');
var getType = require('../util/get_type');
var unbundle = require('../util/unbundle_jsonlint');
var extend = require('../util/extend');
var ref = require('../feature_filter');
var isExpressionFilter = ref.isExpressionFilter;

module.exports = function validateFilter(options) {
    if (isExpressionFilter(unbundle.deep(options.value))) {
        return validateExpression(extend({}, options, {
            expressionContext: 'filter',
            valueSpec: { value: 'boolean' }
        }));
    } else {
        return validateNonExpressionFilter(options);
    }
};

function validateNonExpressionFilter(options) {
    var value = options.value;
    var key = options.key;

    if (getType(value) !== 'array') {
        return [new ValidationError(key, value, 'array expected, %s found', getType(value))];
    }

    var styleSpec = options.styleSpec;
    var type;

    var errors = [];

    if (value.length < 1) {
        return [new ValidationError(key, value, 'filter array must have at least 1 element')];
    }

    errors = errors.concat(validateEnum({
        key: (key + "[0]"),
        value: value[0],
        valueSpec: styleSpec.filter_operator,
        style: options.style,
        styleSpec: options.styleSpec
    }));

    switch (unbundle(value[0])) {
    case '<':
    case '<=':
    case '>':
    case '>=':
        if (value.length >= 2 && unbundle(value[1]) === '$type') {
            errors.push(new ValidationError(key, value, '"$type" cannot be use with operator "%s"', value[0]));
        }
        /* falls through */
    case '==':
    case '!=':
        if (value.length !== 3) {
            errors.push(new ValidationError(key, value, 'filter array for operator "%s" must have 3 elements', value[0]));
        }
        /* falls through */
    case 'in':
    case '!in':
        if (value.length >= 2) {
            type = getType(value[1]);
            if (type !== 'string') {
                errors.push(new ValidationError((key + "[1]"), value[1], 'string expected, %s found', type));
            }
        }
        for (var i = 2; i < value.length; i++) {
            type = getType(value[i]);
            if (unbundle(value[1]) === '$type') {
                errors = errors.concat(validateEnum({
                    key: (key + "[" + i + "]"),
                    value: value[i],
                    valueSpec: styleSpec.geometry_type,
                    style: options.style,
                    styleSpec: options.styleSpec
                }));
            } else if (type !== 'string' && type !== 'number' && type !== 'boolean') {
                errors.push(new ValidationError((key + "[" + i + "]"), value[i], 'string, number, or boolean expected, %s found', type));
            }
        }
        break;

    case 'any':
    case 'all':
    case 'none':
        for (var i$1 = 1; i$1 < value.length; i$1++) {
            errors = errors.concat(validateNonExpressionFilter({
                key: (key + "[" + i$1 + "]"),
                value: value[i$1],
                style: options.style,
                styleSpec: options.styleSpec
            }));
        }
        break;

    case 'has':
    case '!has':
        type = getType(value[1]);
        if (value.length !== 2) {
            errors.push(new ValidationError(key, value, 'filter array for "%s" operator must have 2 elements', value[0]));
        } else if (type !== 'string') {
            errors.push(new ValidationError((key + "[1]"), value[1], 'string expected, %s found', type));
        }
        break;

    }

    return errors;
}

},{"../error/validation_error":23,"../feature_filter":49,"../util/extend":60,"../util/get_type":61,"../util/unbundle_jsonlint":64,"./validate_enum":70,"./validate_expression":71}],73:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var getType = require('../util/get_type');
var validate = require('./validate');
var validateObject = require('./validate_object');
var validateArray = require('./validate_array');
var validateNumber = require('./validate_number');
var unbundle = require('../util/unbundle_jsonlint');

module.exports = function validateFunction(options) {
    var functionValueSpec = options.valueSpec;
    var functionType = unbundle(options.value.type);
    var stopKeyType;
    var stopDomainValues = {};
    var previousStopDomainValue;
    var previousStopDomainZoom;

    var isZoomFunction = functionType !== 'categorical' && options.value.property === undefined;
    var isPropertyFunction = !isZoomFunction;
    var isZoomAndPropertyFunction =
        getType(options.value.stops) === 'array' &&
        getType(options.value.stops[0]) === 'array' &&
        getType(options.value.stops[0][0]) === 'object';

    var errors = validateObject({
        key: options.key,
        value: options.value,
        valueSpec: options.styleSpec.function,
        style: options.style,
        styleSpec: options.styleSpec,
        objectElementValidators: {
            stops: validateFunctionStops,
            default: validateFunctionDefault
        }
    });

    if (functionType === 'identity' && isZoomFunction) {
        errors.push(new ValidationError(options.key, options.value, 'missing required property "property"'));
    }

    if (functionType !== 'identity' && !options.value.stops) {
        errors.push(new ValidationError(options.key, options.value, 'missing required property "stops"'));
    }

    if (functionType === 'exponential' && options.valueSpec['function'] === 'piecewise-constant') {
        errors.push(new ValidationError(options.key, options.value, 'exponential functions not supported'));
    }

    if (options.styleSpec.$version >= 8) {
        if (isPropertyFunction && !options.valueSpec['property-function']) {
            errors.push(new ValidationError(options.key, options.value, 'property functions not supported'));
        } else if (isZoomFunction && !options.valueSpec['zoom-function'] && options.objectKey !== 'heatmap-color') {
            errors.push(new ValidationError(options.key, options.value, 'zoom functions not supported'));
        }
    }

    if ((functionType === 'categorical' || isZoomAndPropertyFunction) && options.value.property === undefined) {
        errors.push(new ValidationError(options.key, options.value, '"property" property is required'));
    }

    return errors;

    function validateFunctionStops(options) {
        if (functionType === 'identity') {
            return [new ValidationError(options.key, options.value, 'identity function may not have a "stops" property')];
        }

        var errors = [];
        var value = options.value;

        errors = errors.concat(validateArray({
            key: options.key,
            value: value,
            valueSpec: options.valueSpec,
            style: options.style,
            styleSpec: options.styleSpec,
            arrayElementValidator: validateFunctionStop
        }));

        if (getType(value) === 'array' && value.length === 0) {
            errors.push(new ValidationError(options.key, value, 'array must have at least one stop'));
        }

        return errors;
    }

    function validateFunctionStop(options) {
        var errors = [];
        var value = options.value;
        var key = options.key;

        if (getType(value) !== 'array') {
            return [new ValidationError(key, value, 'array expected, %s found', getType(value))];
        }

        if (value.length !== 2) {
            return [new ValidationError(key, value, 'array length %d expected, length %d found', 2, value.length)];
        }

        if (isZoomAndPropertyFunction) {
            if (getType(value[0]) !== 'object') {
                return [new ValidationError(key, value, 'object expected, %s found', getType(value[0]))];
            }
            if (value[0].zoom === undefined) {
                return [new ValidationError(key, value, 'object stop key must have zoom')];
            }
            if (value[0].value === undefined) {
                return [new ValidationError(key, value, 'object stop key must have value')];
            }
            if (previousStopDomainZoom && previousStopDomainZoom > unbundle(value[0].zoom)) {
                return [new ValidationError(key, value[0].zoom, 'stop zoom values must appear in ascending order')];
            }
            if (unbundle(value[0].zoom) !== previousStopDomainZoom) {
                previousStopDomainZoom = unbundle(value[0].zoom);
                previousStopDomainValue = undefined;
                stopDomainValues = {};
            }
            errors = errors.concat(validateObject({
                key: (key + "[0]"),
                value: value[0],
                valueSpec: { zoom: {} },
                style: options.style,
                styleSpec: options.styleSpec,
                objectElementValidators: { zoom: validateNumber, value: validateStopDomainValue }
            }));
        } else {
            errors = errors.concat(validateStopDomainValue({
                key: (key + "[0]"),
                value: value[0],
                valueSpec: {},
                style: options.style,
                styleSpec: options.styleSpec
            }, value));
        }

        return errors.concat(validate({
            key: (key + "[1]"),
            value: value[1],
            valueSpec: functionValueSpec,
            style: options.style,
            styleSpec: options.styleSpec
        }));
    }

    function validateStopDomainValue(options, stop) {
        var type = getType(options.value);
        var value = unbundle(options.value);

        var reportValue = options.value !== null ? options.value : stop;

        if (!stopKeyType) {
            stopKeyType = type;
        } else if (type !== stopKeyType) {
            return [new ValidationError(options.key, reportValue, '%s stop domain type must match previous stop domain type %s', type, stopKeyType)];
        }

        if (type !== 'number' && type !== 'string' && type !== 'boolean') {
            return [new ValidationError(options.key, reportValue, 'stop domain value must be a number, string, or boolean')];
        }

        if (type !== 'number' && functionType !== 'categorical') {
            var message = 'number expected, %s found';
            if (functionValueSpec['property-function'] && functionType === undefined) {
                message += '\nIf you intended to use a categorical function, specify `"type": "categorical"`.';
            }
            return [new ValidationError(options.key, reportValue, message, type)];
        }

        if (functionType === 'categorical' && type === 'number' && (!isFinite(value) || Math.floor(value) !== value)) {
            return [new ValidationError(options.key, reportValue, 'integer expected, found %s', value)];
        }

        if (functionType !== 'categorical' && type === 'number' && previousStopDomainValue !== undefined && value < previousStopDomainValue) {
            return [new ValidationError(options.key, reportValue, 'stop domain values must appear in ascending order')];
        } else {
            previousStopDomainValue = value;
        }

        if (functionType === 'categorical' && value in stopDomainValues) {
            return [new ValidationError(options.key, reportValue, 'stop domain values must be unique')];
        } else {
            stopDomainValues[value] = true;
        }

        return [];
    }

    function validateFunctionDefault(options) {
        return validate({
            key: options.key,
            value: options.value,
            valueSpec: functionValueSpec,
            style: options.style,
            styleSpec: options.styleSpec
        });
    }
};

},{"../error/validation_error":23,"../util/get_type":61,"../util/unbundle_jsonlint":64,"./validate":65,"./validate_array":66,"./validate_number":78,"./validate_object":79}],74:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var validateString = require('./validate_string');

module.exports = function(options) {
    var value = options.value;
    var key = options.key;

    var errors = validateString(options);
    if (errors.length) { return errors; }

    if (value.indexOf('{fontstack}') === -1) {
        errors.push(new ValidationError(key, value, '"glyphs" url must include a "{fontstack}" token'));
    }

    if (value.indexOf('{range}') === -1) {
        errors.push(new ValidationError(key, value, '"glyphs" url must include a "{range}" token'));
    }

    return errors;
};

},{"../error/validation_error":23,"./validate_string":83}],75:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var unbundle = require('../util/unbundle_jsonlint');
var validateObject = require('./validate_object');
var validateFilter = require('./validate_filter');
var validatePaintProperty = require('./validate_paint_property');
var validateLayoutProperty = require('./validate_layout_property');
var extend = require('../util/extend');

module.exports = function validateLayer(options) {
    var errors = [];

    var layer = options.value;
    var key = options.key;
    var style = options.style;
    var styleSpec = options.styleSpec;

    if (!layer.type && !layer.ref) {
        errors.push(new ValidationError(key, layer, 'either "type" or "ref" is required'));
    }
    var type = unbundle(layer.type);
    var ref = unbundle(layer.ref);

    if (layer.id) {
        var layerId = unbundle(layer.id);
        for (var i = 0; i < options.arrayIndex; i++) {
            var otherLayer = style.layers[i];
            if (unbundle(otherLayer.id) === layerId) {
                errors.push(new ValidationError(key, layer.id, 'duplicate layer id "%s", previously used at line %d', layer.id, otherLayer.id.__line__));
            }
        }
    }

    if ('ref' in layer) {
        ['type', 'source', 'source-layer', 'filter', 'layout'].forEach(function (p) {
            if (p in layer) {
                errors.push(new ValidationError(key, layer[p], '"%s" is prohibited for ref layers', p));
            }
        });

        var parent;

        style.layers.forEach(function (layer) {
            if (unbundle(layer.id) === ref) { parent = layer; }
        });

        if (!parent) {
            errors.push(new ValidationError(key, layer.ref, 'ref layer "%s" not found', ref));
        } else if (parent.ref) {
            errors.push(new ValidationError(key, layer.ref, 'ref cannot reference another ref layer'));
        } else {
            type = unbundle(parent.type);
        }
    } else if (type !== 'background') {
        if (!layer.source) {
            errors.push(new ValidationError(key, layer, 'missing required property "source"'));
        } else {
            var source = style.sources && style.sources[layer.source];
            var sourceType = source && unbundle(source.type);
            if (!source) {
                errors.push(new ValidationError(key, layer.source, 'source "%s" not found', layer.source));
            } else if (sourceType === 'vector' && type === 'raster') {
                errors.push(new ValidationError(key, layer.source, 'layer "%s" requires a raster source', layer.id));
            } else if (sourceType === 'raster' && type !== 'raster') {
                errors.push(new ValidationError(key, layer.source, 'layer "%s" requires a vector source', layer.id));
            } else if (sourceType === 'vector' && !layer['source-layer']) {
                errors.push(new ValidationError(key, layer, 'layer "%s" must specify a "source-layer"', layer.id));
            }
        }
    }

    errors = errors.concat(validateObject({
        key: key,
        value: layer,
        valueSpec: styleSpec.layer,
        style: options.style,
        styleSpec: options.styleSpec,
        objectElementValidators: {
            '*': function() {
                return [];
            },
            filter: validateFilter,
            layout: function(options) {
                return validateObject({
                    layer: layer,
                    key: options.key,
                    value: options.value,
                    style: options.style,
                    styleSpec: options.styleSpec,
                    objectElementValidators: {
                        '*': function(options) {
                            return validateLayoutProperty(extend({layerType: type}, options));
                        }
                    }
                });
            },
            paint: function(options) {
                return validateObject({
                    layer: layer,
                    key: options.key,
                    value: options.value,
                    style: options.style,
                    styleSpec: options.styleSpec,
                    objectElementValidators: {
                        '*': function(options) {
                            return validatePaintProperty(extend({layerType: type}, options));
                        }
                    }
                });
            }
        }
    }));

    return errors;
};

},{"../error/validation_error":23,"../util/extend":60,"../util/unbundle_jsonlint":64,"./validate_filter":72,"./validate_layout_property":76,"./validate_object":79,"./validate_paint_property":80}],76:[function(require,module,exports){

var validateProperty = require('./validate_property');

module.exports = function validateLayoutProperty(options) {
    return validateProperty(options, 'layout');
};

},{"./validate_property":81}],77:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var getType = require('../util/get_type');
var validate = require('./validate');

module.exports = function validateLight(options) {
    var light = options.value;
    var styleSpec = options.styleSpec;
    var lightSpec = styleSpec.light;
    var style = options.style;

    var errors = [];

    var rootType = getType(light);
    if (light === undefined) {
        return errors;
    } else if (rootType !== 'object') {
        errors = errors.concat([new ValidationError('light', light, 'object expected, %s found', rootType)]);
        return errors;
    }

    for (var key in light) {
        var transitionMatch = key.match(/^(.*)-transition$/);

        if (transitionMatch && lightSpec[transitionMatch[1]] && lightSpec[transitionMatch[1]].transition) {
            errors = errors.concat(validate({
                key: key,
                value: light[key],
                valueSpec: styleSpec.transition,
                style: style,
                styleSpec: styleSpec
            }));
        } else if (lightSpec[key]) {
            errors = errors.concat(validate({
                key: key,
                value: light[key],
                valueSpec: lightSpec[key],
                style: style,
                styleSpec: styleSpec
            }));
        } else {
            errors = errors.concat([new ValidationError(key, light[key], 'unknown property "%s"', key)]);
        }
    }

    return errors;
};

},{"../error/validation_error":23,"../util/get_type":61,"./validate":65}],78:[function(require,module,exports){

var getType = require('../util/get_type');
var ValidationError = require('../error/validation_error');

module.exports = function validateNumber(options) {
    var key = options.key;
    var value = options.value;
    var valueSpec = options.valueSpec;
    var type = getType(value);

    if (type !== 'number') {
        return [new ValidationError(key, value, 'number expected, %s found', type)];
    }

    if ('minimum' in valueSpec && value < valueSpec.minimum) {
        return [new ValidationError(key, value, '%s is less than the minimum value %s', value, valueSpec.minimum)];
    }

    if ('maximum' in valueSpec && value > valueSpec.maximum) {
        return [new ValidationError(key, value, '%s is greater than the maximum value %s', value, valueSpec.maximum)];
    }

    return [];
};

},{"../error/validation_error":23,"../util/get_type":61}],79:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var getType = require('../util/get_type');
var validateSpec = require('./validate');

module.exports = function validateObject(options) {
    var key = options.key;
    var object = options.value;
    var elementSpecs = options.valueSpec || {};
    var elementValidators = options.objectElementValidators || {};
    var style = options.style;
    var styleSpec = options.styleSpec;
    var errors = [];

    var type = getType(object);
    if (type !== 'object') {
        return [new ValidationError(key, object, 'object expected, %s found', type)];
    }

    for (var objectKey in object) {
        var elementSpecKey = objectKey.split('.')[0]; // treat 'paint.*' as 'paint'
        var elementSpec = elementSpecs[elementSpecKey] || elementSpecs['*'];

        var validateElement = (void 0);
        if (elementValidators[elementSpecKey]) {
            validateElement = elementValidators[elementSpecKey];
        } else if (elementSpecs[elementSpecKey]) {
            validateElement = validateSpec;
        } else if (elementValidators['*']) {
            validateElement = elementValidators['*'];
        } else if (elementSpecs['*']) {
            validateElement = validateSpec;
        } else {
            errors.push(new ValidationError(key, object[objectKey], 'unknown property "%s"', objectKey));
            continue;
        }

        errors = errors.concat(validateElement({
            key: (key ? (key + ".") : key) + objectKey,
            value: object[objectKey],
            valueSpec: elementSpec,
            style: style,
            styleSpec: styleSpec,
            object: object,
            objectKey: objectKey
        }, object));
    }

    for (var elementSpecKey$1 in elementSpecs) {
        if (elementSpecs[elementSpecKey$1].required && elementSpecs[elementSpecKey$1]['default'] === undefined && object[elementSpecKey$1] === undefined) {
            errors.push(new ValidationError(key, object, 'missing required property "%s"', elementSpecKey$1));
        }
    }

    return errors;
};

},{"../error/validation_error":23,"../util/get_type":61,"./validate":65}],80:[function(require,module,exports){

var validateProperty = require('./validate_property');

module.exports = function validatePaintProperty(options) {
    return validateProperty(options, 'paint');
};

},{"./validate_property":81}],81:[function(require,module,exports){

var validate = require('./validate');
var ValidationError = require('../error/validation_error');
var getType = require('../util/get_type');

module.exports = function validateProperty(options, propertyType) {
    var key = options.key;
    var style = options.style;
    var styleSpec = options.styleSpec;
    var value = options.value;
    var propertyKey = options.objectKey;
    var layerSpec = styleSpec[(propertyType + "_" + (options.layerType))];

    if (!layerSpec) { return []; }

    var transitionMatch = propertyKey.match(/^(.*)-transition$/);
    if (propertyType === 'paint' && transitionMatch && layerSpec[transitionMatch[1]] && layerSpec[transitionMatch[1]].transition) {
        return validate({
            key: key,
            value: value,
            valueSpec: styleSpec.transition,
            style: style,
            styleSpec: styleSpec
        });
    }

    var valueSpec = options.valueSpec || layerSpec[propertyKey];
    if (!valueSpec) {
        return [new ValidationError(key, value, 'unknown property "%s"', propertyKey)];
    }

    var tokenMatch;
    if (getType(value) === 'string' && valueSpec['property-function'] && !valueSpec.tokens && (tokenMatch = /^{([^}]+)}$/.exec(value))) {
        return [new ValidationError(
            key, value,
            '"%s" does not support interpolation syntax\n' +
                'Use an identity property function instead: `{ "type": "identity", "property": %s` }`.',
            propertyKey, JSON.stringify(tokenMatch[1])
        )];
    }

    var errors = [];

    if (options.layerType === 'symbol') {
        if (propertyKey === 'text-field' && style && !style.glyphs) {
            errors.push(new ValidationError(key, value, 'use of "text-field" requires a style "glyphs" property'));
        }
    }

    return errors.concat(validate({
        key: options.key,
        value: value,
        valueSpec: valueSpec,
        style: style,
        styleSpec: styleSpec,
        expressionContext: 'property'
    }));
};

},{"../error/validation_error":23,"../util/get_type":61,"./validate":65}],82:[function(require,module,exports){

var ValidationError = require('../error/validation_error');
var unbundle = require('../util/unbundle_jsonlint');
var validateObject = require('./validate_object');
var validateEnum = require('./validate_enum');

module.exports = function validateSource(options) {
    var value = options.value;
    var key = options.key;
    var styleSpec = options.styleSpec;
    var style = options.style;

    if (!value.type) {
        return [new ValidationError(key, value, '"type" is required')];
    }

    var type = unbundle(value.type);
    var errors = [];

    switch (type) {
    case 'vector':
    case 'raster':
        errors = errors.concat(validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec[("source_" + type)],
            style: options.style,
            styleSpec: styleSpec
        }));
        if ('url' in value) {
            for (var prop in value) {
                if (['type', 'url', 'tileSize'].indexOf(prop) < 0) {
                    errors.push(new ValidationError((key + "." + prop), value[prop], 'a source with a "url" property may not include a "%s" property', prop));
                }
            }
        }
        return errors;

    case 'geojson':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_geojson,
            style: style,
            styleSpec: styleSpec
        });

    case 'video':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_video,
            style: style,
            styleSpec: styleSpec
        });

    case 'image':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_image,
            style: style,
            styleSpec: styleSpec
        });

    case 'canvas':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_canvas,
            style: style,
            styleSpec: styleSpec
        });

    default:
        return validateEnum({
            key: (key + ".type"),
            value: value.type,
            valueSpec: {values: ['vector', 'raster', 'geojson', 'video', 'image', 'canvas']},
            style: style,
            styleSpec: styleSpec
        });
    }
};

},{"../error/validation_error":23,"../util/unbundle_jsonlint":64,"./validate_enum":70,"./validate_object":79}],83:[function(require,module,exports){

var getType = require('../util/get_type');
var ValidationError = require('../error/validation_error');

module.exports = function validateString(options) {
    var value = options.value;
    var key = options.key;
    var type = getType(value);

    if (type !== 'string') {
        return [new ValidationError(key, value, 'string expected, %s found', type)];
    }

    return [];
};

},{"../error/validation_error":23,"../util/get_type":61}],84:[function(require,module,exports){
(function (Buffer){

var validateStyleMin = require('./validate_style.min');
var ParsingError = require('./error/parsing_error');
var jsonlint = require('jsonlint-lines-primitives');

/**
 * Validate a Mapbox GL style against the style specification.
 *
 * @private
 * @alias validate
 * @param {Object|String|Buffer} style The style to be validated. If a `String`
 *     or `Buffer` is provided, the returned errors will contain line numbers.
 * @param {Object} [styleSpec] The style specification to validate against.
 *     If omitted, the spec version is inferred from the stylesheet.
 * @returns {Array<ValidationError|ParsingError>}
 * @example
 *   var validate = require('mapbox-gl-style-spec').validate;
 *   var style = fs.readFileSync('./style.json', 'utf8');
 *   var errors = validate(style);
 */

module.exports = function validateStyle(style, styleSpec) {
    var index = require('./style-spec');

    if (style instanceof String || typeof style === 'string' || style instanceof Buffer) {
        try {
            style = jsonlint.parse(style.toString());
        } catch (e) {
            return [new ParsingError(e)];
        }
    }

    styleSpec = styleSpec || index.v8;

    return validateStyleMin(style, styleSpec);
};

exports.source = validateStyleMin.source;
exports.light = validateStyleMin.light;
exports.layer = validateStyleMin.layer;
exports.filter = validateStyleMin.filter;
exports.paintProperty = validateStyleMin.paintProperty;
exports.layoutProperty = validateStyleMin.layoutProperty;

}).call(this,require("buffer").Buffer)
},{"./error/parsing_error":22,"./style-spec":57,"./validate_style.min":85,"buffer":6,"jsonlint-lines-primitives":11}],85:[function(require,module,exports){

var validateConstants = require('./validate/validate_constants');
var validate = require('./validate/validate');
var latestStyleSpec = require('./reference/latest');
var validateGlyphsURL = require('./validate/validate_glyphs_url');

/**
 * Validate a Mapbox GL style against the style specification. This entrypoint,
 * `mapbox-gl-style-spec/lib/validate_style.min`, is designed to produce as
 * small a browserify bundle as possible by omitting unnecessary functionality
 * and legacy style specifications.
 *
 * @private
 * @param {Object} style The style to be validated.
 * @param {Object} [styleSpec] The style specification to validate against.
 *     If omitted, the latest style spec is used.
 * @returns {Array<ValidationError>}
 * @example
 *   var validate = require('mapbox-gl-style-spec/lib/validate_style.min');
 *   var errors = validate(style);
 */
function validateStyleMin(style, styleSpec) {
    styleSpec = styleSpec || latestStyleSpec;

    var errors = [];

    errors = errors.concat(validate({
        key: '',
        value: style,
        valueSpec: styleSpec.$root,
        styleSpec: styleSpec,
        style: style,
        objectElementValidators: {
            glyphs: validateGlyphsURL,
            '*': function() {
                return [];
            }
        }
    }));

    if (style.constants) {
        errors = errors.concat(validateConstants({
            key: 'constants',
            value: style.constants,
            style: style,
            styleSpec: styleSpec
        }));
    }

    return sortErrors(errors);
}

validateStyleMin.source = wrapCleanErrors(require('./validate/validate_source'));
validateStyleMin.light = wrapCleanErrors(require('./validate/validate_light'));
validateStyleMin.layer = wrapCleanErrors(require('./validate/validate_layer'));
validateStyleMin.filter = wrapCleanErrors(require('./validate/validate_filter'));
validateStyleMin.paintProperty = wrapCleanErrors(require('./validate/validate_paint_property'));
validateStyleMin.layoutProperty = wrapCleanErrors(require('./validate/validate_layout_property'));

function sortErrors(errors) {
    return [].concat(errors).sort(function (a, b) {
        return a.line - b.line;
    });
}

function wrapCleanErrors(inner) {
    return function() {
        return sortErrors(inner.apply(this, arguments));
    };
}

module.exports = validateStyleMin;

},{"./reference/latest":55,"./validate/validate":65,"./validate/validate_constants":69,"./validate/validate_filter":72,"./validate/validate_glyphs_url":74,"./validate/validate_layer":75,"./validate/validate_layout_property":76,"./validate/validate_light":77,"./validate/validate_paint_property":80,"./validate/validate_source":82}],86:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":87}],87:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],88:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],89:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],90:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],91:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":89,"./encode":90}],92:[function(require,module,exports){
/*!
 * sort-asc <https://github.com/helpers/sort-asc>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

module.exports = function (a, b) {
  return b < a ? -1 : 1;
};
},{}],93:[function(require,module,exports){
/*!
 * sort-desc <https://github.com/helpers/sort-desc>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

module.exports = function (a, b) {
  return a < b ? -1 : 1;
};
},{}],94:[function(require,module,exports){
/*!
 * sort-keys <https://github.com/helpers/sort-keys>
 *
 * Copyright (c) 2014 Brian Woodward, Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var sortDesc = require('sort-desc');
var sortAsc = require('sort-asc');


module.exports = function (obj, options) {
  var sort = {desc: sortDesc, asc: sortAsc};
  var fn, opts = {}, keys = Object.keys(obj);

  // if `options` is an array, assume it's keys
  if (Array.isArray(options)) {
    opts.keys = options;
    options = {};

  // if `options` is a function, assume it's a sorting function
  } else if (typeof options === 'function') {
    fn = options;
  } else {
    for (var opt in options) {
      if (options.hasOwnProperty(opt)) {
        opts[opt] = options[opt]
      }
    }
  }

  // Default sort order is descending
  fn = opts.sort || sortDesc;

  if (Boolean(opts.sortOrder)) {
    fn = sort[opts.sortOrder.toLowerCase()];
  }

  if (Boolean(opts.sortBy)) {
    keys = opts.sortBy(obj);
    fn = null;
  }

  if (Boolean(opts.keys)) {
    keys = opts.keys;
    if (!opts.sort && !opts.sortOrder && !opts.sortBy) {
      fn = null;
    }
  }

  if (fn) {
    keys = keys.sort(fn);
  }

  var o = {};
  var len = keys.length;
  var i = -1;

  while (++i < len) {
    o[keys[i]] = obj[keys[i]];
  }

  return o;
};
},{"sort-asc":92,"sort-desc":93}],95:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":96,"punycode":88,"querystring":91}],96:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],97:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],98:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],99:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":98,"_process":87,"inherits":97}]},{},[1])(1)
});