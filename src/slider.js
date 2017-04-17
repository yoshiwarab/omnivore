var SAT = require('sat');
var CSSKeyframer = require('css-keyframer');
var Prefixer = require('inline-style-prefixer');

function createDiamondClipPath(diamond) {
	var top = diamond.pos;
	var right = vectorAdd(diamond.pos, diamond.points[1]);
	var bottom = vectorAdd(diamond.pos, diamond.points[2]);
	var left = vectorAdd(diamond.pos, diamond.points[3]);

	return `polygon(${top.x}px ${top.y}px, ${right.x}px ${right.y}px, ${bottom.x}px ${bottom.y}px, ${left.x}px ${left.y}px)`
}

function getCenterScreenDiamonds() {
	var winsize = getWindowSize();
	var increment = 20;
	var windowPoly = new SAT.Box(new SAT.Vector(0, 0), winsize.width, winsize.height).toPolygon();

	var top = new SAT.Vector(winsize.width/2, winsize.height/2+1),
	right = new SAT.Vector(1, 1),
	bottom = new SAT.Vector(0, 2),
	left = new SAT.Vector(-1, 1);

	var start = new SAT.Polygon(top, [new SAT.Vector(), right, bottom, left]);
	var contain = copyPolygon(start);
	var fill;

	// [(0, 0), (1, 1), (0, 2), (-1, 1)]
	while(true) {
		contain = new SAT.Polygon(contain.pos.add(new SAT.Vector(0, -increment)), [
			new SAT.Vector(),
			contain.points[1].add(new SAT.Vector(increment, increment)),
			contain.points[2].add(new SAT.Vector(0, increment*2)),
			contain.points[3].add(new SAT.Vector(-increment, increment))
		]);

		if (!fill && Math.floor(contain.pos.y <= 0)) {
			fill = copyPolygon(contain);
		}

		var response = new SAT.Response();
		SAT.testPolygonPolygon(contain, windowPoly, response);
		if (response.bInA) {
			return { start: start, fill: fill, contain: contain }
		}
	}
}

function vectorAdd(v1, v2) {
	var v1 = new SAT.Vector().copy(v1);
	return v1.add(v2);
}

function copyPolygon(polygon) {
	var pos = new SAT.Vector().copy(polygon.pos);
	var points = [];
	for (var point of polygon.points) {
		var copy = new SAT.Vector().copy(point);
		points.push(copy);
	}
	return new SAT.Polygon(pos, points);
}

function getWindowSize() {
	var $body = $('body');
	var $window = $(window);
	$body.css( 'overflow-y', 'hidden' );
	var w = $window.width(), h =  $window.height();
	return { width : w, height : h };
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

module.exports = (function () {
	function Slider(wrapper) {
		// Durations
		this.durations = {
			auto: 5000,
			slide: 1400
		};
		// DOM
		this.dom = {
			wrapper: null,
			container: null,
			project: null,
			current: null,
			next: null,
			arrow: null
		};
		// Misc stuff
		this.length = 0;
		this.current = 0;
		this.next = 0;
		this.isAuto = false;
		this.working = false;
		this.dom.wrapper = wrapper;
		this.dom.slide = this.dom.wrapper.find('.slide');
		this.dom.arrow = this.dom.wrapper.find('.arrow');
		this.length = this.dom.slide.length;
		this.keyframer = new CSSKeyframer({ /* options */ }),

		this.init();
		this.events();
		this.createAnimation();
		// this.auto = setInterval(this.updateNext.bind(this), this.durations.auto);
	}
	/**
	* Set initial z-indexes & get current project
	*/
	Slider.prototype.init = function () {
		// this.dom.slide.css('z-index', 10);
		this.dom.current = $(this.dom.slide[this.current]);
		this.dom.next = $(this.dom.slide[this.current + 1]);
		// this.dom.current.css('z-index', 30);
		// this.dom.next.css('z-index', 20);
	};

	Slider.prototype.destroy = function () {
		this.dom.wrapper.off('DOMMouseScroll mousewheel');
	}

	/**
	* Initialize events
	*/
	Slider.prototype.events = function () {
		var self = this;
		this.dom.wrapper.on('DOMMouseScroll mousewheel', function(e) {
			e.preventDefault();
			if (self.working)
				return;
			self.processScroll(e.originalEvent);
		});
		this.dom.arrow.on('click', function () {
			console.log("HELLO");
			if (self.working)
				return;
			self.processBtn($(this));
		});
		$(window).on( 'debouncedresize', function() {
			self.createAnimation();
		});
	};

	Slider.prototype.createAnimation = function () {
		var diamonds = getCenterScreenDiamonds();
		var start = createDiamondClipPath(diamonds.start);
		var end = createDiamondClipPath(diamonds.contain);
		var prefixer = new Prefixer();

		var expandDiamondFromCenter = {
				'0%' : prefixer.prefix({
					clipPath: start
				}),
				'99%': prefixer.prefix({
					clipPath: end
				}),
				'100%': prefixer.prefix({
					width: '100%',
					height: '100%'
				})
		}

		this.keyframer.register("expandDiamondFromCenter", expandDiamondFromCenter);
	}

	Slider.prototype.processScroll = function (scrollEvent) {
		this.working = true;
		if (scrollEvent.deltaY < 0)
			this.updatePrevious();
		if (scrollEvent.deltaY > 0)
			this.updateNext();

	}

	Slider.prototype.processBtn = function (btn) {
		if (this.isAuto) {
			this.isAuto = false;
			clearInterval(this.auto);
		}
		if (btn.hasClass('next'))
			this.updateNext();
		if (btn.hasClass('previous'))
			this.updatePrevious();
	};

	/**
	* Update next global index
	*/
	Slider.prototype.updateNext = function () {
		console.log('UPDATE NEXT');
		this.next = (this.current + 1) % this.length;
		this.process();
	};

	/**
	* Update next global index
	*/
	Slider.prototype.updatePrevious = function () {
		console.log('UPDATE PREVIOUS');
		this.next--;
		if (this.next < 0)
			this.next = this.length - 1;
		this.process();
	};

	/**
	* Process, calculate and switch between slides
	*/
	Slider.prototype.process = function () {
		var self = this;
		this.dom.next = $(this.dom.slide[this.next]);
		this.dom.current.css('z-index', 20);
		this.dom.next.css('z-index', 30);

		self.dom.next.css(this.keyframer.animationProp.js, "expandDiamondFromCenter "+ this.durations.slide + "ms" + " forwards ease");
		self.dom.next.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
			self.dom.current.off('webkitAnimationEnd oanimationend msAnimationEnd animationend');
			self.dom.current.css('z-index', 10);
			self.dom.current.removeClass('showing');
			self.dom.next.addClass('showing');
			self.dom.current.css(self.keyframer.animationProp.js, '');
			self.dom.current = self.dom.next;
			self.current = self.next;
			self.working = false;
		})
	};

	return Slider
})();
