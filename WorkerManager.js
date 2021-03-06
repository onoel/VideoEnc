strPid = process.pid;

global.config = require('./config/general.js');
global.Common = require('Common');
global.File = require('File');

global.strPrefix = 'general';

var zmq = require('zmq'), 
	socketPull = zmq.socket('pull'),
	socketPush = zmq.socket('push'),
	socketReq = zmq.socket('rep');

socketPush.bindSync(config.zmq.workersIn);
Common.log('Push to ' + config.zmq.workersIn);

socketPull.bindSync(config.zmq.workersOut);
Common.log('Pull to ' + config.zmq.workersOut);

socketReq.bindSync(config.zmq.manager);
Common.log('Manager to ' + config.zmq.manager);

function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 8; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    
    var uuid = s.join("");
    return uuid;
}

function count_obj(obj){
    var i = 0;
    for(var key in obj){
        ++i;
    }

    return i;
}

function getKey(obj) {
    for (var a in obj) return a;
}

function launchJob(strPathToFile, idTemplate, objInputTemplate, intTmpUID) {

	strTemplatePath = config.templates;

	reg = new RegExp(/%TEMPLATE_ID%/gi);
	if (strTemplatePath.match(reg)) {
		strTemplatePath = strTemplatePath.replace(reg, idTemplate);
	}

	var objFile = {};
	objFile.input = strPathToFile;
	objFile.output = '/Users/onoel/sintel%SUFFIX%.%EXTENSION%';
	objFile.tmp = '/Users/onoel/';

	try {
		objTemplate = File.loadJson(strTemplatePath);
		intUID = createUUID();
		var arrTmpReturn = {};
		var arrTmpProcess = {};
		var intFlagStop = false;
			
		if (count_obj(objInputTemplate) > 0){
			intUID = intTmpUID;
			for(var tmpName in objInputTemplate) {
				arrTmpProcess[tmpName] = objTemplate[tmpName];
			}
			itemName = getKey(objInputTemplate);
		} else {
			itemName = getKey(objTemplate);
			arrTmpProcess = objTemplate;
		}
		
		objTaskOption = objTemplate[itemName].process;
		taskOption = objTemplate[itemName].type;
		
		if (taskOption == 'single' || taskOption == 'parallel'){
			strPrefix = taskOption;
			if (intFlagStop === false){
				Common.log('[' + intUID + '] Launch '+itemName);
			}
			for (var strProcessName in objTaskOption){
				objProcess = objTaskOption[strProcessName];
				if (intFlagStop === false){
					Common.log('[' + intUID + '] Launch process name '+strProcessName);
					socketPush.send([intUID, itemName, strProcessName,JSON.stringify(objProcess), JSON.stringify(objFile)]);
					arrTmpProcess[itemName].process[strProcessName] = 1;
				} else {
					arrTmpProcess[itemName].process[strProcessName] = 0;
				}
			}
			intFlagStop = true;
		} else {
			Common.log('[' + intUID + '] Task option not available ' + taskOption);
		}
	
		arrTmpReturn[intUID] = {"template" : arrTmpProcess, "file_path" : strPathToFile, "id_template" : idTemplate};
		return arrTmpReturn;
	} catch (error) {
		Common.log(error);
	}
}

try {
	arrProcess = {};
	
	socketReq.on('message', function(strPath, idTemplate) {
		socketReq.send('OK');
		Common.log('Get call from Manager socket '+ strPath + ' - ' + idTemplate);
		arrTmp = launchJob(strPath.toString(), idTemplate.toString(), {}, undefined);
		arrProcess[getKey(arrTmp)] = arrTmp[getKey(arrTmp)];
	});
	
	socketPull.on('message', function(intUIDTmp, itemNameTmp, processNameTmp, workerId) {
		intUID = intUIDTmp.toString();
		itemName = itemNameTmp.toString();
		processName = processNameTmp.toString();
		if (intUID != '' && itemName != ''){
			Common.log('[' + intUID + '] ['+workerId+ '] End of process name '+ processName);
			delete(arrProcess[intUID].template[itemName].process[processName]);
			if (count_obj(arrProcess[intUID].template[itemName].process) == 0){
				delete(arrProcess[intUID].template[itemName]);
				if (count_obj(arrProcess[intUID].template) > 0) {
					arrTmp = launchJob(arrProcess[intUID].file_path, arrProcess[intUID].id_template, arrProcess[intUID].template, intUID);
					arrProcess[getKey(arrTmp)] = arrTmp[getKey(arrTmp)];
				}
			}
		}
	});
} catch (error) {
	console.log(error);
}