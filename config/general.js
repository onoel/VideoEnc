var config = {};

/**
 * Path to the different configuration files
 */
config.templates = './config/templates/%TEMPLATE_ID%.json';
config.profiles = './config/profiles/%PROFILE_NAME%.json';

/**
 * Zero MQ socket
 * You can modify the value if you used multiple servers
 */
config.zmq = {};
config.zmq.manager = 'tcp://127.0.0.1:3000';
config.zmq.workersIn = 'tcp://127.0.0.1:3001';
config.zmq.workersOut = 'tcp://127.0.0.1:3002';

module.exports = config;