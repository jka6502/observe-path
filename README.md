# observe-path

> `Object.defineProperty` based path observation, in ES6 style.

`observe-path` is a property change observation library designed to allow
explicit binding of property change callbacks to a given path from a root
object.

It is written in ES6, so needs to be transpiled using (babel)[https://babeljs.io]
or (traceur)[https://github.com/google/traceur-compiler], or a similar tool if
your browser or (Node.js)[https://nodejs.org/] does not yet support the required
ES6 features.

`observe-path` is designed for explicit path binding - it cannot observe
property additions, or arbitrary array modifications, the path bound must be
known prior to observation.  The path can, however, be broken, reformed, or
changed in any way and continue to provide change notifications.

`Object.defineProperty` is used to observe changes at each path segment, for
several reasons:

- It is fast in most current JavaScript engines
	- simple microbenchmarks vs direct property access give ~350% execution time for reading observed properties in v8 and IonMonkey, and ~800% execution time for writing observed properties (with a single empty change callback function).
	- with the exception of Chakra in IE11-, rough microbenchmarking shows 3
	orders of magnitude difference there.
- It is less surprising than the event loop turn based `Object.observe`, giving immediate response capability.
- It is more widely available than `Object.observe`, which, at the time of writing is only available in v8 and not polyfillable, `Object.defineProperty` is supported pretty much universally.

`observe-path` is highly cooperative - it respects existing property descriptors,
passing through `set` operations to existing setters, fetching from existing
getters, and tidying up behind itself when observation is no longer required.

It is also designed to be efficient and fast when paths are applied many times,
caching common state on prototypes, front-loading the work of observation to the
declaration point - to keep actual observation lean.


## Install

```sh
npm install observe-path
```

## Testing

Change your working directory to the `observe-path` directory, and ensure `dev`
dependencies are installed.

```sh
cd node_modules/observe-path
npm install
```

To run nodejs tests:

```sh
npm test
```

To perform web browser tests:

```sh
npm test web
```

And visit the testem URL provided.


## Usage

Import the library, create a `Path` instance, and `observe` that path from a
specified root object:

```js
import Path from 'observe-path/lib/path';

var path = new Path(['a', 'b', 'c', someSymbol]);

path.observe(someObject, (value, old) => {
	// React to value change.
});
```

The `change callback` will be invoked on any property change, with the new and
previous values supplied.  This callback is guaranteed to only be called once
per value change, even if intermediary path segments change, but the final
value does not (if you wish to hear about intermediary property changes, observe
them instead!).
