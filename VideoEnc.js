global.config = require('./config/general.js');
global.Common = require('Common');

global.File = require('File');
global.Crypto = require('crypto');
var Encode = require('Encode');
var Package = require('Package');
var Transfert = require('Transfert');

strProfilePath = config.profiles;
strTemplatePath = config.templates;

reg = new RegExp(/%TEMPLATE_ID%/gi);
if (strTemplatePath.match(reg)) {
	strTemplatePath = strTemplatePath.replace(reg, intTemplate
			.toString());
}

var objFile = {};
objFile.output = '/Users/onoel/sintel%SUFFIX%.%EXTENSION%';
objFile.tmp = '/Users/onoel/';

global.strPrefix = undefined;


function launchJob() {

	try {
		objTemplate = File.loadJson(strTemplatePath);

		for ( var taskType in objTemplate) {
			var objTask = objTemplate[taskType];

			global.strPrefix = taskType;

			strInputFile = File.generatePathFilename(objTask.input_file,
					objFile, objTask.file_settings);
			if (objTask.output_file !== undefined) {
				strOutputFile = File.generatePathFilename(objTask.output_file,
						objFile, objTask.file_settings);
			}

			switch (objTask.module) {
			case 'encode':
				Encode.run(strInputFile, strOutputFile, objTask);
				break;
			case 'package':
				Package.run(strInputFile, strOutputFile, objTask);
				break;
			case 'transfert':
				Transfert.run(strInputFile, objTask);
				break;
			case 'notification':
				break;
			default:
				Common.log('Module not available ' + objTask.module);
				break;
			}
		}
	} catch (error) {
		Common.log(error);
		socket.close();
	}
}
