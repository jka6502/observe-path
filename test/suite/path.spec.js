
import should	from 'should/should';
import Path		from 'lib/path';


describe('Path', () => {


	it('should construct with a provided path', () => {

		var path = new Path('test');

	});


	it('should get resolved values from a specified path', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } };

		path.get(object).should.equal(7);

	});


	it('should observe final value changes along a path', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } },
			value	= null;

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		object.a.b.c = 5;

		value.should.equal(5);
	});


	it('should resolve to undefined, if the path is broken', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } },
			value	= null;

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		object.a.b = undefined;

		should(value).be.undefined;
	});


	it('should resolve correctly, if the path is reformed', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } },
			value	= null;

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		object.a.b = undefined;
		object.a.b = { c: 'test' };

		value.should.equal('test');
	});


	it('should resolve correctly, if a segment of the path is replaced', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } },
			value	= null;

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		object.a = { b: { c: 21.1 }};

		value.should.equal(21.1);
	});


	it('should only fire one event per change', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } },
			changes	= 0,
			value	= null,
			secret	= {};

		function change(old, replacement) {
			changes++;
			value = replacement;
		}

		path.observe(object, change);

		changes.should.equal(0);

		object.a.b = undefined;

		changes.should.equal(1);

		object.a = undefined;

		changes.should.equal(1);

		object.a = { b: { c: secret } };

		changes.should.equal(2);

		value.should.equal(secret);

	});


	it('should cooperate with other intersecting paths', () => {

		var path1		= new Path('a', 'b', 'c'),
			path2		= new Path('a', 'd'),
			object		= { a: { b: { c: 7 }, d: 9 } },
			value1		= path1.get(object),
			value2		= path2.get(object);

		function change1(old, replacement) {
			value1 = replacement;
		}

		function change2(old, replacement) {
			value2 = replacement;
		}

		path1.observe(object, change1);
		path2.observe(object, change2);

		object.a.b = undefined;

		should(value1).be.undefined;
		value2.should.equal(9);

		object.a = undefined;

		should(value1).be.undefined;
		should(value2).be.undefined;

		object.a = { b: { c: 'test' } };

		value1.should.equal('test');
		should(value2).be.undefined;

		object.a.d = 0.5;

		value1.should.equal('test');
		value2.should.equal(0.5);

	});

	it('should return undefined, when segment of path is a primitive', () => {

		var path		= new Path('a', 'b', 'c'),
			object		= { a: { b: { c: 7 } } },
			value		= path.get(object);

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		object.a.b = 7

		should(value).be.undefined;

		object.a.b = { c: 'test' };

		value.should.equal('test');

	});


	it('should only fire once per change, per intersecting path', () => {

		var path1		= new Path('a', 'b', 'c'),
			path2		= new Path('a', 'd'),
			object		= { a: { b: { c: 7 }, d: 9 } },
			changes1	= 0,
			changes2	= 0;

		function change1(old, replacement) {
			changes1++;
		}

		function change2(old, replacement) {
			changes2++;
		}

		path1.observe(object, change1);
		path2.observe(object, change2);

		object.a.b = undefined;

		changes1.should.equal(1);
		changes2.should.equal(0);

		object.a = undefined;

		changes1.should.equal(1);
		changes2.should.equal(1);

		object.a = { b: { c: 'test' } };

		changes1.should.equal(2);
		changes2.should.equal(1);

		object.a.d = 0.5;

		changes1.should.equal(2);
		changes2.should.equal(2);

	});


	it('should unobserve a path', () => {

		var path	= new Path('a', 'b', 'c'),
			object	= { a: { b: { c: 7 } } },
			value	= null;

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		object.a.b = undefined;
		object.a.b = { c: 'test' };

		value.should.equal('test');

		path.unobserve(object, change);

		object.a.b.c = 7;
		value.should.equal('test');

		object.a.b = undefined;
		value.should.equal('test');

	});



	it('should unobserve a path, without affecting other intersecting paths', () => {
		var path1		= new Path('a', 'b', 'c'),
			path2		= new Path('a', 'b', 'd'),
			object		= { a: { b: { c: 7, d: 8 } } },
			value1		= path1.get(object),
			value2		= path2.get(object),
			changes1	= 0,
			changes2	= 0;

		function change1(old, replacement) {
			value1 = replacement;
			changes1++;
		}

		function change2(old, replacement) {
			value2 = replacement;
			changes2++;
		}

		path1.observe(object, change1);
		path2.observe(object, change2);

		object.a.b = undefined;

		changes1.should.equal(1);
		changes2.should.equal(1);

		should(value1).be.undefined;
		should(value2).be.undefined;

		path2.unobserve(object, change2);

		object.a = { b: { c: 'test', d: 'test' } };

		changes1.should.equal(2);
		changes2.should.equal(1);

		value1.should.equal('test');
		should(value2).be.undefined;

	});


	it('should allow changing of the resolved value', () => {

		var path		= new Path('a', 'b', 'c'),
			object		= { a: { b: { c: 7 } } },
			value		= path.get(object);

		function change(old, replacement) {
			value = replacement;
		}

		path.observe(object, change);

		path.set(object, 'test');
		object.a.b.c.should.equal('test');
		value.should.equal('test');

	});


	it('should allow changing resolved values silently', () => {

		var path1		= new Path('a', 'b', 'c'),
			path2		= new Path('a', 'b', 'c'),
			object		= { a: { b: { c: 7 } } },
			value1		= path1.get(object),
			value2		= path2.get(object);

		function change1(old, replacement) {
			value1 = replacement;
		}

		function change2(old, replacement) {
			value2 = replacement;
		}

		path1.observe(object, change1);
		path2.observe(object, change2);

		path1.set(object, 'test', true);
		object.a.b.c.should.equal('test');

		value1.should.not.equal('test');
		value2.should.not.equal('test');

	});


});
