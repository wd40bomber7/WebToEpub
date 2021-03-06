/*
  parses fictionmania.tv
  Notes:
  * For this to work, need to go to page with set of chapters.
  * If book has more than 25 chapters, will need to get each set to chapters and
    put them together manually using "Edit Chapter URLs"
*/
"use strict";

parserFactory.register("fictionmania.tv", function() { return new FictionManiaParser() });

class FictionManiaParser extends Parser {
    constructor() {
        super();
    }

    getChapterUrls(dom) {
        let chapters = [];
        chapters = util.hyperlinksToChapterList(dom.body, this.isChapterHref);
        return Promise.resolve(chapters.reverse());
    }

    isChapterHref(link) {
        return (link.pathname.indexOf("/stories/readhtmlstory.html") != -1) ||
            (link.pathname.indexOf("/stories/readtextstory.html") != -1);
    }

    findContent(dom) {
        let content = util.getElement(dom, "div", e => (e.style.marginLeft !== ""));
        if (content === null) {
            // older versions have text in a <pre> element
            content = util.getElement(dom, "pre");
        }
        return content;
    }

    customRawDomToContentStep(chapter, content) {
        if (content.tagName.toLowerCase() === "pre") {
            this.convertPreTagToPTags(chapter.rawDom, content);
        }
    }

    convertPreTagToPTags(dom, element) {
        let rawText = element.innerText;
        let strings = this.normalizeEol(rawText).split("\n\n");
        element.innerText = "";
        for(let s of strings) {
            let p = dom.createElement("p");
            p.appendChild(dom.createTextNode(s));
            element.appendChild(p);
        }
    }

    normalizeEol(s) {
        return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    }

    extractTitle(dom) {
        let that = this;
        let title = util.getElement(dom.body, "a", e => that.isChapterHref(e));
        return (title === null) ? super.extractTitle(dom) : title.innerText;
    };

    extractAuthor(dom) {
        let author = util.getElement(dom.body, "a", e => (e.pathname.indexOf("/searchdisplay/authordisplay.html") !== -1));
        return (author === null) ? super.extractAuthor(dom) : author.innerText;
    };

    populateUI(dom) {
        super.populateUI(dom);
        CoverImageUI.showCoverImageUrlInput(true);
    }
}
