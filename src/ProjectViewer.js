Object.prototype.document = window.document;
Object.prototype.location = window.location;
window.zepto = window.$ = require('zepto').$;
delete(Object.prototype.document);
delete(Object.prototype.location);
import SAT from 'sat';
import CSSKeyframer from 'css-keyframer';
import prefixAll from 'inline-style-prefixer/static';
import Slider from './slider.js';
import DiamondMaskTransition from './DiamondMaskTransition.js';
import { applyCSSAnimation } from './CSSAnimationChainer.js';


export default class ProjectViewer {

  constructor() {
    this.$projects = $('.projects > .project'),
  	// window and body elements
  	this.$window = $(window);
  	this.$body = $('body');
  	// transitions support
  	// current item's index
  	this.current = -1;
    // register animations with this this.keyframer
  	this.keyframer = new CSSKeyframer({ /* options */ });
    // Create the DiamondExpansionAnimation
    this.dmt = new DiamondMaskTransition(this.keyframer);

    this.initEvents();
  }

  initEvents() {

		this.$projects.each((idx, project) => {

		  let $project = $(project),
			$close = $project.find('span.close'),
			$overlay = $project.children('div.overlay'),
			$title = $project.find('.visible-item span'),
			$visible = $project.find('.visible-item'),
			$slides = $project.find('.slides');

			let slider;

			$project.on('click', () => {
				if( $project.data('isExpanded')) {
					return false;
				}

				$project.data('isExpanded', true);

				// save current item's index
				this.current = idx;

				// Placement of item on the screen
				let layoutProp = $project[0].getBoundingClientRect();

        $overlay[0].style['pointer-events'] = 'auto';
        this.dmt.createAndRegisterExpandFromPointAnimation(window.innerWidth/2, layoutProp.bottom, true, {fillMode: 'forwards'});

        let animationTime = '2000ms';
        let timingFunction = 'ease';

        applyCSSAnimation($overlay[0],
          this.dmt.animations.expandFromPoint,
          '2000ms',
          {fillMode: 'forwards'})
        .then(() => {
          slider = new Slider($slides);
        });

				let titleLayoutProp = $title[0].getBoundingClientRect();
				$title[0].style['left'] = 0;
				$title[0].style['right'] = 0;
				$title[0].style['margin'] = '0 auto';
				$title[0].style['position'] = 'fixed';
				$title[0].style['pointer-events'] = 'none';
				let moveUp = {
					'0%': prefixAll({
						position: 'fixed',
						top: titleLayoutProp.top + 'px',
						left: 0,
						right: 0,
						margin: '0 auto',
						zIndex: 1000
					}),
					'99%': prefixAll({
						position: 'fixed',
						left: 0,
						right: 0,
						margin: '0 auto',
					}),
					'100%': prefixAll({
						position: 'fixed',
						top: '1em',
						left: 0,
						right: 0,
						margin: '0 auto',
						zIndex: 10000
					})
				}
				moveUp[this.dmt.getExpandVerticalFillPercent()] = prefixAll({
					left: 0,
					right: 0,
					margin: '0 auto',
					top: '1em'
				});
				this.keyframer.register("moveUp", moveUp);

				$title[0].style[this.keyframer.animationProp.js] = "moveUp " + animationTime + " forwards " + timingFunction;

				/*******************************************************/
        let prevLp = (this.$projects[idx-1] || $project[0]).getBoundingClientRect();
        let nextLp = (this.$projects[idx+1] || $project[0]).getBoundingClientRect();

				let exitUp = {
					'0%': prefixAll({
						opacity: '1',
						transform: 'translateY(0)'
					}),
					'100%': prefixAll({
						opacity: '0',
						transform: `translateY(${this.dmt.end.pos.y}px)`
					})
				};

				exitUp[this.dmt.getExpandVerticalFillPercent()] = prefixAll({
					transform: `translateY(${prevLp.top + prevLp.height})`,
					opacity: '0.4'
				});

				this.keyframer.register("exitUp", exitUp);

				/*******************************************************/

				let exitDown = {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: `translateY(${this.dmt.end.pos.y + this.dmt.end.points[2].y}px)`
					}
				};
				exitDown[this.dmt.getExpandVerticalFillPercent()] = {
					transform: `translateY(${this.dmt.verticalFill.pos.y + this.dmt.verticalFill.points[2].y}px)`,
					opacity: '0'
				};

				this.keyframer.register("exitDown", exitDown);

				/*******************************************************/

				for (var i = 0; i < this.$projects.length; i++) {
					var item = this.$projects[i]
					if (i == idx) {
						continue;
					} else if (i < idx) {
						item.style[this.keyframer.animationProp.js] = "exitUp " + animationTime + " forwards " + timingFunction;
					} else {
						item.style[this.keyframer.animationProp.js] = "exitDown " + animationTime + " forwards " + timingFunction;
					}
				}

			});
    })
  }
}
