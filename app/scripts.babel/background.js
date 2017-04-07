'use strict';

function request(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

function getBtcUsd() {
  return request('https://api.uphold.com/v0/ticker/BTCUSD');
}

function getBtcBrlFromFox() {
  return request('http://api.bitvalor.com/v1/ticker.json');
}

function getBtcBrlFromBitwage() {
  return request('https://www.bitwage.com/rates#historicaltickers');
}

function setRateBadge() {
  var btcusd = undefined,
    bitwage = undefined,
    rates = {};

  getBtcUsd().then(function(res) {
    btcusd = JSON.parse(res).ask;
    return getBtcBrlFromFox(res);
  }).then(function(res) {
    let exchanges = JSON.parse(res).ticker_24h.exchanges;

    let foxRate = exchanges.FOX.last;
    let locRate = exchanges.LOC.last;
    let b2uRate = exchanges.B2U.last;

    let rate = (foxRate / btcusd).toFixed(2).toString().replace('.', ',');
    chrome.browserAction.setBadgeText({
      text: rate
    });

    rates = {
      fox: rate,
      loc: (locRate / btcusd).toFixed(2).toString().replace('.', ','),
      b2u: (b2uRate / btcusd).toFixed(2).toString().replace('.', ',')
    }

    localStorage.setItem('rates', JSON.stringify(rates));
  }).catch(function(err) {
    chrome.extension.getBackgroundPage().console.error(err);
    chrome.browserAction.setBadgeText({
      text: '...'
    });
  });
}

function setRateFromBitwage() {
  getBtcBrlFromBitwage().then(function(html) {
    var usdbrl = $(html).find('[id*=\'keyUSDBRL\']').parent().next('div').text().trim().substr(-4);
    usdbrl = usdbrl.replace('.', ',');
    console.log(`USDBRL extracted from Bitwage ${usdbrl}`);

    var rates = localStorage.getItem('rates');

    if (!rates) {
      rates = {
        bitwage: usdbrl
      };
    } else {
      rates = JSON.parse(rates);
      rates.bitwage = usdbrl;
    }

    localStorage.setItem('rates', JSON.stringify(rates));
  }).catch(function(err) {
    chrome.extension.getBackgroundPage().console.error(err);
  });
}

chrome.browserAction.setBadgeBackgroundColor({
  color: '#BFBF3A'
});
chrome.browserAction.setBadgeText({
  text: '...'
});

function init() {
  setRateBadge();
  setRateFromBitwage();
}

init();

chrome.alarms.create('btcbrl-alarm', {
  delayInMinutes: 1,
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  init();
});
