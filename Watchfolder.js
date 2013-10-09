global.config = require('./config/general.js');

global.Common = require('Common');
global.File = require('File');
global.strPrefix = undefined;

sleep = require('sleep');
var zmq = require('zmq'), socket = zmq.socket('req');
var fs = require('fs');

while (1) {

	Common.log('Start loop');
	var strPathWatchfolder = '/Users/onoel/Movies/watch/';
	var intIdTemplate = 1;
	var strPattern = /.mp4/i;

	objPath = fs.readdirSync(strPathWatchfolder);

	objDate = new Date();

	for ( var i in objPath) {
		strPath = strPathWatchfolder + objPath[i];
		reg = new RegExp(strPattern);

		if (strPath.match(reg)) {
			try {
				strTmp = fs.statSync(strPath);

				diffDateMin = (objDate.getTime() - strTmp.mtime.getTime());
				diffDateMin = diffDateMin / (60 * 1000);

				if (diffDateMin > 1) {
					socket.connect(config.zmq.manager);
					Common.log('Launch template ' + intIdTemplate + ' for file ' + strPath);
					socket.send([ strPath, intIdTemplate ]);

					socket.on('message', function(msg) {
						if (msg.toString() == 'OK') {
							Common.log('Order received');
							socket.close();
						}
					});
				}
			} catch (error) {
				console.log(error);
				socket.close();
			}
		}
	}
	Common.log('End loop');
	sleep.sleep(30);
}