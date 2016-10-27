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
    return request("https://api.uphold.com/v0/ticker/BTCUSD");
}

function getBtcBrlFromFox() {
    return request("http://api.bitvalor.com/v1/ticker.json");
}

function setRateBadge() {
    var btcusd = undefined,
        rates = {};

    getBtcUsd().then(function(res) {
        btcusd = JSON.parse(res).ask;
        return getBtcBrlFromFox(res);
    }).then(function(res) {
        var exchanges = JSON.parse(res).ticker_24h.exchanges;
        foxRate = exchanges.FOX.last;
        locRate = exchanges.LOC.last;
        b2uRate = exchanges.B2U.last;

        var rate = (foxRate / btcusd).toFixed(2).toString().replace(".", ",");
        chrome.browserAction.setBadgeText({ text: rate });

        rates = {
            fox: rate,
            loc: (locRate / btcusd).toFixed(2).toString().replace(".", ","),
            b2u: (b2uRate / btcusd).toFixed(2).toString().replace(".", ",")
        }

        localStorage.setItem("rates", JSON.stringify(rates));
    }).catch(function(err) {
        chrome.extension.getBackgroundPage().console.error(err);
        chrome.browserAction.setBadgeText({ text: "..." });
    });
}

chrome.browserAction.setBadgeBackgroundColor({ color: "#BFBF3A" });
chrome.browserAction.setBadgeText({ text: "..." });

setRateBadge();

chrome.alarms.create("btcbrl-alarm", { delayInMinutes: 1, periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(function(alarm) {
    setRateBadge();
});