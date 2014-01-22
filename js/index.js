
;(function (window) {
  function onDeviceReady() {
    init();
  }
  function init() {
    var context = Nervenet.createContext(),
        gui = new Gamepop.view.GUI({
          el: document.body
        }),
        appsCollection = new Gamepop.model.AppsCollection(),
        apps = new Gamepop.view.AppsList({
          el: '#apps',
          collection: appsCollection
        }),
        feedsCollection = new Gamepop.model.FeedsCollection(),
        feeds = new Gamepop.view.FeedsList({
          el: '#feeds',
          collection: feedsCollection
        }),
        router = new Gamepop.Router();

    context.mapValue('gui', gui);
    context.mapValue('router', router);
    context
      .inject(feeds)
      .inject(router);

    Backbone.history.start();
  }

  if (DEBUG) {
    init();
  }

  document.addEventListener('deviceready', onDeviceReady, false);
}(window));