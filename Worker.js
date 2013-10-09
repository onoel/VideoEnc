strPid = process.pid;

global.config = require('./config/general.js');
global.Common = require('Common');
global.File = require('File');
global.Crypto = require('crypto');

global.strPrefix = 'general';

var zmq = require('zmq'), 
	socketPull = zmq.socket('pull'),
	socketPush = zmq.socket('push');

try {
	socketPull.connect(config.zmq.workersIn);
	Common.log('['+strPid+'] Get order from ' + config.zmq.workersIn);
	
	socketPush.connect(config.zmq.workersOut);
	Common.log('['+strPid+'] Send feedback to ' + config.zmq.workersOut);
	
	socketPush.send(['', '', '['+strPid+'] Start worker ', strPid]);
	
	socketPull.on('message', function(intUID, itemName, strProcessName, objProcessIn, objFileIn) {
		
		global.strPrefix = 'general';
		Common.log('Launch process '+strProcessName.toString());
		
		strProfilePath = config.profiles;
		objProcess = JSON.parse(objProcessIn.toString());
		objFile = JSON.parse(objFileIn.toString());
		
		for ( var taskType in objProcess) {
			var objTask = objProcess[taskType];
			
			global.strPrefix = taskType;
			
			strInputFile = strOutputFile = undefined;
			if (objTask.input_file !== undefined) {
				strInputFile = File.generatePathFilename(objTask.input_file,
						objFile, objTask.file_settings);
			}
			if (objTask.output_file !== undefined) {
				strOutputFile = File.generatePathFilename(objTask.output_file,
						objFile, objTask.file_settings);
			}
			
			Common.log('Launch task '+taskType);
			switch (objTask.module) {
			case 'encode':
				var Encode = require('Encode');
				Encode.run(strInputFile, strOutputFile, objTask);
				break;
			case 'package':
				var Package = require('Package');
				Package.run(strInputFile, strOutputFile, objTask);
				break;
			case 'transfert':
				var Transfert = require('Transfert');
				Transfert.run(strInputFile, objTask);
				break;
			case 'notification':
				break;
			default:
				Common.log('Module not available ' + objTask.module);
				break;
			}
		}
		socketPush.send([intUID, itemName, strProcessName, strPid]);
	});

} catch (error) {
	console.log(error);
}