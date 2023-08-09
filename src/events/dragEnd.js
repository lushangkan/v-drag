import dragMove from './dragMove';

import eventListener from '../utils/eventListener';
import moveElementTransform from '../utils/moveElementTransform';
import returnPositionString from '../utils/returnPositionString';
import updateMousePosition from '../utils/updateMousePosition';
import vueDragEvent from '../utils/vueDragEvent';
import closestValueToSnap from '../utils/closestValueToSnap';

export default function () {
  // Prevent TypeError from showing
  if (!(window.data.grab && window.data.move)) return;

  // Stop move animation
  cancelAnimationFrame(window.data.posAnimation);

  // Remove setUpMovement() if mouse/touch hasn't moved
  eventListener(['mousemove', 'touchmove'], dragMove, 'remove');

  // Remove animation class from move element
  window.data.move.className = window.data.move.className.replace(window.data.animationCSS, '').trim();

  // Replace transform properties with left and top
  moveElementTransform(
    window.data.matrix ? returnPositionString(window.data.matrix, 0, 0) : 'none',
    `${window.data.matrixX + closestValueToSnap(window.data.relativeX, 'x')}px`,
    `${window.data.matrixY + closestValueToSnap(window.data.relativeY, 'y')}px`,
  );

  const el = document.getElementsByClassName('draggable-parent');
  if (el.length === 1) {
    const firstEl = el[0];
    const width = firstEl.clientWidth -
      parseFloat(window.getComputedStyle(firstEl, null).getPropertyValue("padding-left")) -
      parseFloat(window.getComputedStyle(firstEl, null).getPropertyValue("padding-right"));
    const height = firstEl.clientHeight -
      parseFloat(window.getComputedStyle(firstEl, null).getPropertyValue("padding-top")) -
      parseFloat(window.getComputedStyle(firstEl, null).getPropertyValue("padding-bottom"));

    const limitEleBottom = firstEl.getBoundingClientRect().bottom;
    const limitEleRight = firstEl.getBoundingClientRect().right;
    const limitEleTop = firstEl.getBoundingClientRect().top;
    const limitEleLeft = firstEl.getBoundingClientRect().left;

    const moveEleBottom = +window.data.move.getBoundingClientRect().bottom;
    const moveEleRight = +window.data.move.getBoundingClientRect().right;
    const moveEleTop = +window.data.move.getBoundingClientRect().top;
    const moveEleLeft = +window.data.move.getBoundingClientRect().left;

    if (moveEleRight > limitEleRight) {
      let left = width - window.data.move.clientWidth;
      window.data.move.style.left = `${left}px`;
    } else if (moveEleBottom > limitEleBottom) {
      let top = height - window.data.move.clientHeight;
      window.data.move.style.top = `${top}px`;
    } else {
      if (limitEleTop > moveEleTop) {
        window.data.move.style.top = '0';
      }
      if (limitEleLeft > moveEleLeft) {
        window.data.move.style.left = '0';
      }
    }
  }

  // Remove CSS classes
  window.data.grab.classList.remove(window.data.class.down);
  window.data.move.classList.remove(window.data.class.move);

  // Vue event on drag end
  vueDragEvent(window.data.move, 'end');

  // Stop updating mouse position
  eventListener(['mousemove', 'touchmove'], updateMousePosition, 'remove');

}
