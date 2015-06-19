import Observer from './observer';


/**
 * A `Link` instance represents a single link in an active `Path` chain,
 * handling management of the actual property observation, and chain
 * re-evaluation when changes occur.
 */
export default class Link {


	/**
	 * Construct a new instance of a `Link`, and populate the full chain, to
	 * monitor the state of the `root` object passed.
	 *
	 * @param {Object} root	The root object to monitor for changes.
	 */
	constructor(root, chained) {
		if (this.NextLink) {
			this.next = new this.NextLink(root, true);
		}

		this.root		= root;
		this.change 	= this.change.bind(this);

		if (!chained) {
			this.setLast();
		}
	}


	/**
	 * Attach this `Link` instance to the `target` object specified,
	 * monitoring its appropriate property for changes.
	 *
	 * This method also attaches any following `Link`s to the appropriate
	 * objects along the path, until it reaches an object without a suitable
	 * property, or the final value of the path.
	 *
	 * @param {Object} target	The target object to monitor.
	 *
	 * @return {any} The current value at the path represented by this chain.
	 */
	attach(target) {
		if (this.observer) {
			this.detach();
		}

		var observer	= Observer.observe(target, this.part, this.change),
			value		= observer.get();

		this.observer = observer;

		if (this.next) {

			if (value) {
				return this.next.attach(value);
			}

			return undefined;
		}

		return value;
	}


	/**
	 * Detach this `Link` from the instance it is currently monitoring, and
	 * detach all `Link`s further along the same path.
	 */
	detach() {
		if (!this.observer) {
			return;
		}

		this.observer.remove(this.change);

		if (this.next) {
			this.next.detach();
		}
	}


	/**
	 * Callback handler for a change in the current `target`'s `value`.
	 *
	 * This method should only be used internally, and is automatically bound
	 * to the `Link` instance on creation, in order to allow access to
	 * the relevant internal state.
	 *
	 * @param {Object}	target	The target object currently bound.
	 * @param {any}		value	The new value associated with the property.
	 */
	change(target, value) {
		var existing	= this.observer.get(),
			next		= this.next,
			result		= value;

		if (existing === value) {
			return;
		}

		if (next && result) {
			if (typeof result === 'object' || typeof result === 'function') {
				result = next.attach(result);
			}else{
				// Primitive on the path, prevents full resolution.
				result = undefined;
			}
		}

		this.path.change(this.root, result);
	}


	/**
	 * Update each `Link` in this path chain with a reference to the last
	 * `Link` in the chain, so that it can be rapidly accessed to resolve the
	 * resultant value of the whole path.
	 */
	setLast() {
		return this.last = this.next ? this.next.setLast() : this;
	}


	/**
	 * Set the value of the property currently monitored by this `Link`
	 * silently, that is, without triggering any change callbacks associated.
	 *
	 * @param {any} 	value	The `value` to set the property to.
	 * @param {boolean}	silent	If `true`, callbacks will not be invoked.
	 */
	set(value, silent) {
		var observer = this.observer;

		if (!observer) {
			return false;
		}

		observer.set(value, silent);
		return true;
	}


	/**
	 * Define a subclass of `Link` with the appropriate immutable values bound
	 * to its prototype.  This approach lowers the memory footprint, and
	 * allocation cost of bindings when the same paths are used many times, as
	 * common path information is shared on the singleton prototype, with each
	 * instance only requiring storage for unique information.
	 *
	 * @param {Path}		path		The path that 'owns' this `Link`.
	 * @param {String}		part		The property name, or `Symbol` observed.
	 * @param {Function}	NextLink	The class for the next `Link`.
	 *
	 * @return {Function}	The constructor of the new subclass.
	 */
	static define(path, part, NextLink) {
		class PathLink extends Link {};

		var prototype = PathLink.prototype;

		prototype.path			= path;
		prototype.part			= part;
		prototype.NextLink		= NextLink;

		return PathLink;
	}


}
