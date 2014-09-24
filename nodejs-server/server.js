'use strict';

// To my great frustration it would appear that firefox os
// doesn't handle non-200 responses very well

var path = require('path')
  , connect = require('connect')
  , app = connect()
  , urlrouter = require('connect_router')
  , send = require('connect-send-json')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , serveStatic = require('serve-static')
  , hri = require('human-readable-ids').hri
  , poor = require('./poor-db').Poor.create()
  //, config = require('./config')
  , route
  , Promise = require('bluebird')
  , request = Promise.promisify(require('request'))
  , pushes = {}
  ;


app.use(morgan());
app.use(send.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(serveStatic(path.join(__dirname, 'app')));

function pushdata(id, data) {
  return poor.get(id + ':data').then(function (arr) {
    if (!Array.isArray(arr)) {
      arr = [];
    }

    arr.push(data);

    return poor.put(id + ':data', arr);
  });
}

function popdata(id) {
  return poor.get(id + ':data').then(function (arr) {
    return poor.put(id + ':data', []).then(function () {
      return arr;
    });
  });
}

function route(rest) {
  rest.post('/api/push', function (req, res) {
    var body = req.body
      ;

    console.log(req.body);
    if (!body.url) {
      //res.statusCode = 400;
      res.json({ error: { message: "Missing url" } });
      return;
    }

    poor.get(body.url).then(function (id) {
      if (id) {
        res.json({ success: true, id: id });
        return;
      }

      function getNewId() {
        id = hri.random();
        return poor.get(id).then(function (url) {
          if (url && url !== body.url) {
            return getNewId();
          }

          return Promise.all([poor.put(body.url, id), poor.put(id, body.url)]).then(function () {
            return id;
          });
        });
      }

      return getNewId().then(function (id) {
        res.json({ success: true, id: id });
      });
    });
  });

  rest.get('/api/push/:id', function (req, res) {
    var params = req.params
      ;

    poor.get(params.id).then(function (url) {
      if (!url) {
        res.json({ exists: false, error: { message: "the endpoint is not registered" } });
        return;
      }

      res.json({ exists: true, url: url });
    });
  });

  rest.post('/api/push/:id', function (req, res) {
    var params = req.params
      , body = req.body
      ;

    if (!Object.keys(body).length) {
      //res.statusCode = 400;
      res.json({ error: { message: "Missing data" } });
      return;
    }

    function pushError(err) {
      console.error(req.url, 'send data');
      console.error(err);
      //res.statusCode = 500;
      res.json({ error: { message: err.message || err } });
    }

    function requestPush(url) {
      console.log(url);
      return request(
        { method: 'PUT'
        , uri: url
        , form: { version: body.version || 3 }
        }
      ).spread(
        function (resp, data) {
          var p
            , old
            ;

          if (resp.statusCode !== 200) {
            console.error(resp.statusCode);
            console.error(resp.headers);
            console.error(data);
            throw new Error('Bad statusCode: ' + resp.statusCode);
          }

          return new Promise(function (resolve, reject) {
            old = pushes[params.id];

            // TODO what if there's a promise waiting?
            p = { resolve: resolve, reject: reject, id: params.id };
            pushes[p.id]  = p;
            p.timeout = setTimeout(function () {
              p.reject({
                message: "push timeout:"
                  + " notification was sent, but the device did not retrieve it in a timely manner."
                  + " The device probably has a poor network connection or is turned off."
                  + " It may or may not receive the notification later."
              });
            }, 1 * 60 * 1000);
          }).then(
            function () {
              if (old && !old.resolved) {
                old.resolve();
                old.resolved = true;
              }
              res.json({ success: true });
            }
          , pushError
          ).then(
            function () {
              if (old && !old.resolved) {
                old.reject({ message: 'a newer promise failed and cancelled this one' });
                old.resolved = true;
              }

              p.resolved = true;
              clearTimeout(p.timeout);
              delete pushes[params.id];
            }
          );

        }
      ).catch(pushError);
    }

    poor.get(params.id).then(function (url) {
      if (!url) {
        //res.statusCode = 400;
        res.json({ error: { message: "Bad id" } });
        return;
      }

      return pushdata(params.id, body.data).then(
        function () {
          return requestPush(url);
        }
      , pushError
      );
    });
  });

  // If the device received the USSD packet (push) that means
  // it also has a data connection and will be able to retrieve
  // the data which awaits it immediately. Here she be.
  rest.get('/api/push/:id/data', function (req, res) {
    var id = req.params.id
      ;

    if (!pushes[id]) {
      console.error(req.url, 'push fishing');
      //res.statusCode = 400;
      res.json({ error: { message: "trying to retrieve data that wasn't pushed" } });
      return;
    }

    if (pushes[id].lock) {
      console.error(req.url, 'push lock');
      //res.statusCode = 400;
      res.json({ error: { message: "trying to retrieve data twice at once. wait a second or two." } });
      return;
    }

    pushes[id].lock = true;

    // TODO could the promise disappear between now and then?
    popdata(id).then(function (batch) {
      res.json({ success: true, batch: batch });
      pushes[id].resolve();
    }, function (err) {
      pushes[id].reject(err);
      console.error(req.url, 'push retrieve fail');
      console.error(err);
      //res.statusCode = 500;
      res.json({ error: { message: "error retrieving data" } });
    }).then(function () {
      pushes[id].lock = false;
    });
  });
}

app.use(urlrouter(route));

module.exports = app;
