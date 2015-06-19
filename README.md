# observe-path

`Object.defineProperty` based path observation, in ES6 style.

## Install

```sh
npm install observe-path
```

## Testing

For node tests:

```sh
npm test
```

For web tests:

```sh
npm test web
```


## Usage

Import the library, create a `Path` instance, and `observe` that path from a
specified root object:

```js
import Path from 'observe-path/lib/path';

var path = new Path(['a', 'b', 'c', someSymbol]);

path.observe(someObject, (old, value) => {
	// React to value change.
});
```
