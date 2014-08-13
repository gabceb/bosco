
var request = require('request');
var fs = require('fs');
var _ = require('lodash');
var asciify = require('asciify');
var git = require('gulp-git');
var async = require('async');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var green = '\u001b[42m \u001b[0m';
var red = '\u001b[41m \u001b[0m';

module.exports = {
	name:'go',
	description:'Initialises your entire working environment in one step.',
	example: 'bosco go | bosco go pull',
	help: getHelp(),
	cmd:cmd
}

function cmd(bosco, args) {

	var options = {
	    headers: {
	        'User-Agent': 'TSL-Repos-List-App'
	    },
	    auth: {
	        user: bosco.config.get('github:authToken') + ':x-oauth-basic'
	    },
	    proxy: process.env.http_proxy ? process.env.http_proxy : undefined,
	    json: true
	};

    var ignoredRepos = bosco.config.get('github:ignoredRepos') || [];
    ignoredRepos.push('bosco');

    function fetchTeamProfile(err, res, teamJson) {

    	if(teamJson.message) {
    		return bosco.error(teamJson.message);
    	}

        if (err) {
            return bosco.error("Could not find your team, or you are not a member of any team", err.message);
        }

        var team = _.find(teamJson, {slug: bosco.config.get('github:team')});

        if(!team) return bosco.error("Unable to get team from Github");

        bosco.log("Fetching repos for " + team.name.magenta);

        function fetchTeamRepositories(err, res, reposJson) {

            if (err) {
                return bosco.error('Problem with request: ' + err.message);
            }

            if (res.statusCode != '200') {
                return bosco.error('Received non-ok reponse: ' + res.statusCode);
            }

            var repos = [];

            function obtainRepositoryName(repo) {
                if (ignoredRepos.indexOf(repo.name) < 0) {
                    repos.push(repo.name);
                }
            }

            reposJson.forEach(obtainRepositoryName);
            fetch(bosco, repos, args);

        }

        request.get(team.repositories_url + '?per_page=100', options, fetchTeamRepositories);

    }

    request.get('https://api.github.com/user/teams', options, fetchTeamProfile);
	
}

function fetch(bosco, repos, args) {

	var org = bosco.config.get('github:organization'), orgPath;

	var checkOrg = function(cb) {
		orgPath = ["./",bosco.config.get('github:organization')].join("");
		if(!bosco.exists(orgPath)) {
			bosco.log("Creating organization folder " + orgPath.magenta);
			mkdirp(orgPath, cb);
		} else {
			cb();
		}
	}

	var getRepos = function(cb) {

		var progressbar = bosco.config.get('progress') == 'bar', 
			total = repos.length, 
			pullFlag = false;

  		var bar = progressbar ? new bosco.progress('Getting repositories [:bar] :percent :etas', {
			complete: green,
  			incomplete: red,
			width: 50,
			total: total
		}) : null;

    	async.mapLimit(repos, 5, function repoGet(repo, repoCb) {	  

    	  if(progressbar) bar.tick();

		  var repoPath = ["./",org,"/",repo].join(""); 
		  var repoUrl = ['git@github.com:',org,"/",repo,'.git'].join(""); 

		  if(bosco.exists(repoPath)) {
		  	if(args[0] == 'pull') {
		  		pull(bosco, progressbar, repoPath, repoCb);
		  	} else {	
		  		pullFlag = true;	  		
		  		repoCb();
		  	}		  
		  } else {
		  	clone(bosco,  progressbar, repoUrl, orgPath, repoCb);
		  }
		}, function(err) {
			if(err) bosco.error(err.message);
			if(pullFlag) bosco.warn("Some repositories already existed, to pull changes use 'bosco go pull'");
			cb();
		})
		
	}

	var installRepos = function(cb) {
	    	
		var progressbar = bosco.config.get('progress') == 'bar', 
			total = repos.length;

		var bar = progressbar ? new bosco.progress('Running NPM install  [:bar] :percent :etas', {
  			complete: green,
  			incomplete: red,
			width: 50,
			total: total
		}) : null;

		async.mapSeries(repos, function repoInstall(repo, repoCb) {	  

    	  if(progressbar) bar.tick();

		  var repoPath = ["./",org,"/",repo].join(""); 
		  install(bosco, progressbar, repoPath, repoCb);

		}, function(err) {
			if(err) bosco.error(err.message);
			cb();
		});

	}


	async.series([checkOrg, getRepos, installRepos], function(err) {
		bosco.log("Complete");
	});

}

function clone(bosco, progressbar, repoUrl, orgPath, next) {
    if(!progressbar) bosco.log("Cloning " + repoUrl.blue + " into " + orgPath.blue);
	exec('git clone ' + repoUrl, {
	  cwd: orgPath
	}, function(err, stdout, stderr) {
		if(err) {
			bosco.error(stderr);
		} else {
			if(!progressbar && stdout) bosco.log(repoUrl.blue + " >> " + stdout);
		}
		next(err);
	});
}

function pull(bosco, progressbar, repoPath, next) {
	
	if(!progressbar) bosco.log("Pulling " + repoPath.blue)

	exec('git pull --rebase', {
	  cwd: repoPath
	}, function(err, stdout, stderr) {
		if(err) {
			bosco.error(stderr);
		} else {
			if(!progressbar && stdout) bosco.log(repoPath.blue + " >> " + stdout);
		}
		next(err);
	});
}

function install(bosco, progressbar, repoPath, next) {

	if(!bosco.exists([repoPath,"/package.json"].join(""))) return next();
	if(!progressbar) bosco.log("Running NPM install for " + repoPath);

	exec('npm install', {
	  cwd: repoPath
	}, function(err, stdout, stderr) {
		if(err) {
			bosco.error(stderr);
		} else {
			if(!progressbar && stdout) bosco.log(stdout);
		}
		next(err);
	});

}

function getHelp() {
	return "This is some example help for the go command."
}
