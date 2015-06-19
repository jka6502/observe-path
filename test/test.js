import Mocha		from 'mocha';
import glob			from 'glob';
import path			from 'path';
import { execSync }	from 'child_process';



if (process.argv[2] === 'web') {

	// Browser tests
	execSync('./node_modules/.bin/testem -f test/testem.yml '
		+ process.argv.slice(3).join(' '), { stdio: 'inherit' });

}else{

	// CLI tests (includes all browser tests)
	var mocha = new Mocha();


	// Unfortunate hack, required to allow the same simple relative import
	// paths in the browser and cli.
	process.env.NODE_PATH = path.dirname(__dirname);
	require('module').Module._initPaths();


	// Fetch all spec files (web and CLI), add them to mocha, and run.
	glob('./test/**/*.spec.js', function(error, files) {

		if (error) {
			console.err.println('Failed to discover test files: ', error);
			return;
		}

		for(let file of files) {
			mocha.addFile(file);
		}

		mocha.run(function(failures) {
			process.on('exit', function () {
				process.exit(failures);
			});
		});

	});

}
