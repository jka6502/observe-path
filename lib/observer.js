
var observers = {};


/**
 * A cooperative property change observer, to monitor for changes in a property
 * that may be observed multiple times, and may or may not have an existing
 * getter/setter descriptor applied.
 */
export default class Observer {


	/**
	 * Observe a specified `property` on a given `object`, and invoke the
	 * `callback` passed when any changes occur.
	 *
	 * @param {Object}		object		The `object` to observe on.
	 * @param {String}		property	The `property` name or `Symbol`.
	 * @param {Function}	callback	The `callback` to invoke on change.
	 *
	 * @return {Observer}	The `Observer` instance handling this observation.
	 */
	static observe(object, property, callback) {
		var map			= this.getMap(property, true),
			observer	= map.get(object);

		if (!observer) {
			observer = new Observer(object, property);
			map.set(object, observer);
		}

		return observer.add(callback);
	}


	/**
	 * Stop the `callback` specified from receiving change events from the
	 * `property` of the `object` given.
	 *
	 * @param {Object}		object		The `object` to stop observing.
	 * @param {String}		property	The `property` name or `Symbol`.
	 * @param {Function}	callback	The `callback` to remove.
	 */
	static unobserve(object, property, callback) {
		var map			= this.getMap(property, false),
			observer	= map ? map.get(object) : null;

		if (!observer) {
			return;
		}

		observer.remove(callback);
	}


	// ----------------------------- PRIVATE API -------------------------------


	/**
	 * Construct a new `Observer` to observe the `property` given on the
	 * `target` `Object` specified.
	 *
	 * This constructor is private, and should only be used internally by the
	 * `Observer` class.  This functionality should be accessed via the static
	 * `observe` and `unobserve` methods instead.
	 *
	 * @param {Object}	target		The `target` `Object` to observe.
	 * @param {String}	property	The `property` name or `Symbol` to observe.
	 */
	constructor(target, property) {
		var definition = Object.getOwnPropertyDescriptor(target, property) || {
				enumerable:	true,
				writable:	true,
				value:		undefined
			},
			{ get, set, value, writable, enumerable } = definition;

		this.callbacks		= [];
		this.value			= value;

		// Short circuit for read-only properties - still maintain callback
		// array, so that add and remove work as expected, but no definition is
		// required as change events simply cannot fire.
		if (!writable || (get && !set)) {
			return;
		}

		this.target			= target;
		this.property		= property;
		this.definition		= definition;

		Object.defineProperty(target, property, {

			enumerable:		!!enumerable,
			configurable:	true,

			set: 			this.set.bind(this),
			get: 			get || this.get.bind(this),

		});
	}


	/**
	 * Register the `callback` supplied with this `Observer`, to be notified of
	 * changes in the property being observed.
	 *
	 * @param {Function} callback	The `callback` to register.
	 *
	 * @return {Observer} this
	 */
	add(callback) {
		this.callbacks.push(callback);
		return this;
	}


	/**
	 * Remove the `callback` specified from this `Observer`, so that it will no
	 * longer be notified of any changes to the observed property.
	 *
	 * @param {Function} callback	The `callback` to remove.
	 *
	 * @return {boolean} `true` if the callback was found and removed.
	 */
	remove(callback) {
		var index = this.callbacks.indexOf(callback);
		if (index === -1) {
			return false;
		}

		this.callbacks.splice(index, 1);

		if (this.callbacks.length === 0) {
			this.dispose();

			if (this.definition) {
				observers[this.property].delete(this.target);
			}
		}

		return true;
	}


	/**
	 * Dispose of this `Observer`, removing any instrumentation from the target
	 * `Object`, and ensuring no further change events will be received.
	 */
	dispose() {
		var definition = this.definition;

		// Special case, read only property, so no changes made.
		if (!definition) {
			return;
		}

		if (definition.hasOwnProperty('value')) {
			definition.value = this.value;
		}

		Object.defineProperty(this.target, this.property, definition);
	}


	/**
	 * Set the value of the property.
	 *
	 * @param {any} 	value	The `value` to set this property to.
	 * @param {boolean}	silent	If `true`, callbacks will not be invoked.
	 */
	set(value, silent) {
		var target	= this.target,
			set		= this.definition.set;

		if (this.value === value) {
			return;
		}

		if (!silent) {

			for(let callback of this.callbacks) {
				callback(target, value);
			}

		}

		this.value = value;

		if (set) {
			set.call(target, value);
		}
	}


	/**
	 * Get the value of the property observed.  This method is internal, and
	 * should *NOT* be used directly.  Properties should be accessed via the
	 * normal javascript dot or array notation, so that overwritten getters can
	 * be correctly invoked.
	 *
	 * @return {any} The current value of the property observed.
	 */
	get() {
		return this.value;
	}


	/**
	 * Obtain the `WeakMap` for a given property, mapping target `Object`s to
	 * existing `Observer` instances.
	 *
	 * @param {String}	property	The name or `Symbol` of the property.
	 * @param {boolean}	create		Whether to create the map, if missing.
	 *
	 * @return {WeakMap}	The map associated with the property, or null.
	 */
	static getMap(property, create) {
		var map = observers[property];
		if (!map && create) {
			map = observers[property] = new WeakMap();
		}
		return map;
	}


}
