// var $ = require('jquery');
window.jQuery = window.$ = require('jquery');
var velocity = require('velocity-animate');
var SAT = require('sat');
var CSSKeyframer = require('css-keyframer');
var Prefixer = require('inline-style-prefixer');
var Slider = require('./slider.js');

console.log(Slider);

module.exports = (function() {

	var $items = $( '.projects > .project' ),
	// window and body elements
	$window = $( window ),
	$body = $( 'BODY' ),
	// transitions support
	supportTransitions = Modernizr.csstransitions,
	// current item's index
	current = -1,
	// window width and height
	winsize = getWindowSize(),

	keyframer = new CSSKeyframer({ /* options */ }),

	prefixer = new Prefixer();

	var slider;

	function init( options ) {
		initEvents();
	}

	function initEvents() {

		$items.each( function() {

			var $item = $( this ),
			$close = $item.find( 'span.close' ),
			$overlay = $item.children( 'div.overlay' ),
			$title = $item.find( '.visible-item span'),
			$visible = $item.find('.visible-item'),
			$slides = $item.find('.slides');

			$item.on( 'click', function() {
				if( $item.data( 'isExpanded' ) ) {
					return false;
				}
				$item.data( 'isExpanded', true );

				$body.on('DOMMouseScroll mousewheel', function(e) {
					e.preventDefault();
				})
				// save current item's index
				current = $item.index();

				// Placement of item on the screen
				var layoutProp = getItemLayoutProp( $item );

				// Initial clip-path immediately below item title
				var top = new SAT.Vector(winsize.width/2, layoutProp.top+layoutProp.height),
				right = new SAT.Vector(1, 1),
				bottom = new SAT.Vector(0, 2),
				left = new SAT.Vector(-1, 1);

				// Start diamond SAT.Polygon
				var startDiamond = new SAT.Polygon(top, [new SAT.Vector(), right, bottom, left]);

				var diamonds = getCenterScreenDiamonds();
				// Diamond when the top point hits the top of the screen
				var topDiamond = diamonds.fill;
				// Diamond when the screen is completely contained
				var endDiamond = diamonds.contain;

				// clip-path strings for all of the diamonds
				var start = createDiamondClipPath(startDiamond);
				var top = createDiamondClipPath(topDiamond);
				var end = createDiamondClipPath(endDiamond);

				// The relative size of the diamond where the top hits the top of the window to the final diamond
				var topPercent = '' + (((topDiamond.pos.y + topDiamond.points[2].y) / (endDiamond.pos.y + endDiamond.points[2].y)).toFixed(2) * 100) + '%';
								// var topPercent = ((topDiamond.pos.y + topDiamond.points[2].y) / (endDiamond.pos.y + endDiamond.points[2].y)).toFixed(2);


				var thisIdx = $items.index($item);
				var prevLp = getItemLayoutProp($($items[thisIdx-1] || $item));
				var nextLp = getItemLayoutProp($($items[thisIdx+1] || $item));

				var animationTime = '2000ms';
				var timingFunction = 'ease';

				$overlay[0].style['pointer-events'] = 'auto';

				var expandDiamondReveal = {
					'0%' : prefixer.prefix({
						 opacity: 1,
						 clipPath: start,
						 zIndex: 999
					}),
					'99%': prefixer.prefix({
						clipPath: end
					}),
					'100%': prefixer.prefix({
						opacity: 1,
						zIndex: 999,
						width: '100%',
						height: '100%'
					})
				}

				expandDiamondReveal[topPercent] = {
					clipPath: top
				}

				// CSS property will be added vendor-prefix is automatically!
				keyframer.register("expandDiamondReveal", expandDiamondReveal);

				$overlay[0].style[keyframer.animationProp.js] = "expandDiamondReveal "+ animationTime + " forwards " + timingFunction;

				/*******************************************************/

				var titleLayoutProp = getItemLayoutProp($title);
				$title[0].style['left'] = 0;
				$title[0].style['right'] = 0;
				$title[0].style['margin'] = '0 auto';
				$title[0].style['position'] = 'fixed';
				$title[0].style['pointer-events'] = 'none';
				var moveUp = {
					'0%': prefixer.prefix({
						position: 'fixed',
						top: titleLayoutProp.top + 'px',
						left: 0,
						right: 0,
						margin: '0 auto',
						zIndex: 1000
					}),
					'99%': prefixer.prefix({
						position: 'fixed',
						left: 0,
						right: 0,
						margin: '0 auto',
					}),
					'100%': prefixer.prefix({
						position: 'fixed',
						top: '1em',
						left: 0,
						right: 0,
						margin: '0 auto',
						zIndex: 10000
					})
				}
				moveUp[topPercent] = {
					left: 0,
					right: 0,
					margin: '0 auto',
					top: '1em'
				}
				keyframer.register("moveUp", moveUp);

				$title[0].style[keyframer.animationProp.js] = "moveUp " + animationTime + " forwards " + timingFunction;

				moveUp[topPercent] = {
					transform: `translateY(${layoutProp.top}px)`
				}

				/*******************************************************/

				var exitUp = {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: `translateY(${endDiamond.pos.y}px)`
					}
				};

				exitUp[topPercent] = {
					transform: `translateY(${prevLp.top + prevLp.height})`,
					opacity: '0.4'
				}

				keyframer.register("exitUp", exitUp);

				/*******************************************************/

				var exitDown = {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: `translateY(${endDiamond.pos.y + endDiamond.points[2].y}px)`
					}
				};
				exitDown[topPercent] = {
					transform: `translateY(${topDiamond.pos.y + topDiamond.points[2].y}px)`,
					opacity: '0'
				};

				keyframer.register("exitDown", exitDown);

				/*******************************************************/

				for (var i = 0; i < $items.length; i++) {
					var item = $items[i]
					if (i == thisIdx) {
						continue;
					} else if (i < thisIdx) {
						item.style[keyframer.animationProp.js] = "exitUp " + animationTime + " forwards " + timingFunction;
					} else {
						item.style[keyframer.animationProp.js] = "exitDown " + animationTime + " forwards " + timingFunction;
					}
				}

				$overlay.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
					$overlay.off('webkitAnimationEnd oanimationend msAnimationEnd animationend');
					$body.off('DOMMouseScroll mousewheel');
					slider = new Slider($slides);
				});

			});

			$close.on( 'click', function(event) {
				$body.on('DOMMouseScroll mousewheel', function(e) {
					e.preventDefault();
				})

				var diamonds = getCenterScreenDiamonds();
				// Diamond when the top point hits the top of the screen
				var topDiamond = diamonds.fill;
				// Diamond when the screen is completely contained
				var startDiamond = diamonds.contain;

				// Get inital placement of item
				var layoutProp = getItemLayoutProp( $item );

				var top = new SAT.Vector(winsize.width/2, layoutProp.top+layoutProp.height),
				right = new SAT.Vector(1, 1),
				bottom = new SAT.Vector(0, 2),
				left = new SAT.Vector(-1, 1);

				var endDiamond = new SAT.Polygon(top, [new SAT.Vector(), right, bottom, left]);

				// clip-path strings for all of the diamonds
				var start = createDiamondClipPath(startDiamond);
				var end = createDiamondClipPath(endDiamond);

				var thisIdx = $items.index($item);
				var prevLp = getItemLayoutProp($($items[thisIdx-1] || $item));
				var nextLp = getItemLayoutProp($($items[thisIdx+1] || $item));

				var animationTime = '2000ms';
				var timingFunction = 'ease';

				$overlay[0].style['pointer-events'] = 'none';
				// CSS property will be added vendor-prefix is automatically!
				keyframer.register("retractDiamondReveal", {
					'0%' : {
						clipPath: start,
						opacity: 1,
						zIndex: 1
					},
					'100%': {
						clipPath: end,
						zIndex: 0,
						opacity: 1
					}
				});

				$overlay[0].style[keyframer.animationProp.js] = "retractDiamondReveal "+ animationTime + " forwards " + timingFunction;

				/*******************************************************/

				var topPercent = '' + ((1 - (((topDiamond.pos.y + topDiamond.points[2].y) / (startDiamond.pos.y + startDiamond.points[2].y)).toFixed(2))) * 100) + '%';
				var visibleLayoutProp = getItemLayoutProp($visible);
				var moveDown = {
					'0%': {
						top: '1em',
						left: 0,
						right: 0,
						margin: '0 auto',
						zIndex: 1000
					},
					'100%': {
						top: visibleLayoutProp.top + 5 +  'px',
						left: 0,
						right: 0,
						margin: '0 auto',
						zIndex: 10000
					}
				}
				moveDown[topPercent] = {
					top: '1em',
					left: 0,
					right: 0,
					margin: '0 auto'
				}

				keyframer.register("moveDown", moveDown);

				$title.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
					$body.css('overflow-y', 'hidden');
					$title[0].style['position'] = 'static';
					$title.off('webkitAnimationEnd oanimationend msAnimationEnd animationend');
				})

				$title[0].style[keyframer.animationProp.js] = "moveDown " + animationTime + " " + timingFunction + " forwards";

				/*******************************************************/

				var enterFromAbove = {
					'0%': {
						opacity: '0',
						transform: `translateY(${startDiamond.pos.y}px)`
					},
					'100%': {
						opacity: 1,
						transform: 'translateY(0)'
					}
				};

				keyframer.register("enterFromAbove", enterFromAbove);

				var enterFromBelow = {
					'0%': {
						opacity: 0,
						transform: `translateY(${startDiamond.pos.y + startDiamond.points[2].y}px)`
					},
					'100%': {
						opacity: 1,
						transform: 'translateY(0)'
					}
				};

				keyframer.register("enterFromBelow", enterFromBelow);

				for (var i = 0; i < $items.length; i++) {
					var item = $items[i]
					if (i == thisIdx) {
						continue;
					} else if (i < thisIdx) {
						item.style[keyframer.animationProp.js] = "enterFromAbove " + animationTime + " forwards " + timingFunction;
					} else {
						item.style[keyframer.animationProp.js] = "enterFromBelow " + animationTime + " forwards " + timingFunction;
					}
				}

				$overlay.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
					$item.data('isExpanded', false);
					$items.each(function() {
						this.style[keyframer.animationProp.js] = "";
					})
					$overlay[0].style[keyframer.animationProp.js] = "";
					$body.off('DOMMouseScroll mousewheel');

					$overlay.off('webkitAnimationEnd oanimationend msAnimationEnd animationend');
				});


			});
		});

		$( window ).on( 'debouncedresize', function() {
			winsize = getWindowSize();
			// todo : cache the current item
			if( current !== -1 ) {
				$items.eq( current ).children( 'div.overlay' ).css( 'clip', 'rect(0px ' + winsize.width + 'px ' + winsize.height + 'px 0px)' );
			}
		} );

	}

	function getItemLayoutProp( $item ) {

		var scrollT = $window.scrollTop(),
		scrollL = $window.scrollLeft(),
		itemOffset = $item.offset();

		console.log({
			left : itemOffset.left - scrollL,
			top : itemOffset.top - scrollT,
			width : $item.outerWidth(),
			height : $item.outerHeight()
		})

		return {
			left : itemOffset.left - scrollL,
			top : itemOffset.top - scrollT,
			width : $item.outerWidth(),
			height : $item.outerHeight()
		};

	}

	function createDiamondClipPath(diamond) {
		var top = diamond.pos;
		var right = vectorAdd(diamond.pos, diamond.points[1]);
		var bottom = vectorAdd(diamond.pos, diamond.points[2]);
		var left = vectorAdd(diamond.pos, diamond.points[3]);

		return `polygon(${top.x}px ${top.y}px, ${right.x}px ${right.y}px, ${bottom.x}px ${bottom.y}px, ${left.x}px ${left.y}px)`
	}

	function getCenterScreenDiamonds() {
		var increment = 20;
		var windowPoly = new SAT.Box(new SAT.Vector(0, 0), getWindowSize().width, getWindowSize().height).toPolygon();

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
		$body.css( 'overflow-y', 'hidden' );
		var w = $window.width(), h =  $window.height();
		if( current === -1 ) {
			$body.css( 'overflow-y', 'auto' );
		}
		return { width : w, height : h };
	}

	return { init : init };

})();
