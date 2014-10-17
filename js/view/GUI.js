/**
 * Created by meathill on 14-1-21.
 */
;(function (ns) {
  'use strict';

  var lastTouch
    , Popup = gamepop.view.Popup;

  ns.GUI = Backbone.View.extend({
    $router: null,
    $context: null,
    $homepage: null,
    $fav: null,
    events: {
      'click': 'clickHandler',
      'click .no-click': 'preventDefault',
      'click .item': 'preventDefault',
      'swipeleft': 'swipeLeftHandler',
      'swiperight': 'swipeRightHandler',
      'touch': 'touchHandler',
      'tap .item': 'item_tapHandler',
      'tap .back-button': 'backButton_tapHandler',
      'tap .download-button': 'downloadButton_tapHandler',
      'tap .fav-button': 'favButton_tapHandler',
      'tap .game-button': 'gameButton_tapHandler'
    },
    initialize: function () {
      Hammer(this.el, {
        hold: false,
        transform: false
      });
    },
    back: function (isRouter) {
      if (WEB) {
        if (gamepop.history.length === 0) {
          return this.$router.navigate('#/');
        }
        gamepop.history.pop();
        Popup.removeLast();
        if (!isRouter) {
          history.back();
        }
      } else {
        // client应用中，back键被捕获了，所以一定是手工后退
        var hash = location.hash.substr(2);
        if (hash === '' || gamepop.history.length === 0) {
          location.href = 'popo:return';
        } else if (!Popup.isSearch()) {
          gamepop.history.pop();
          Popup.removeLast();
          history.back();
        }
      }
    },
    backHome: function () {
      if (Popup.pages.length) {
        Popup.removeLast();
      }
    },
    showPopupPage: function (url, className, options) {
      if (Popup.search(url)) {
        return;
      }
      this.$context.createInstance(Popup, _.extend({
        url: url,
        classes: className
      }, options));
    },
    backButton_tapHandler: function (event) {
      if (event || this.$homepage.isNormal()) {
        this.back();
      }
    },
    downloadButton_tapHandler: function () {
      ga('send', 'event', 'game', 'download', this.$context.getValue('game-id'));
    },
    favButton_tapHandler: function (event) {
      var button = $(event.currentTarget);
      if (button.hasClass('active')) {
        this.$fav.remove(location.hash);
        ga('send', 'event', 'fav', 'remove', location.hash);
      } else {
        this.$fav.add({url: location.hash, title: $('.content h1').text()});
        ga('send', 'event', 'fav', 'add', location.hash);
      }
      button.toggleClass('active');
    },
    gameButton_tapHandler: function () {
      ga('send', 'event', 'game', 'play', this.$context.getValue('game-id'));
    },
    item_tapHandler: function (event) {
      var target = $(event.currentTarget)
        , href = target.data('href') || target.find('a').attr('href');
      if (!href) {
        return;
      }
      this.$router.navigate(href);
    },
    clickHandler: function (event) {
      // 有些功能我们用tap触发，之后可能有ui切换，这个时候系统可能会给手指离开的位置上的a触发一个click事件
      // 这个函数通过记录touch时的对象，和之后的a对比，如果不等于或者不包含就放弃该次点击
      // 还要避免label和对应的input之间出现click问题
      if (lastTouch) {
        var isLabel = lastTouch.tagName.toLowerCase() === 'label'
          , isLabelControl = isLabel && event.target === lastTouch.control;
        if (event.target !== lastTouch && !isLabelControl) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },
    preventDefault: function (event) {
      event.preventDefault();
    },
    swipeLeftHandler: function () {
      if (Popup.pages.length === 0 && !this.$homepage.el.classList.contains('back')) {
        this.$homepage.toggleSidebar();
      }
    },
    swipeRightHandler: function () {
      if (Popup.pages.length === 0 && this.$homepage.el.classList.contains('back')) {
        this.$homepage.toggleSidebar();
      }
    },
    touchHandler: function (event) {
      lastTouch = event.target;
    }
  });
  if (WEB) {
    ns.GUI = ns.GUI.extend({
      events: _.extend(ns.GUI.prototype.events, { // 用于与上一级的GUI中的events属性合并
        'tap .download-url-button': 'downloadURLButton_tapHandler',
        'tap .remove-button': 'removeButton_tapHandler',
        'tap #cover': 'cover_tapHandler',
        'tap .share-button': 'shareButton_tapHandler',
        'tap .share-cancel-button': 'shareCancelButton_tapHandler',
        'tap .wx-share': 'wxShare_tapHandler'
      }),
      cover_tapHandler: function (event) {
        $(event.currentTarget).remove();
      },
      downloadURLButton_tapHandler: function() { // 微信禁用一般的下载，只有让用户自行打开浏览器
        if (/micromessenger/i.test(navigator.userAgent)) {
          document.getElementById('cover').className = 'active';
        }
      },
      removeButton_tapHandler: function() {
        $("#download-panel").remove();
        localStorage.setItem("download", 'hide');
      },
      shareButton_tapHandler: function () {
        var title =  '游戏攻略全都有，这下不怕了，哈哈。请看：'+$('title').text()
          , url = encodeURIComponent(window.location.href);
        this.$('.popup-cover').fadeIn().siblings(".share-modal-pop").fadeIn()
          .find(".qq-share").attr("href", "http://connect.qq.com/widget/shareqq/index.html?url=" + url + "&showcount=0&desc=&summary=&title=" + title + "&pics=").end()
          .find(".qzone-share").attr("href", "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=" + url + "&title=" + title + "&pics=" + "" + "&summary=" + "").end()
          .find(".twb-share").attr("href", "http://share.v.t.qq.com/index.php?c=share&a=index&title=" + title + "&url=" + url + "&appkey=ce15e084124446b9a612a5c29f82f080&site=www.jiathis.com&pic=").end()
          .find(".swb-share").attr("href", "http://service.weibo.com/share/share.php?title=" + title + "&url=" + url + "&source=bookmark&appkey=2992571369&pic=&ralateUid=").end()
          .find(".renren-share").attr("href", "http://widget.renren.com/dialog/share?resourceUrl=" + url + "&srcUrl=" + url + "&title=" + title + "&pic=&description=").end();
        this.$('.fa-weixin').css('background-image','url(http://s.jiathis.com/qrcode.php?url='+location.href+')')
      },
      shareCancelButton_tapHandler: function(){
        this.$('.popup-cover,.share-modal-pop').fadeOut();
      },
      wxShare_tapHandler: function(){
        this.$('.fa-weixin').toggleClass('weixin-share-qrcode')
      }
    });
  }
}(Nervenet.createNameSpace('gamepop.view')));
