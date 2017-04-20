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

    this.openAnimationTime = '2000ms';
    this.closeAnimationTime = '2000ms';
    this.timingFunction = 'ease';

    this.isShowing = false;

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

        this.isShowing = true;

        // Don't show scrollbar on expansion
        this.$body.css('overflow-y', 'hidden');

				// save current item's index
				this.current = idx;

				// Placement of item on the screen
				let layoutProp = $project[0].getBoundingClientRect();

        $overlay[0].style['pointer-events'] = 'auto';
        this.dmt.createAndRegisterExpandFromPointAnimation(window.innerWidth/2, layoutProp.bottom, true, {fillMode: 'forwards'});

        applyCSSAnimation($overlay[0],
          this.dmt.animations.expandFromPoint,
          '2000ms',
          {fillMode: 'forwards'})
        .then(() => {
          slider = new Slider($slides[0], this.dmt);
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
            trasform: 'translateY(0)',
						margin: '0 auto',
						zIndex: 1000
					}),
					'100%': prefixAll({
						position: 'fixed',
						transform: `translateY(${-titleLayoutProp.top + 16}px)`,
						left: 0,
						right: 0,
						zIndex: 10000
					})
				}

				moveUp[this.dmt.getExpandVerticalFillPercent()] = prefixAll({
					left: 0,
					right: 0,
					margin: '0 auto',
          transform: `translateY(${-titleLayoutProp.top + 16}px)`
				});
				this.keyframer.register("moveUp", moveUp);

				$title[0].style[this.keyframer.animationProp.js] = "moveUp " + this.openAnimationTime + " forwards " + this.timingFunction;

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

        this.$projects.each((projectIdx, project) => {
          if (projectIdx == idx) {
            return true;
          } else if (projectIdx < idx) {
            project.style[this.keyframer.animationProp.js] = "exitUp " + this.openAnimationTime + " forwards " + this.timingFunction;
          } else {
            project.style[this.keyframer.animationProp.js] = "exitDown " + this.openAnimationTime + " forwards " + this.timingFunction;
          }
        });
			});

      $close.on('click', () => {

        let layoutProp = $project[0].getBoundingClientRect();

        this.dmt.createAndRegisterCollapseToPointAnimation(window.innerWidth/2, layoutProp.bottom);

        applyCSSAnimation($overlay[0],
          this.dmt.animations.collapseToPoint,
          '2000ms',
          {fillMode: 'forwards'})
        .then(() => {
          slider.destroy()
          slider = null;

          $project.data('isExpanded', false);

          $overlay[0].style[this.keyframer.animationProp.js] = '';
        });

				/*******************************************************/

				let visibleLayoutProp = $visible[0].getBoundingClientRect();

				let moveDown = prefixAll({
					'0%': {
						left: 0,
						right: 0,
            transform: `translateY(${-visibleLayoutProp.top + 11}px)`,
						margin: '0 auto',
						zIndex: 1000
					},
					'100%': {
            zIndex: 1000,
						left: 0,
						right: 0,
						margin: '0 auto',
            transform: 'translateY(0px)',
					}
				});

				moveDown[this.dmt.getCollapseVerticalFillPercent()] = prefixAll({
					left: 0,
					right: 0,
          transform: `translateY(${-visibleLayoutProp.top + 11}px)`,
					margin: '0 auto'
				});

				this.keyframer.register("moveDown", moveDown);

        applyCSSAnimation($title[0],
          'moveDown',
          '2000ms',
          {fillMode: 'forwards'})
        .then(() => {
          $title.css({
            position: 'static',
            zIndex: 'auto'
          });
        });

				/*******************************************************/

			 let enterFromAbove = prefixAll({
					'0%': {
						opacity: 0,
						transform: `translateY(${this.dmt.end.pos.y}px)`
					},
					'100%': {
						opacity: 1,
						transform: 'translateY(0)'
					}
				});

				this.keyframer.register('enterFromAbove', enterFromAbove);

				var enterFromBelow = prefixAll({
					'0%': {
						opacity: 0,
						transform: `translateY(${this.dmt.end.pos.y + this.dmt.end.points[2].y}px)`
					},
					'100%': {
						opacity: 1,
						transform: 'translateY(0)'
					}
				});

				this.keyframer.register("enterFromBelow", enterFromBelow);

        this.$projects.each((projectIdx, project) => {
          if (projectIdx == idx) {
            return true;
          } else if (projectIdx < idx) {
            applyCSSAnimation(project,
              'enterFromAbove',
              this.closeAnimationTime,
              {fillMode: 'forwards'})
            .then(() => {
              project.style[this.keyframer.animationProp.js] = '';
            });
          } else {
            applyCSSAnimation(project,
              'enterFromBelow',
              this.closeAnimationTime,
              {fillMode: 'forwards'})
            .then(() => {
              project.style[this.keyframer.animationProp.js] = '';
              this.isShowing = false;
            });
          }
        })
      });
		});
	}
}
