var _ = require('lodash');
var async = require('async');
var RunListHelper = require('../src/RunListHelper');
var NodeRunner = require('../src/RunWrappers/Node');
var DockerRunner = require('../src/RunWrappers/Docker');
var DockerComposeRunner = require('../src/RunWrappers/DockerCompose');
var mkdirp = require('mkdirp');
var runningServices = [];
var notRunningServices = [];

module.exports = {
    name: 'run',
    description: 'Runs all of the microservices (or subset based on regex pattern)',
    example: 'bosco run -r <repoPattern> -t <tag>',
    cmd: cmd,
    options: [{
        option: 'tag',
        syntax: ['-t, --tag [tag]', 'Filter by a tag defined within bosco-service.json']
    },
    {
        option: 'watch',
        syntax: ['-w, --watch', 'Watch the applications started with run for changes']
    },
    {
        option: 'list',
        syntax: ['-l, --list [list]', 'Start a list of repos (comma separated).']
    }
    ]
}

function cmd(bosco, args, cb) {

    var repoPattern = bosco.options.repo;
    var repoRegex = new RegExp(repoPattern);
    var watchPattern = bosco.options.watch || '$a';
    var watchRegex = new RegExp(watchPattern);
    var repoTag = bosco.options.tag;

    var repos;
    if(bosco.options.list) {
        repos = bosco.options.list.split(',');
    } else {
        repos = bosco.getRepos();
    }

    var initialiseRunners = function(next) {
        var runners = [NodeRunner, DockerRunner, DockerComposeRunner];
        async.map(runners, function loadRunner(runner, cb) {
            runner.init(bosco, cb);
        }, next);
    }

     var disconnectRunners = function(next) {
        var runners = [NodeRunner, DockerRunner];
        async.map(runners, function loadRunner(runner, cb) {
            runner.disconnect(cb);
        }, next);
    }

    var getRunList = function(next) {
        RunListHelper.getRunList(bosco, repos, repoRegex, watchRegex, repoTag, next);
    }

    var startRunnableServices = function(next) {

        var runService = function(runConfig, cb) {

            if (runConfig.service && runConfig.service.type == 'docker') {
                if (_.contains(runningServices, runConfig.name)) {
                    bosco.warn('Service ' + runConfig.name.green + ' is already running ...');
                    return cb();
                }
                bosco.log('Running docker service ' + runConfig.name.green + ' ...');
                return DockerRunner.start(runConfig, cb);
            }

            if (runConfig.service && runConfig.service.type == 'docker-compose') {
                bosco.log('Running docker-compose ' + runConfig.name.green + ' ...');
                return DockerComposeRunner.start(runConfig, cb);
            }

            if (runConfig.service && runConfig.service.type == 'node') {
                if (_.contains(runningServices, runConfig.name)) {
                    bosco.warn('Service ' + runConfig.name.green + ' is already running ...');
                    return cb();
                }
                return NodeRunner.start(runConfig, cb);
            }
            return cb();
        }

        getRunList(function(err, runList) {

            if (err) return next(err);

            async.mapSeries(runList, function(runConfig, cb) {
                if(!runConfig.service.type) {
                    RunListHelper.getServiceConfigFromGithub(bosco, runConfig.name, function(err, svcConfig) {
                        if(err) { return cb(); }
                        if(svcConfig.type === 'docker') { return cb(); }
                        // Do not allow build in this mode, so default to run
                        if(svcConfig.service && svcConfig.service.build) {
                            delete svcConfig.service.build;
                        }
                        if(!svcConfig.name) {
                            svcConfig.name = runConfig.name;
                        }
                        runService(svcConfig, cb);
                    })
                } else {
                    runService(runConfig, cb);
                }

            }, next);
        })

    }

    var stopNotRunningServices = function(next) {
        bosco.log('Removing stopped/dead services');
        async.each(notRunningServices, function(service, cb){
            NodeRunner.stop({name: service}, cb);
        }, next);
    };

    var getRunningServices = function(next) {
        NodeRunner.listRunning(false, function(err, nodeRunning) {
            DockerRunner.list(false, function(err, dockerRunning) {
                dockerRunning = _.map(_.flatten(dockerRunning), function(item) { return item.replace('/',''); });
                runningServices = _.union(nodeRunning, dockerRunning);
                next();
            });
        });
    }

    var getStoppedServices = function(next) {
        NodeRunner.listNotRunning(false, function(err, nodeNotRunning) {
            notRunningServices = nodeNotRunning;
            next();
        });
    };

    var ensurePM2 = function(next) {

        // Ensure that the ~/.pm2 folders exist
        var folders = [
            process.env.HOME + '/.pm2/logs',
            process.env.HOME + '/.pm2/pids'
        ];

        async.map(folders, function(folder, cb) {
            mkdirp(folder, function (err) {
                cb(err);
            });
        },function(err) {
            next(err);
        });

    }

    bosco.log('Run each microservice ... ');

    async.series([ensurePM2, initialiseRunners, getRunningServices, getStoppedServices, stopNotRunningServices, startRunnableServices, disconnectRunners], function(err) {
        if (err) {
            bosco.error(err);
            if (cb) cb();

            return;
        }

        bosco.log('All services started.');
        if(_.contains(args, 'cdn')) {
            var cdn = require('./cdn');
            cdn.cmd(bosco, [], function() {});
        } else {
            if(cb) return cb();
        }
    })

}

