cell-fox (twilio / nexmo / google voice clone)
========

An SMS / MMS platform built on Node.js, Firefox OS, and the ZTE Open C.

* Node.js powers the webservice API (sms, mms, webhooks)
* FxOS (Firefox OS) powers the phone API (sms, mms, push notifications)
* Open C / Flame hardware can be used with T-Mobile (or any GSM/3g provider)

**Features**

* 20~60 messages per minute (limited by provider)
* $35/month flat rate through T-Mobile
* 1 number on ZTE phones, up to 2 numbers on Flame

**Compatible Phones**

* ZTE Open 
* ZTE Open C [< $70](http://www.ebay.com/sch/i.html?_nkw=firefox+zte)
* Flame [$170](https://developer.mozilla.org/en-US/Firefox_OS/Developer_phone_guide/Flame)

**Current Progress**

* https://github.com/coolaj86/fxos-push-notification-demo
* https://github.com/coolaj86/fxos-sms-demo

Installation
=======

TODO

API
====

TODO

POST /api/accounts/:accountId/messages

```javascript
{ from: '+15557980123'
, to: ['+15557980123']
, body: '<= 160 characters of text' // (up to 1600 when MMS is specified)
, mediaUrl: 'http://'
, mms: false // set to true to use MMS
, webhook: 'http://example.com/messages/incoming/'
}
````

```javascript
{ '+15557980123': { id: "abc123" }
}
```

POST /api/accounts/:accountId/settings

```javascript
{ hooks:
  { "*": // sms, mms, voice, voicemail, etc
    { "*": // phone number
      { "*": "http://example.com/numbers/:number/messages/:messageId/:type?sid=:sid" // status, incoming, etc
      , status: "http://example.com/messages/:messageId/status"
      , incoming: "http://example.com/messages/:messageId"
      }
    }
  }
}
```

TODO

* message templates
* multiple 
