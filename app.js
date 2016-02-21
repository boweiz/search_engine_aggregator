var http = require('http');
var url = require('url');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
const PORT = 4000;

function fetch (url, cb) {
  request.get(url, function (err, response, body) {
    if (err) {
      cb(err);
    } else {
      cb(null, body);
    }
  });
}

function handleRequest (req, res) {
  var search = {
    google: [],
    yahoo: [],
    bing: [],
  };
  var path = url.parse(req.url).path;
  var query = path.split('/')[1];
  var urls = [
    'https://www.google.com/search?q=' + query,
    'https://search.yahoo.com/search?q=' + query,
    'https://www.bing.com/search?q=' + query
  ];

  // apply same function to every item in urls
  async.map(urls, fetch, function (err, results) {
    if (err) {
      res.end(err);
    } else {

      var google = results[0];
      // load information based on query
      var $google = cheerio.load(google);  
      $google('.r a').each(function (i, link) {
        var url = $google(link).attr("href");
        // filter
        url = url.replace("/url?q=", "").split("&")[0];
        if (url.charAt(0) === "/") {
          return;
        }
        search.google.push(url);
      });

      var yahoo = results[1];
      var $yahoo = cheerio.load(yahoo);
      $yahoo('h3 a').each(function (i, link) {
        var url = $yahoo(link).attr("href");
        // filter
        substr = "r.search.yahoo"
        if (url.indexOf(substr) == -1) {
          search.yahoo.push(url);
        }
        
      });

      var bing = results[2];
      var $bing = cheerio.load(bing);
      $bing('h2 a').each(function (i, link) {
        var url = $bing(link).attr('href');
        // filter
        substr = "r.msn.com"
        if (url.indexOf(substr) == -1) {
          search.bing.push(url);
        }        
        
      });

      res.end(JSON.stringify(search));
    }
  });
}

var server = http.createServer(handleRequest);
server.listen(PORT, function () {
  console.log("Server listening on: http://localhost:%s", PORT);
});
