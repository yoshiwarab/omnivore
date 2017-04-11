// var $ = require('jquery');
window.jQuery = window.$ = require('jquery');
var velocity = require('velocity-animate');
var SAT = require('sat');
var CSSKeyframer = require('css-keyframer');

module.exports = (function() {

	var $items = $( '.projects > .project' ),
	transEndEventNames = {
		'WebkitTransition' : 'webkitTransitionEnd',
		'MozTransition' : 'transitionend',
		'OTransition' : 'oTransitionEnd',
		'msTransition' : 'MSTransitionEnd',
		'transition' : 'transitionend'
	},
	// transition end event name
	transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
	// window and body elements
	$window = $( window ),
	$body = $( 'BODY' ),
	// transitions support
	supportTransitions = Modernizr.csstransitions,
	// current item's index
	current = -1,
	// window width and height
	winsize = getWindowSize();

	function init( options ) {
		initEvents();
	}

	function initEvents() {

		$items.each( function() {

			var $item = $( this ),
			$close = $item.find( 'span.close' ),
			$overlayWindow = $item.find('div.overlay-window'),
			$overlay = $item.children( 'div.overlay' );

			$item.on( 'click', function() {

				if( $item.data( 'isExpanded' ) ) {
					return false;
				}
				$item.data( 'isExpanded', true );
				// save current item's index
				current = $item.index();

				var center = winsize.width / 2;
				var layoutProp = getItemLayoutProp( $item );

				var top = new SAT.Vector(center, layoutProp.top+layoutProp.height),
				right = new SAT.Vector(1, 1),
				bottom = new SAT.Vector(0, 2),
				left = new SAT.Vector(-1, 1);

				// console.log(top);
				// console.log(right);

				var startDiamond = new SAT.Polygon(top, [new SAT.Vector(), right, bottom, left]);
				var endDiamond = getEndDiamond(startDiamond);

				var start = createDiamondClipPath(startDiamond);
				var end = createDiamondClipPath(endDiamond);

				var thisIdx = $items.index($item);
				var prevLp = getItemLayoutProp($($items[thisIdx-1] || $item));
				var nextLp = getItemLayoutProp($($items[thisIdx+1] || $item));

				var keyframer = new CSSKeyframer({ /* options */ });

				// CSS property will be added vendor-prefix is automatically!
				keyframer.register("delayedEase", [

				]);

				for (var i = 0; i < $items.length; i++) {
					var item = $($items[i]);
					if (i == thisIdx) {
						continue;
					} else if (i < thisIdx) {
						item.css({
							transition: 'transform 1s linear',
							transform: `translateY(${-prevLp.top}px)`
						})
					} else {
						item.css({
							transition: 'transform 1s linear',
							transform: `translateY(${winsize.height - nextLp.top}px)`
						})
					}
				}

				$overlay.css({
					transition: 'clip-path 5.0s linear',
					clipPath: start,
					zIndex: 9999,
					opacity: 1,
					pointerEvents: 'auto'
				})

				setTimeout( function () {
					$overlay.css({
						clipPath: end
					})
				}, 25)


				// $overlay.css( {
				// 	transition: 'all 5s ease',
				// 	clip : supportTransitions ? clipPropSecond : clipPropLast,
				// 	opacity : 1,
				// 	zIndex: 9999,
				// 	pointerEvents : 'auto'
				// } );

				// $overlay.on( transEndEventName, function() {
				// 	$overlay.off( transEndEventName );
				//
				// 	setTimeout( function() {
				// 		$overlay.css({
				// 			clip : clipPropLast,
				// 			transform: 'rotate(0deg)'
				// 		}).on(transEndEventName, function() {
				// 			$overlay.off( transEndEventName );
				// 			$body.css( 'overflow-y', 'hidden' );
				// 		})
				// 	}, 25 );
				// });

				// $overlay.css( {
				// 	clip : supportTransitions ? clipPropFirst : clipPropLast,
				// 	opacity : 1,
				// 	zIndex: 9999,
				// 	pointerEvents : 'auto'
				// } );

				// if( supportTransitions ) {
				// 	$overlay.on( transEndEventName, function() {
				//
				// 		$overlay.off( transEndEventName );
				//
				// 		setTimeout( function() {
				// 			$overlay.css( {
				// 				clip: clipPropLast,
				// 				transform: 'rotate(0deg)'
				// 			}).on( transEndEventName, function() {
				// 				$overlay.off( transEndEventName );
				// 				$body.css( 'overflow-y', 'hidden' );
				// 			} );
				// 		}, 25 );
				//
				// 	} );
				// }
				// else {
				// 	$body.css( 'overflow-y', 'hidden' );
				// }

			} );

			$close.on( 'click', function() {

				$body.css( 'overflow-y', 'auto' );

				var layoutProp = getItemLayoutProp( $overlayWindow),
				clipPropFirst = 'rect(' + layoutProp.top + 'px ' + ( layoutProp.left + layoutProp.width ) + 'px ' + ( layoutProp.top + layoutProp.height ) + 'px ' + layoutProp.left + 'px)',
				clipPropLast = 'auto';

				// reset current
				current = -1;

				$overlay.css( {
					clip : supportTransitions ? clipPropFirst : clipPropLast,
					opacity : supportTransitions ? 1 : 0,
					pointerEvents : 'none'
				} );

				if( supportTransitions ) {
					$overlay.on( transEndEventName, function() {

						$overlay.off( transEndEventName );
						setTimeout( function() {
							$overlay.css( 'opacity', 0 ).on( transEndEventName, function() {
								$overlay.off( transEndEventName ).css( { clip : clipPropLast, zIndex: -1 } );
								$item.data( 'isExpanded', false );
							} );
						}, 25 );

					} );
				}
				else {
					$overlay.css( 'z-index', -1 );
					$item.data( 'isExpanded', false );
				}

				return false;

			} );

		} );

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

	function getEndDiamond(start) {
		var increment = 20;
		var windowPoly = new SAT.Box(new SAT.Vector(0, 0), getWindowSize().width, getWindowSize().height).toPolygon();
		console.log(windowPoly);
		console.log(start);
		// console.log(new SAT.Vector().copy(start.pos));
		var end = copyPolygon(start);
		var maxIterations = 1;
		var i = 0;

		var verticalFit;
		// [(0, 0), (1, 1), (0, 2), (-1, 1)]
		while(true) {
			// if (i > maxIterations-1) return end;
			end = new SAT.Polygon(end.pos.add(new SAT.Vector(0, -increment)), [
				new SAT.Vector(),
				end.points[1].add(new SAT.Vector(increment, increment)),
				end.points[2].add(new SAT.Vector(0, increment*2)),
				end.points[3].add(new SAT.Vector(-increment, increment))
			]);

			// if (!verticalFit && Math.floor(end.pos.y == 0))

			// console.log(end);
			// i++
			// end = new SAT.Polygon(new SAT.Vector(end.points[0].add(0, increment)), [new SAT.Vector(), end.points[1].add(increment, 0), end.points[2].add(0, -increment), end.points[3].add(-increment, 0)]);
			var response = new SAT.Response();
			// console.log(end);
			SAT.testPolygonPolygon(end, windowPoly, response);
			// console.log(response);
			//
			if (response.bInA) {
				return end;
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
