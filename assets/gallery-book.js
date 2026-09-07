/* Graph Theory Art Gallery — page-turn book. */
(function () {
    "use strict";

    var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var SINGLE_MQ = window.matchMedia("(max-width: 760px)");

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
        });
    }

    function pad(n) {
        n = String(n);
        return n.length >= 3 ? n : ("000" + n).slice(-3);
    }

    function roman(i) {
        return ROMAN[i] || String(i + 1);
    }

    function build(catalog) {
        var pages = [];
        var parts = [];
        var platePages = [];
        var chs = catalog.chapters;
        var frontis = chs[0] && chs[0].plates[0] ? chs[0].plates[0][0] : "";

        pages.push({ type: "endpaper", kind: "front" });
        pages.push({ type: "cover" });
        pages.push({ type: "frontis", src: frontis });
        pages.push({ type: "title" });
        pages.push({ type: "contents-word" });
        pages.push({ type: "contents-list" });

        var n = 0;
        chs.forEach(function (ch, i) {
            if (pages.length % 2 === 1) pages.push({ type: "blank" });
            var start = n + 1;
            var end = n + ch.plates.length;
            var chapterPage = pages.length;
            pages.push({ type: "chapter", i: i, start: start, end: end });
            ch.plates.forEach(function (pair) {
                n += 1;
                platePages[n] = pages.length;
                pages.push({ type: "plate", n: n, src: pair[0], pdf: pair[1], i: i });
            });
            parts.push({
                i: i,
                title: ch.title,
                roman: roman(i),
                start: start,
                end: end,
                pageIndex: chapterPage
            });
        });

        if (pages.length % 2 === 1) pages.push({ type: "blank" });
        pages.push({ type: "colophon", total: n });
        pages.push({ type: "endpaper", kind: "back" });

        return { pages: pages, parts: parts, totalPlates: n, platePages: platePages };
    }

    function leafHtml(page, side, ctx) {
        var sideCls = "leaf is-" + side + " ";
        if (!page) {
            return '<div class="' + sideCls + 'blank"><div class="inset-rule"></div><div class="mark"></div></div>';
        }

        if (page.type === "endpaper") {
            var nLabel = page.kind === "front" ? String(ctx.totalPlates) : "FIN";
            return (
                '<div class="' + sideCls + 'endpaper">' +
                '<div class="stamp stamp-uh">UH · notebook</div>' +
                '<div class="block" aria-hidden="true"></div>' +
                '<div class="stamp stamp-n">' + esc(nLabel) + "</div>" +
                '<div class="stamp stamp-place">Prague<br>2026</div>' +
                "</div>"
            );
        }

        if (page.type === "cover") {
            return (
                '<div class="' + sideCls + 'cover">' +
                '<div class="cover-kicker">Sachal Abdullah</div>' +
                "<h1><span>Graph</span><span>Theory</span><span class=\"art\">Art</span></h1>" +
                '<div class="slash" aria-hidden="true"></div>' +
                '<div class="cover-foot"><span>' + ctx.totalPlates + ' plates</span><span>2026</span></div>' +
                "</div>"
            );
        }

        if (page.type === "frontis") {
            return (
                '<div class="' + sideCls + 'frontis">' +
                '<div class="inset-rule"></div>' +
                '<div class="plate-frame"><img src="' + esc(page.src) + '" alt="Frontispiece" draggable="false"></div>' +
                '<div class="edge-label">Frontispiece</div>' +
                "</div>"
            );
        }

        if (page.type === "title") {
            return (
                '<div class="' + sideCls + 'title-page">' +
                '<div class="inset-rule"></div>' +
                '<p class="kicker">A printed notebook</p>' +
                "<h2>Uniquely<br>Hamiltonian<br>graphs</h2>" +
                "<p>Drawings from a working notebook: vertices, edges, transitions, snarks, and constructions. Compiled from TikZ. One plate per page.</p>" +
                '<div class="title-foot"><span>Sachal Abdullah</span><span>Graph theory</span></div>' +
                "</div>"
            );
        }

        if (page.type === "contents-word") {
            return (
                '<div class="' + sideCls + 'contents-word">' +
                '<p class="giant">Con<br>tents<em>.</em></p>' +
                "</div>"
            );
        }

        if (page.type === "contents-list") {
            var items = ctx.parts.map(function (p) {
                return (
                    "<li><button type=\"button\" data-jump=\"" + p.pageIndex + "\">" +
                    '<span class="rom">' + p.roman + "</span>" +
                    "<span>" + esc(p.title) + "</span>" +
                    '<span class="rng">' + p.start + "–" + p.end + "</span>" +
                    "</button></li>"
                );
            }).join("");
            return (
                '<div class="' + sideCls + 'contents-list">' +
                '<div class="inset-rule"></div>' +
                "<ol>" + items + "</ol>" +
                "</div>"
            );
        }

        if (page.type === "chapter") {
            var part = ctx.parts[page.i];
            return (
                '<div class="' + sideCls + 'chapter">' +
                '<div class="rom" aria-hidden="true">' + part.roman + "</div>" +
                "<h2>" + esc(part.title) + "</h2>" +
                '<div class="bar"></div>' +
                '<div class="range">Plates ' + part.start + "–" + part.end + "</div>" +
                "</div>"
            );
        }

        if (page.type === "plate") {
            return (
                '<div class="' + sideCls + 'plate">' +
                '<div class="inset-rule"></div>' +
                '<div class="plate-frame">' +
                '<img src="' + esc(page.src) + '" alt="Plate ' + page.n + '" data-pdf="' + esc(page.pdf) + '" data-n="' + page.n + '" draggable="false">' +
                "</div>" +
                '<div class="plate-folio">' + pad(page.n) + "</div>" +
                '<div class="edge-label">Plate</div>' +
                "</div>"
            );
        }

        if (page.type === "colophon") {
            return (
                '<div class="' + sideCls + 'colophon">' +
                '<div class="inset-rule"></div>' +
                "<h2>Colophon</h2>" +
                "<p>" + page.total + " plates. Drawn in Mathcha and compiled from TikZ. Where a sheet held several diagrams, each diagram is its own plate.</p>" +
                "<p>No titles on the plates. The vocabulary is on the <a href=\"/graph-theory/\">graph theory notes</a>.</p>" +
                "<p>Sachal Abdullah · Prague · 2026</p>" +
                "</div>"
            );
        }

        return '<div class="' + sideCls + 'blank"><div class="inset-rule"></div><div class="mark"></div></div>';
    }

    function paint(el, page, side, ctx) {
        var paper = page && ({ plate: 1, frontis: 1, title: 1, "contents-list": 1, colophon: 1, blank: 1 })[page.type];
        el.innerHTML = leafHtml(page, side, ctx) + (paper ? '<div class="dog-ear" aria-hidden="true"></div>' : "");
    }

    function Book(model) {
        this.pages = model.pages;
        this.parts = model.parts;
        this.totalPlates = model.totalPlates;
        this.platePages = model.platePages;
        this.ctx = { parts: model.parts, totalPlates: model.totalPlates };
        this.single = SINGLE_MQ.matches;
        this.spread = 0;
        this.index = 1; /* cover on the right in spread 0 */
        this.busy = false;
        this.queued = null;
        this.flip = null;

        this.book = document.getElementById("book");
        this.left = document.getElementById("page-left");
        this.right = document.getElementById("page-right");
        this.flipper = document.getElementById("flipper");
        this.flipFront = document.getElementById("flip-front");
        this.flipBack = document.getElementById("flip-back");
        this.folio = document.getElementById("folio-label");
        this.prevBtn = document.getElementById("prev");
        this.nextBtn = document.getElementById("next");
        this.scrub = document.getElementById("scrub");
        this.thumbs = document.getElementById("thumbs");
        this.lightbox = document.getElementById("lightbox");
        this.lbImg = document.getElementById("lb-img");
        this.lbPdf = document.getElementById("lb-pdf");

        this.maxSpread = Math.ceil(this.pages.length / 2) - 1;
        this.scrub.max = String(this.totalPlates);
        this.buildThumbs();
        this.bind();
        this.applyMode();
        this.readHash();
        this.render();
        this.prefetch();
    }

    Book.prototype.applyMode = function () {
        this.book.classList.toggle("single", this.single);
        document.body.classList.toggle("gallery-single", this.single);
    };

    Book.prototype.currentPage = function () {
        if (this.single) return this.index;
        return this.spread * 2;
    };

    Book.prototype.can = function (dir) {
        if (this.single) {
            if (dir === "forward") return this.index < this.pages.length - 1;
            return this.index > 0;
        }
        if (dir === "forward") return this.spread < this.maxSpread;
        return this.spread > 0;
    };

    Book.prototype.buildThumbs = function () {
        var self = this;
        this.thumbs.innerHTML = this.parts.map(function (p) {
            return '<button type="button" data-jump="' + p.pageIndex + '" aria-label="Part ' + p.roman + ", " + esc(p.title) + '">' + p.roman + "</button>";
        }).join("");
        this.thumbs.addEventListener("click", function (e) {
            var btn = e.target.closest("button[data-jump]");
            if (btn) self.jumpTo(Number(btn.getAttribute("data-jump")));
        });
    };

    Book.prototype.paintSpread = function (spread) {
        var L = this.pages[spread * 2];
        var R = this.pages[spread * 2 + 1];
        paint(this.left, L, "left", this.ctx);
        paint(this.right, R, "right", this.ctx);
    };

    Book.prototype.paintSingle = function (index) {
        var page = this.pages[index];
        var side = index % 2 === 0 ? "left" : "right";
        paint(this.right, page, side, this.ctx);
    };

    Book.prototype.render = function () {
        if (this.single) this.paintSingle(this.index);
        else this.paintSpread(this.spread);
        this.syncChrome();
        this.writeHash();
        this.prefetch();
    };

    Book.prototype.pageAtView = function () {
        if (this.single) return this.pages[this.index];
        var r = this.pages[this.spread * 2 + 1];
        var l = this.pages[this.spread * 2];
        if (r && r.type === "plate") return r;
        if (l && l.type === "plate") return l;
        return r || l;
    };

    Book.prototype.syncChrome = function () {
        var label = this.folioText();
        this.folio.textContent = label;
        this.prevBtn.disabled = !this.can("back");
        this.nextBtn.disabled = !this.can("forward");

        var plate = null;
        if (this.single) {
            if (this.pages[this.index] && this.pages[this.index].type === "plate") {
                plate = this.pages[this.index].n;
            }
        } else {
            var L = this.pages[this.spread * 2];
            var R = this.pages[this.spread * 2 + 1];
            if (R && R.type === "plate") plate = R.n;
            else if (L && L.type === "plate") plate = L.n;
        }
        if (plate) this.scrub.value = String(plate);

        var partI = this.activePart();
        var idx = this.single ? this.index : this.spread * 2;
        var p0 = this.pages[idx];
        var front = !p0 || p0.type === "cover" || p0.type === "endpaper" || p0.type === "frontis" || p0.type === "title" || p0.type === "contents-word" || p0.type === "contents-list" || p0.type === "colophon" || p0.type === "blank";
        Array.prototype.forEach.call(this.thumbs.querySelectorAll("button"), function (btn, i) {
            btn.setAttribute("aria-current", !front && i === partI ? "true" : "false");
        });
    };

    Book.prototype.activePart = function () {
        var idx = this.single ? this.index : this.spread * 2;
        var found = -1;
        for (var i = 0; i < this.parts.length; i++) {
            if (this.parts[i].pageIndex <= idx) found = i;
        }
        var page = this.pages[idx];
        var other = this.pages[idx + 1];
        if (page && page.type === "plate") found = page.i;
        if (other && other.type === "plate" && !this.single) found = other.i;
        if (page && page.type === "chapter") found = page.i;
        return found;
    };

    Book.prototype.folioText = function () {
        if (this.single) {
            var p = this.pages[this.index];
            return this.labelFor(p);
        }
        var L = this.pages[this.spread * 2];
        var R = this.pages[this.spread * 2 + 1];
        if (L && L.type === "plate" && R && R.type === "plate") {
            return "Pl. " + L.n + "–" + R.n;
        }
        if (L && L.type === "chapter" && R && R.type === "plate") {
            return "Part " + roman(L.i) + " · Pl. " + R.n;
        }
        if (R && R.type === "plate") return "Pl. " + R.n;
        if (L && L.type === "plate") return "Pl. " + L.n;
        if (R && R.type === "endpaper" && L) return this.labelFor(L);
        return this.labelFor(R || L);
    };

    Book.prototype.labelFor = function (p) {
        if (!p) return "";
        if (p.type === "cover" || (p.type === "endpaper" && p.kind === "front")) return "Cover";
        if (p.type === "frontis") return "Frontispiece";
        if (p.type === "title") return "Title";
        if (p.type === "contents-word" || p.type === "contents-list") return "Contents";
        if (p.type === "chapter") return "Part " + roman(p.i);
        if (p.type === "plate") return "Pl. " + p.n;
        if (p.type === "colophon") return "Colophon";
        if (p.type === "endpaper") return "Endpaper";
        return "";
    };

    Book.prototype.writeHash = function () {
        var p = this.single ? this.pages[this.index] : this.pages[this.spread * 2 + 1] || this.pages[this.spread * 2];
        var hash = "";
        if (p && p.type === "plate") hash = "p" + p.n;
        else if (p && p.type === "chapter") hash = "part-" + (p.i + 1);
        else if (p && (p.type === "contents-list" || p.type === "contents-word")) hash = "contents";
        else if (p && p.type === "title") hash = "title";
        else if (p && p.type === "frontis") hash = "frontis";
        else if (p && p.type === "colophon") hash = "colophon";
        else if (this.spread === 0 && !this.single) hash = "";
        else if (this.single && this.index <= 1) hash = "";
        if (hash) {
            if (location.hash !== "#" + hash) history.replaceState(null, "", "#" + hash);
        } else if (location.hash) {
            history.replaceState(null, "", location.pathname + location.search);
        }
    };

    Book.prototype.readHash = function () {
        var h = (location.hash || "").replace(/^#/, "");
        if (!h) return;
        if (h.charAt(0) === "p" && /^\d+$/.test(h.slice(1))) {
            this.goPlate(Number(h.slice(1)), true);
            return;
        }
        if (h.indexOf("part-") === 0) {
            var n = Number(h.slice(5)) - 1;
            if (this.parts[n]) this.goPage(this.parts[n].pageIndex, true);
            return;
        }
        if (h === "contents") {
            this.goPage(4, true);
            return;
        }
        if (h === "title" || h === "frontis") {
            this.goPage(2, true);
            return;
        }
        if (h === "colophon") {
            var i = this.pages.findIndex(function (p) { return p.type === "colophon"; });
            if (i >= 0) this.goPage(i, true);
        }
    };

    Book.prototype.goPage = function (pageIndex, instant) {
        pageIndex = Math.max(0, Math.min(this.pages.length - 1, pageIndex));
        if (this.single) this.index = pageIndex;
        else this.spread = Math.floor(pageIndex / 2);
        if (instant || REDUCE) this.render();
        else this.render();
    };

    Book.prototype.goPlate = function (n, instant) {
        n = Math.max(1, Math.min(this.totalPlates, n));
        var idx = this.platePages[n];
        if (idx == null) return;
        this.goPage(idx, instant);
    };

    Book.prototype.jumpTo = function (pageIndex) {
        this.goPage(pageIndex, true);
    };

    Book.prototype.prefetch = function () {
        var pages = this.pages;
        var start, end, i, p, im;
        if (this.single) {
            start = this.index - 1;
            end = this.index + 3;
        } else {
            start = (this.spread - 1) * 2;
            end = (this.spread + 2) * 2 + 1;
        }
        for (i = start; i <= end; i++) {
            p = pages[i];
            if (p && p.src) {
                im = new Image();
                im.src = p.src;
            }
        }
    };

    Book.prototype.setBusy = function (on) {
        this.busy = on;
        this.book.classList.toggle("is-busy", on);
    };

    Book.prototype.beginFlip = function (dir) {
        if (!this.can(dir)) return false;
        if (this.single) return this.beginFlipSingle(dir);

        var from = this.spread;
        var to = dir === "forward" ? from + 1 : from - 1;
        var fromL = this.pages[from * 2];
        var fromR = this.pages[from * 2 + 1];
        var toL = this.pages[to * 2];
        var toR = this.pages[to * 2 + 1];

        this.flip = { dir: dir, from: from, to: to, progress: 0 };
        this.flipper.className = "flipper is-on " + (dir === "forward" ? "is-forward" : "is-back");
        this.flipper.style.transition = "none";
        this.flipper.style.transform = "rotateY(0deg)";

        if (dir === "forward") {
            paint(this.flipFront, fromR, "right", this.ctx);
            paint(this.flipBack, toL, "left", this.ctx);
            paint(this.right, toR, "right", this.ctx);
        } else {
            paint(this.flipFront, fromL, "left", this.ctx);
            paint(this.flipBack, toR, "right", this.ctx);
            paint(this.left, toL, "left", this.ctx);
        }
        void this.flipper.offsetWidth;
        return true;
    };

    Book.prototype.beginFlipSingle = function (dir) {
        var from = this.index;
        var to = dir === "forward" ? from + 1 : from - 1;
        var fromPage = this.pages[from];
        var toPage = this.pages[to];
        var fromSide = from % 2 === 0 ? "left" : "right";
        var toSide = to % 2 === 0 ? "left" : "right";

        this.flip = { dir: dir, from: from, to: to, progress: 0 };
        this.flipper.className = "flipper is-on " + (dir === "forward" ? "is-forward" : "is-back");
        this.flipper.style.transition = "none";
        this.flipper.style.transform = "rotateY(0deg)";
        paint(this.flipFront, fromPage, fromSide, this.ctx);
        paint(this.flipBack, toPage, toSide, this.ctx);
        paint(this.right, toPage, toSide, this.ctx);
        void this.flipper.offsetWidth;
        return true;
    };

    Book.prototype.setProgress = function (p) {
        if (!this.flip) return;
        p = Math.max(0, Math.min(1, p));
        this.flip.progress = p;
        var angle = this.flip.dir === "forward" ? -180 * p : 180 * p;
        this.flipper.style.transform = "rotateY(" + angle + "deg)";
    };

    Book.prototype.finishFlip = function (commit) {
        var self = this;
        var flip = this.flip;
        if (!flip) return;

        if (REDUCE) {
            this.settle(commit);
            return;
        }

        this.setBusy(true);
        this.flipper.classList.add("is-tween");
        this.flipper.style.transition = "";
        var target = commit ? 1 : 0;
        var done = function (e) {
            if (e && e.propertyName && e.propertyName !== "transform") return;
            self.flipper.removeEventListener("transitionend", done);
            self.settle(commit);
        };
        this.flipper.addEventListener("transitionend", done);
        requestAnimationFrame(function () {
            self.setProgress(target);
        });
        setTimeout(function () {
            if (self.flip === flip) done();
        }, 950);
    };

    Book.prototype.settle = function (commit) {
        var flip = this.flip;
        if (!flip && !this.busy) return;
        this.flipper.className = "flipper";
        this.flipper.style.transform = "";
        this.flipper.style.transition = "";
        this.flip = null;
        this.setBusy(false);
        if (commit && flip) {
            if (this.single) this.index = flip.to;
            else this.spread = flip.to;
        }
        this.render();
        var q = this.queued;
        this.queued = null;
        if (q) this.turn(q);
    };

    Book.prototype.turn = function (dir) {
        if (this.busy || this.flip) {
            this.queued = dir;
            return;
        }
        if (!this.beginFlip(dir)) return;
        this.finishFlip(true);
    };

    Book.prototype.bind = function () {
        var self = this;
        var drag = null;

        this.prevBtn.addEventListener("click", function () { self.turn("back"); });
        this.nextBtn.addEventListener("click", function () { self.turn("forward"); });

        this.scrub.addEventListener("input", function () {
            self.goPlate(Number(self.scrub.value), true);
        });

        this.book.addEventListener("click", function (e) {
            var jump = e.target.closest("[data-jump]");
            if (jump) {
                e.preventDefault();
                self.jumpTo(Number(jump.getAttribute("data-jump")));
            }
        });

        this.book.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            if (e.target.closest("button, a, input")) return;
            drag = {
                id: e.pointerId,
                startX: e.clientX,
                started: false,
                onImg: !!e.target.closest("img"),
                img: e.target.closest("img")
            };
            try { self.book.setPointerCapture(e.pointerId); } catch (err) {}
        });

        this.book.addEventListener("pointermove", function (e) {
            if (!drag || e.pointerId !== drag.id) return;
            var dx = e.clientX - drag.startX;
            if (!drag.started && Math.abs(dx) > 10) {
                if (self.busy) return;
                var dir = dx < 0 ? "forward" : "back";
                if (!self.beginFlip(dir)) {
                    drag = null;
                    return;
                }
                drag.started = true;
                drag.dir = dir;
                self.setBusy(true);
            }
            if (drag && drag.started) {
                var w = self.book.getBoundingClientRect().width / (self.single ? 1 : 2);
                var p = drag.dir === "forward" ? (-dx) / w : dx / w;
                self.setProgress(p);
            }
        });

        function endDrag(e) {
            if (!drag || (e && e.pointerId !== drag.id)) return;
            var info = drag;
            drag = null;
            if (info.started) {
                self.finishFlip(self.flip && self.flip.progress > 0.22);
                return;
            }
            if (self.busy) return;
            if (info.onImg && info.img && info.img.dataset.n) {
                self.openLight(info.img);
                return;
            }
            var rect = self.book.getBoundingClientRect();
            var x = (e && e.clientX) || info.startX;
            var mid = rect.left + rect.width / 2;
            if (self.single) {
                self.turn(x > mid ? "forward" : "back");
            } else {
                self.turn(x >= mid ? "forward" : "back");
            }
        }

        this.book.addEventListener("pointerup", endDrag);
        this.book.addEventListener("pointercancel", function () {
            if (drag && drag.started) self.finishFlip(false);
            drag = null;
        });

        document.addEventListener("keydown", function (e) {
            if (self.lightbox && !self.lightbox.hidden) {
                if (e.key === "Escape") self.closeLight();
                return;
            }
            if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
                e.preventDefault();
                self.turn("forward");
            } else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
                e.preventDefault();
                self.turn("back");
            } else if (e.key === "Home") {
                e.preventDefault();
                self.jumpTo(1);
            } else if (e.key === "End") {
                e.preventDefault();
                var i = self.pages.findIndex(function (p) { return p.type === "colophon"; });
                if (i >= 0) self.jumpTo(i);
            }
        });

        document.getElementById("lb-close").addEventListener("click", function () { self.closeLight(); });
        this.lightbox.addEventListener("click", function (e) {
            if (e.target === self.lightbox) self.closeLight();
        });

        SINGLE_MQ.addEventListener("change", function () {
            var was = self.single;
            self.single = SINGLE_MQ.matches;
            if (was === self.single) return;
            if (self.single) self.index = self.spread * 2 + 1;
            else self.spread = Math.floor(self.index / 2);
            self.applyMode();
            self.render();
        });

        window.addEventListener("hashchange", function () { self.readHash(); self.render(); });
    };

    Book.prototype.openLight = function (img) {
        this.lbImg.src = img.src;
        this.lbImg.alt = img.alt || "Plate";
        this.lbPdf.href = img.dataset.pdf || "#";
        this.lightbox.hidden = false;
        document.getElementById("lb-close").focus();
    };

    Book.prototype.closeLight = function () {
        this.lightbox.hidden = true;
        this.lbImg.src = "";
    };

    document.addEventListener("DOMContentLoaded", function () {
        if (!window.GALLERY || !window.GALLERY.chapters) {
            document.getElementById("folio-label").textContent = "Catalog missing";
            return;
        }
        window.GALLERY_BOOK = new Book(build(window.GALLERY));
    });
})();
