$(function () {
  'use strict';

  var friendlyId
    , unfriendlyUrl
    ;

  function getVersion() {
    return parseInt($('.js-form-ffpushdata input[name="version"]').val(), 10);
  }

  function bumpVersion() {
    var version = getVersion()
      ;

    $('.js-form-ffpushdata input[name="version"]').val(version + 1);
    setVersion();
  }

  function setVersion() {
    var version = getVersion()
      ;

    $('.js-push-example code').text(
      "curl '" + unfriendlyUrl + "' \\"
      + "\n  -X PUT \\"
      + "\n  -d 'version=" + version + "'"
    );

    return version;
  }

  $('body').on('submit', '.js-form-ffpushinstruction', function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    $('.js-steps').hide();
    $('.js-step-1').show();
  });


  $('body').on('submit', '.js-form-ffpushid', function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    friendlyId = $('.js-form-ffpushid input').val().toLowerCase();

    $.get('/api/push/' + friendlyId).then(function (data) {
      if (data && data.exists) {
        $('.js-steps').hide();
        if (data.url) {
          unfriendlyUrl = data.url;
          $('.js-push-example').show();
          setVersion();
        }
        $('.js-step-2').show();
      } else {
        window.alert('Invalid Id');
      }
    }, function () {
      window.alert('Network Error');
    });
  });

  $('body').on('submit', '.js-form-ffpushdata', function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    var data = $('.js-form-ffpushdata textarea').val()
      ;

    setVersion();

    try {
      data = JSON.parse(data);
    } catch(e) {
      // ignore
    }
    
    data = { data: data, version: getVersion() };

    $.ajax({
      url: '/api/push/' + friendlyId
    , type: 'POST'
    , contentType : 'application/json'
    , data: JSON.stringify(data)
    }).then(function (data) {
      bumpVersion();
      // TODO websocket updates
      $('.js-console').show();
      $('.js-console-data').append(JSON.stringify(data, null, '  '));
      //$('.js-console-data').append('<div class="alert alert-success">Client received notification</div>');
    });
  });


  $('.js-steps').hide();
  $('.js-step-0').show();
});
