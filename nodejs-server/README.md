API
===

### `POST /api/push`

The device will register the push id it received with the server.

```javascript
{ "url": "http://push.mozilla.com/xxxxxxxxxxxx--crazy-long-id--xxxxxxxxxxxx" }
```

And it will receive an ephemeral friendly-id in response

```javascript
{ "success": true
, "id": "tricky-chicken-37" }
```

### `GET /api/push/:id`

The friendly-id will be displayed on the user's device screen.

The user will type it in and the browser will check here to see if the friendly is valid.

```javascript
{ "exists": true }
```

### `POST /api/push/:id`

The user may create a push notification with arbitrary data.

```javascript
{ "foo": "bar"
, "baz": 42
}
```

The response will not return until the device has acted on the push notification.

```javascript
{ "error": { "message": "timeout: the device may not have a network connection" } }
```

### `GET /api/push/:id/data`

The device may retrieve any data that has been pushed.

It will receive a batch of all unretrieved data.

```javascript
{ "success": true
, "batch": []
}
```
