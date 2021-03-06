/*
  Makes HTML calls using Fetch API
*/
"use strict";

class HttpClient {
    constructor() {
    }

    static makeOptions() {
        return { credentials: "include" };
    }

    static wrapFetch(url) {
        return HttpClient.wrapFetchImpl(url, new FetchResponseHandler());
    }

    static fetchJson(url) {
        return HttpClient.wrapFetchImpl(url, new FetchJsonResponseHandler());
    }

    static wrapFetchImpl(url, handler) {
        return fetch(url, HttpClient.makeOptions()).then(function(response) {
            return HttpClient.checkResponseAndGetData(handler, response);
        });
    }

    static checkResponseAndGetData(handler, response) {
        if(!response.ok) {
            let errorMsg = chrome.i18n.getMessage("htmlFetchFailed", [response.url, response.status]);
            return Promise.reject(new Error(errorMsg));
        } else {
            handler.setResponse(response);
            return handler.extractContentFromResponse(response);
        }
    }
}

class FetchResponseHandler {
    isHtml() {
        return this.contentType.startsWith("text/html");
    }

    setResponse(response) {
        this.response = response;
        this.contentType = response.headers.get("content-type");
    }

    extractContentFromResponse(response) {
        if (this.isHtml()) {
            return this.responseToHtml(response);
        } else {
            return this.responseToBinary(response);
        }
    }

    responseToHtml(response) {
        return response.text().then(function(data) {
            let html = new DOMParser().parseFromString(data, "text/html");
            util.setBaseTag(this.response.url, html);
            this.responseXML = html;
            return this;
        }.bind(this));
    }

    responseToBinary(response) {
        return response.arrayBuffer().then(function(data) {
            this.arrayBuffer = data;
            return this;
        }.bind(this));
    }

    responseToJson(response) {
        return response.text().then(function(data) {
            this.json =  JSON.parse(data);
            return this;
        }.bind(this));
    }
}

class FetchJsonResponseHandler extends FetchResponseHandler {
    constructor() {
        super();
    }

    extractContentFromResponse(response) {
        return super.responseToJson(response);
    }
}
