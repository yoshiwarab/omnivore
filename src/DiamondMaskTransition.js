import SAT from 'sat';
import SATUtils from './SATUtils.js';
import prefixAll from 'inline-style-prefixer/static';

export default class DiamondMaskTransition {
  // TODO: Add window resize listener to regenerate diamonds
  // TODO: Get animation name functions
  // TODO: Add event prefixer
  // TODO: Make this take any start polygon

  constructor(keyframer) {
    this.start;
    this.verticalFill = null;
    this.horizontalFill = null;
    this.end = null;
    this.increment = 20;
    this.keyframer = keyframer;
    this.animations = {
      expandFromCenter: 'expandDiamondFromCenter',
      expandFromPoint: 'expandDiamondFromPoint',
      collapseToCenter: 'collapseDiamondToCenter',
      collapseToPoint: 'collapseDiamondToPoint'
    };
    this.generateDiamonds();
    this.createAndRegisterDefaultAnimations();
  }

  addListeners() {
    document.onresize = (event) => {
      this.generateDiamonds();
      this.createAndRegisterDefaultAnimations();
    }
  }

  generateDiamonds() {
		let windowPoly = new SAT.Box(new SAT.Vector(), window.innerWidth, window.innerHeight).toPolygon();

		let top = new SAT.Vector(window.innerWidth/2, window.innerHeight/2+1),
		right = new SAT.Vector(1, 1),
		bottom = new SAT.Vector(0, 2),
		left = new SAT.Vector(-1, 1);

		let start = new SAT.Polygon(top, [new SAT.Vector(), right, bottom, left]);
    let verticalFill;
    let horizontalFill;
    let end = SATUtils.copyPolygon(start);

		// [(0, 0), (1, 1), (0, 2), (-1, 1)]
		while(true) {
			end = new SAT.Polygon(end.pos.add(new SAT.Vector(0, -this.increment)), [
				new SAT.Vector(),
				end.points[1].add(new SAT.Vector(this.increment, this.increment)),
				end.points[2].add(new SAT.Vector(0, this.increment*2)),
				end.points[3].add(new SAT.Vector(-this.increment, this.increment))
			]);

			if (!verticalFill && (end.pos.y <= 0))
				verticalFill = SATUtils.copyPolygon(end);

      if (!horizontalFill && ((end.pos.x + end.points[1].x) > window.innerWidth))
        horizontalFill = SATUtils.copyPolygon(end);

			let response = new SAT.Response();
			SAT.testPolygonPolygon(end, windowPoly, response);

      if (response.bInA) {
        this.centerStart = start;
        this.verticalFill = verticalFill;
        this.horizontalFill = horizontalFill;
        this.end = end;
        return;
      }
		}
  }

  createAndRegisterDefaultAnimations() {
    this.createAndRegisterExpandFromCenterAnimation();
    this.createAndRegisterCollapseToCenterAnimation();
  }

  createDiamondAtPoint(x, y) {
    return new SAT.Polygon(new SAT.Vector(x, y), [
      new SAT.Vector(),
      new SAT.Vector(1, 1),
      new SAT.Vector(0, 2),
      new SAT.Vector(-1, 1)
    ]);
  }

  createAndRegisterExpandFromPointAnimation(x, y, centerFirst) {
    let verticalFillPercent = '' + (((this.verticalFill.pos.y + this.verticalFill.points[2].y) / (this.end.pos.y + this.end.points[2].y)).toFixed(2) * 100) + '%';
    let start = this.createDiamondAtPoint(x, y);

    let expandDiamondFromPoint = {
      '0%' : prefixAll({
         opacity: 1,
         clipPath: DiamondMaskTransition.generateClipPathString(start),
         zIndex: 999
      }),
      '99%': prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.end)
      }),
      '100%': prefixAll({
        opacity: 1,
        zIndex: 999,
        width: '100%',
        height: '100%'
      })
    };

    if (centerFirst) {
      expandDiamondFromPoint[verticalFillPercent] = prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.verticalFill)
      })
    }

    this.keyframer.register('expandDiamondFromPoint', expandDiamondFromPoint);
  }

  createAndRegisterExpandFromCenterAnimation() {
    let expandDiamondFromCenter = {
      '0%' : prefixAll({
         opacity: 1,
         clipPath: DiamondMaskTransition.generateClipPathString(this.centerStart),
         zIndex: 999
      }),
      '99%': prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.end)
      }),
      '100%': prefixAll({
        opacity: 1,
        zIndex: 999,
        width: '100%',
        height: '100%'
      })
    }

    this.keyframer.register('expandDiamondFromCenter', expandDiamondFromCenter);
  }

  createAndRegisterCollapseToPointAnimation(x, y, centerFirst) {
    let verticalFillPercent = '' + ((1 - (((this.verticalFill.pos.y + this.verticalFill.points[2].y) / (this.end.pos.y + this.end.points[2].y)).toFixed(2))) * 100) + '%';
    let collapsed = createDiamondAtPoint(x, y);

    let collapseDiamondToPoint = {
      '0%' : prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.end),
        opacity: 1,
        zIndex: 1
      }),
      '100%': prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(collapsed),
        zIndex: 0,
        opacity: 1
      })
    };

    if (centerFirst) {
      collapseDiamondToPoint[verticalFillPercent] = prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.verticalFill)
      });
    }

    this.keyframer.register('collapseDiamondToPoint', collapseDiamondToPoint);
  }

  createAndRegisterCollapseToCenterAnimation(x, y) {
    let collapseDiamondToCenter = {
      '0%' : prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.end),
        opacity: 1,
        zIndex: 1
      }),
      '100%': prefixAll({
        clipPath: DiamondMaskTransition.generateClipPathString(this.centerStart),
        zIndex: 0,
        opacity: 1
      })
    };

    this.keyframer.register('collapseDiamondToCenter', collapseDiamondToCenter);
  }

  getExpandVerticalFillPercent() {
    return '' + (((this.verticalFill.pos.y + this.verticalFill.points[2].y) / (this.end.pos.y + this.end.points[2].y)).toFixed(2) * 100) + '%';
  }

  getCollapseVerticalFillPercent() {
    return verticalFillPercent = '' + ((1 - (((this.verticalFill.pos.y + this.verticalFill.points[2].y) / (this.end.pos.y + this.end.points[2].y)).toFixed(2))) * 100) + '%';
  }

  static generateClipPathString(diamond) {
    let top = diamond.pos,
    right = SATUtils.functionalAdd(diamond.pos, diamond.points[1]),
    bottom = SATUtils.functionalAdd(diamond.pos, diamond.points[2]),
    left = SATUtils.functionalAdd(diamond.pos, diamond.points[3]);

    return `polygon(${top.x}px ${top.y}px, ${right.x}px ${right.y}px, ${bottom.x}px ${bottom.y}px, ${left.x}px ${left.y}px)`
  }

}
