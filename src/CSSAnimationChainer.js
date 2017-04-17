import prefixedEvent from 'prefixed-event';
import prefixAll from 'inline-style-prefixer/static'

function applyCSSAnimation(element, animation, time, opts) {
  // duration | timing-function | delay | iteration-count | direction | fill-mode | play-state | name
  let animationString = `${animation} ${time} ${opts.delay || ''} ${opts.timingFunction || ''} ${opts.iterationCount || ''} ${opts.direction || ''} ${opts.fillMode || ''} ${opts.playState || ''}`;
  let promise = new Promise((resolve, reject) => {
    prefixedEvent.add(element, 'AnimationEnd', () => {
      prefixedEvent.remove(element, 'AnimationEnd');
      resolve(element);
    });
    Object.assign(element.style, prefixAll({animation: animationString}));
  });

  return promise;
}

module.exports = { applyCSSAnimation };
