
import Link from './link';


/**
 * Path observer, capable of monitoring a chain of properties, and reporting on
 * the final value, or any changes to the final value.
 */
export default class Path {


	/**
	 * Construct a new `Path` to observe a specified property chain.
	 *
	 * @param {String} path A list of property names, or `Symbol`s.
	 */
	constructor(...path) {
		this.path			= path;
		this.callbacks		= [];
		this.observed		= new WeakMap();

		var next = null;
		for(var index = path.length - 1; index > -1; index--) {
			next = Link.define(this, path[index], next);
		}

		this.FirstLink	= next;
	}


	/**
	 * Observe this path, starting from the `root` `Object` specified, and call
	 * the `callback` specified, with the old and new values as parameters when
	 * the final value changes.
	 *
	 * The callback should be `function` that takes two parameters, like so:
	 *
	 * ```js
	 * function callback(old, value) { ... }
	 * ```
	 *
	 * @param {Object}		root		The `root` `Object` to observe..
	 * @param {Function}	callback	The `callback` to invoke on change.
	 */
	observe(root, callback) {
		if (!root) {
			throw new Error('Cannot bind to undefined value');
		}

		var link = this.observed.get(root);

		if (!link) {
			link = new this.FirstLink(root);
			this.observed.set(root, link);

			link.callbacks	= [ callback ];
			link.value		= link.attach(root);

		}else{
			link.callbacks.push(callback);
		}
	}


	/**
	 * Stop observing this path for the given `root` object and `callback`
	 * combination.  After calling this, the `callback` specified will no longer
	 * receive change events.
	 *
	 * @param {Object}		root		The `root` `Object` previously registered.
	 * @param {Function}	callback	The `callback` function to deregister.
	 *
	 * @return {boolean} `true` if the `callback` was found and removed.
	 */
	unobserve(root, callback) {
		if (!root) {
			return false;
		}

		var link = this.observed.get(root);

		if (!link) {
			return false;
		}

		var callbacks	= link.callbacks,
			index		= callbacks.indexOf(callback);

		if (index === -1) {
			return false;
		}

		callbacks.splice(index, 1);

		if (callbacks.length === 0) {
			link.detach();
			this.observed.delete(root);
		}

		return true;
	}


	/**
	 * Obtain the resolved value of this path, from the `root` `Object` given.
	 *
	 * This method will traverse the path described by this `Path` instance, and
	 * return the finalised value, or `undefined`, if any of the properties in
	 * the path are missing.
	 *
	 * @param {Object} root	The `root` `Object` to begin traversing from.
	 *
	 * @return {any}	The resolved value at the end of this `Path`.
	 */
	get(root) {
		var link = this.observed.get(root);

		if (link) {
			return link.value;
		}

		for(let part of this.path) {
			root = root[part];
			if (!root) {
				return root;
			}
		}

		return root;
	}


	/**
	 * Set the resolved value of this `Path`, starting from the `root` `Object`
	 * given to the `value` passed.  This method will not  fail or throw if
	 * properties along this path are missing, instead returning `false` to
	 * indicate that the value could not be set.
	 *
	 * @param {Object}	root	The `root` `Object` to traverse from.
	 * @param {any}		value	The new resolved value to set.
	 * @param {boolean}	silent	If `true`, callbacks will not be invoked.
	 *
	 * @return {boolean} `true` if the value was set, false if not.
	 */
	set(root, value, silent) {
		var link = this.observed.get(root);

		if (!link || !link.last.set(value, silent)) {
			return false;
		}

		link.value = value;
		return true;
	}


	// ----------------------------- PRIVATE API -------------------------------


	/**
	 * Callback handler for a change in the final property value for a `Path`.
	 *
	 * This method is internal and should only be invoked by the `Path` class
	 * itself.
	 *
	 * @param {Object}	root	The `root` from which the change occurred.
	 * @param {any}		value	The new `value` the path resolves to.
	 */
	change(root, value) {
		var link	= this.observed.get(root),
			old		= link.value;

		if (!link) {
			throw new Error('Event fired on unbound path');
		}

		if (old !== value) {
			for(let callback of link.callbacks) {
				callback(value, old);
			}
			link.value = value;
		}
	}


}
