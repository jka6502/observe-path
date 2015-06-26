
import should	from 'should/should';
import Observer	from 'lib/observer';


describe('Observer', () => {


	it('should observe a property on an Object', () => {

		var object = { a: 7 };

		Observer.observe(object, 'a', () => {});

	});


	it('should preserve the value of an observed property', () => {

		var object = { a: 7 };

		Observer.observe(object, 'a', () => {});

		object.a.should.equal(7);
	});


	it('should preserve the getter of an observed property', () => {

		// Don't ever do this - but it proves the getter is preserved!
		var count = 4, object = { get a() { return count++; } };

		Observer.observe(object, 'a', () => {});

		object.a.should.equal(4);
		object.a.should.equal(5);
	});


	it('should chain the original setter on an observed property', () => {

		var object = {}, called = 0;

		function get() {}
		function set(next) { called++; }

		Object.defineProperty(object, 'a', {
			enumerable:		true,
			configurable:	true,
			get:			get,
			set:			set
		});

		function observer(object, value) {}

		Observer.observe(object, 'a', observer);

		object.a = 12;
		called.should.equal(1);

	});

	it('should chain a setter from an observed property\'s prototype chain', () => {

		var parent = {}, called = 0;

		function get() {}
		function set(next) { called++; }

		Object.defineProperty(parent, 'a', {
			enumerable:		true,
			configurable:	true,
			get:			get,
			set:			set
		});

		var object = Object.create(parent);

		function observer(object, value) {}

		Observer.observe(object, 'a', observer);

		object.a = 12;
		called.should.equal(1);

	});


	it('should observe changes to a property', () => {

		var value = 4, object = { a: value };

		Observer.observe(object, 'a', (object, changed) => { value = changed; });

		object.a.should.equal(value);

		object.a = 17;

		object.a.should.equal(17);
		object.a.should.equal(value);
	});


	it('should observe multiple changes to a property', () => {

		var value = 4, object = { a: value };

		Observer.observe(object, 'a', (object, changed) => { value = changed; });

		object.a.should.equal(value);

		object.a = 12;

		object.a.should.equal(12);
		object.a.should.equal(value);

		object.a = 'test';

		object.a.should.equal('test');
		object.a.should.equal(value);

		var target = {};
		object.a = target;

		object.a.should.equal(target);
		object.a.should.equal(value);

	});


	it('should fire events only once per change', () => {

		var changes = 0, object = { a: 1 };

		Observer.observe(object, 'a', (object, changed) => { changes++; });

		changes.should.equal(0);

		object.a = 12;
		changes.should.equal(1);

		object.a = 12;
		changes.should.equal(1);

		object.a = 'test';
		changes.should.equal(2);

		object.a = 'test';
		changes.should.equal(2);

		object.a = {};
		changes.should.equal(3);

	});


	it('should allow multiple listeners per property', () => {

		var object = { a: 0 };

		var changes1 = 0, value1 = null,
			changes2 = 0, value2 = null,
			changes3 = 0, value3 = null;

		function observer1(object, value) { changes1++; value1 = value; }
		function observer2(object, value) { changes2++; value3 = value; }
		function observer3(object, value) { changes3++; value2 = value; }

		Observer.observe(object, 'a', observer1);
		Observer.observe(object, 'a', observer2);
		Observer.observe(object, 'a', observer3);

		object.a = 12;
		changes1.should.equal(1);
		changes2.should.equal(1);
		changes3.should.equal(1);

		value1.should.equal(12);
		value2.should.equal(12);
		value3.should.equal(12);

		object.a = 'test';
		changes1.should.equal(2);
		changes2.should.equal(2);
		changes3.should.equal(2);

		value1.should.equal('test');
		value2.should.equal('test');
		value3.should.equal('test');

	});


	it('should allow removal of a subset of listeners without affecting others', () => {

		var object = { a: 0 };

		var changes1 = 0, value1 = null,
			changes2 = 0, value2 = null,
			changes3 = 0, value3 = null;

		function observer1(object, value) { changes1++; value1 = value; }
		function observer2(object, value) { changes2++; value2 = value; }
		function observer3(object, value) { changes3++; value3 = value; }

		Observer.observe(object, 'a', observer1);
		Observer.observe(object, 'a', observer2);
		Observer.observe(object, 'a', observer3);

		object.a = 12;
		changes1.should.equal(1);
		changes2.should.equal(1);
		changes3.should.equal(1);

		value1.should.equal(12);
		value2.should.equal(12);
		value3.should.equal(12);


		Observer.unobserve(object, 'a', observer2);

		object.a = 'test';


		changes1.should.equal(2);
		changes3.should.equal(2);

		changes2.should.equal(1);


		value1.should.equal('test');
		value3.should.equal('test');

		value2.should.equal(12);

	});


	it('should restore properties to their original state after removal', () => {

		var object = {};

		Object.defineProperty(object, 'a', {
			writable:		true,
			enumerable:		false,
			configurable:	true
		});

		function observer(object, value) {}

		Observer.observe(object, 'a', observer);

		object.a = 12;

		Observer.unobserve(object, 'a', observer);

		object.a.should.equal(12);

		var definition = Object.getOwnPropertyDescriptor(object, 'a');
		definition.value.should.equal(12);

		definition.writable.should.be.true;
		definition.enumerable.should.be.false;
		definition.configurable.should.be.true;
	});


	it('should restore getters and setters after removal', () => {

		var object = {}, value = 0, called = 0;

		function get() { return value; }
		function set(next) { value = next; called++; }

		Object.defineProperty(object, 'a', {
			enumerable:		true,
			configurable:	true,
			get:			get,
			set:			set
		});

		function observer(object, value) {}

		Observer.observe(object, 'a', observer);

		object.a = 12;

		Observer.unobserve(object, 'a', observer);

		object.a.should.equal(12);

		var definition = Object.getOwnPropertyDescriptor(object, 'a');

		definition.enumerable.should.be.true;
		definition.configurable.should.be.true;

		definition.get.should.equal(get);
		definition.set.should.equal(set);
	});


	it('should throw when asked to observe an unconfigurable property', () => {

		var object = {};

		Object.defineProperty(object, 'a', {
			enumerable:		true,
			configurable:	false,
			writable:		true
		});

		function observer(object, value) {}

		should(() => {
			Observer.observe(object, 'a', observer);
		}).throw();
	});


	it('should silently ignore when asked to observe a read-only property', () => {

		var object = {}, called = 0;

		Object.defineProperty(object, 'a', {
			enumerable:		true,
			configurable:	true,
			writable:		false
		});

		function observer(object, value) { called++; }

		Observer.observe(object, 'a', observer);

		should(() => {
			object.a = 7;
		}).throw();

		called.should.equal(0);
	});


	it('should silently ignore when asked to observe a getter-only property', () => {

		var object = {}, called = 0;

		Object.defineProperty(object, 'a', {
			enumerable:		true,
			configurable:	true,
			get:			() => { return 5; }
		});

		function observer(object, value) { called++; }

		Observer.observe(object, 'a', observer);

		should(() => {
			object.a = 7;
		}).throw();

		called.should.equal(0);
	});


});
