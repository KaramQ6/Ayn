(function () {
  var localApiPattern = /^(https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):5000)(\/.*)?$/i;
  var localWsPattern = /^(ws:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):5000)(\/.*)?$/i;

  function rewriteHttpUrl(value) {
    if (typeof value === 'string') {
      return value.replace(localApiPattern, window.location.origin + '$2');
    }

    if (value instanceof Request && localApiPattern.test(value.url)) {
      return new Request(value.url.replace(localApiPattern, window.location.origin + '$2'), value);
    }

    return value;
  }

  function rewriteWsUrl(value) {
    if (typeof value !== 'string') return value;
    var wsOrigin = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host;
    return value.replace(localWsPattern, wsOrigin + '$2');
  }

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    return nativeFetch(rewriteHttpUrl(input), init);
  };

  var NativeWebSocket = window.WebSocket;
  window.WebSocket = function WebSocket(url, protocols) {
    return protocols === undefined
      ? new NativeWebSocket(rewriteWsUrl(url))
      : new NativeWebSocket(rewriteWsUrl(url), protocols);
  };
  window.WebSocket.prototype = NativeWebSocket.prototype;
})();
