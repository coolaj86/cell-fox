'use strict';

// To my great frustration it would appear that firefox os
// doesn't handle non-200 responses very well

var path = require('path')
  , connect = require('connect')
  , app = connect()
  , urlrouter = require('urlrouter')
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
app.use(require('connect-send-error').error());
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

// Push data from web to server
function pushMessage(id, body) {
  if (!Object.keys(body).length) {
    //res.statusCode = 400;
    throw new Error("Missing data");
  }

  function requestPush(url) {
    console.log(url);
    return request(
      { method: 'PUT'
      , uri: url
      , form: { version: Date.now() }
      }
    ).spread(function (resp, data) {
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
        old = pushes[id];

        // TODO what if there's a promise waiting?
        p = { resolve: resolve, reject: reject, id: id };
        pushes[p.id] = p;
        p.timeout = setTimeout(function () {
          p.reject({
            message: "push timeout:"
              + " notification was sent, but the device did not retrieve it in a timely manner."
              + " The device probably has a poor network connection or is turned off."
              + " It may or may not receive the notification later."
          });
        }, 1 * 60 * 1000);
      })
      .then(function () {
        if (old && !old.resolved) {
          old.resolve();
          old.resolved = true;
        }
        // TODO res.json went here previously
      })
      .then(function () {
        if (old && !old.resolved) {
          old.reject({ message: 'a newer promise failed and cancelled this one' });
          old.resolved = true;
        }

        p.resolved = true;
        clearTimeout(p.timeout);
        p.timeout = null;
        delete pushes[id];
      });
    });
  }

  poor.get(id).then(function (url) {
    if (!url) {
      //res.statusCode = 400;
      throw new Error("Bad id");
    }

    return pushdata(id, body.data || body).then( function () {
      return requestPush(url);
    });
  });
}

function routeDemo(rest) {
  //
  // RESTful Push data from web to server (and to phone)
  //
  rest.post('/api/push/:id', function (req, res) {
    var params = req.params
      , body = req.body
      ;

    pushMessage(params.id, body).then(function () {
      res.json({ success: true });
    }, function (err) {
      console.error('ERROR /api/push/:id');
      console.error(err);
      res.error(err);
    });
  });

  // Test if a phone is registered by id
  // TODO check by number
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
}

function registerPush(body) {
  if (!body.url) {
    //res.statusCode = 400;
    throw new Error("Missing url");
  }
  
  if (!body.number) {
    throw new Error("Missing phone number");
  }

  return poor.get(body.url).then(function (id) {
    if (id) {
      return id;
    }

    function getNewId() {
      id = hri.random();

      return poor.get(id).then(function (url) {
        if (url && url !== body.url) {
          return getNewId();
        }

        return Promise.all([
          poor.put(body.number, id)
        , poor.put(body.url, id)
        , poor.put(id, body.url)
        ]).then(function () {
          return id;
        });
      });
    }

    return getNewId();
  });
}

function route(rest) {
  // Register
  function restfulRegisterPush(req, res) {
    var body = req.body
      ;

    console.log('restfulRegisterPush');
    console.log(req.body);
    return registerPush(body).then(function (id) {
      res.json({ success: true, id: id });
    }, function (err) {
      console.error('ERROR /api/phones/push/register');
      console.error(err);
      res.error(err);
    });
  }
  rest.post('/api/push', restfulRegisterPush);

  rest.post('/api/phones/push/register', restfulRegisterPush);

  // Register: send a text message to the phone with confirmation id
  // rest.post('/api/phones/register', registerPush);

  // Register: validate the confirmation id and activate the phone's usage
  // rest.post('/api/phones/register/activate', registerPush);

  //
  // RESTful Send SMS Web to Phone
  //
  rest.post('/api/accounts/:accountId/sms', function (req, res) {
    // TODO accountId
    var body = req.body
      , from = body.from
      , id
      ;

    body.type = 'sms';
    id = id && id.id || id;

    if (!/\+1\d{10}/.test(from)) {
      res.error({ message: "numbers must be formatted in the international format such as +15557890123" });
      return;
    }

    return poor.get(from).then(function (id) {
      if (!id) {
        throw new Error("no phone by the number was found, please register");
      }

      // TODO store everything in the one object
      return pushMessage(id, body);
    }).then(function () {
      res.send(body);
    }, function (err) {
      console.error('ERROR /api/accounts/:accountId/sms');
      console.error(err.error || err.message || typeof err);
      res.error(err);
    });
  });

  // If the device received the USSD packet (push) that means
  // it also has a data connection and will be able to retrieve
  // the data which awaits it immediately. Here she be.
  function retrieveNotifications(req, res) {
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
  }
  rest.get('/api/phones/notifications/:id', retrieveNotifications);
  rest.get('/api/push/:id/data', retrieveNotifications);
}

app.use(urlrouter(route));
app.use(urlrouter(routeDemo));

module.exports = app;
