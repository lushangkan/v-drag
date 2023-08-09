import closestValueToSnap from '../utils/closestValueToSnap';
import eventListener from '../utils/eventListener';
import returnPositionString from '../utils/returnPositionString';
import vueDragEvent from '../utils/vueDragEvent';

export function updatePosition(x, y) {

  if (window.data.move.className.indexOf(window.data.animationCSS) == -1 && window.data.animationCSS !== '') {
    window.data.move.className += ` ${window.data.animationCSS}`;
  }

  // Store relative coordinates
  window.data.relativeX = window.data.mouseX * x;
  window.data.relativeY = window.data.mouseY * y;

  const computedStyle = window.getComputedStyle(window.data.move, null);

  // Get matrix values
  const transform = computedStyle.getPropertyValue('transform');

  const newX = window.data.matrixX + closestValueToSnap(window.data.relativeX, 'x');
  const newY = window.data.matrixY + closestValueToSnap(window.data.relativeY, 'y');
  
  // Get matrix values
  const oldX = transform.match(/matrix\((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/)?.[5];
  const oldY = transform.match(/matrix\((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/)?.[6];
  
  if (oldX !== undefined && oldY !== undefined) {
    if (newX !== oldX || newY !== oldY) {
      // Vue event on drag snapping
      vueDragEvent(window.data.move, 'snapping');
    }
  }

  // Apply transformation to move element
  window.data.move.style.transform = returnPositionString(
    window.data.matrix,
    newX,
    newY,
  );

  // Vue event on drag moving
  vueDragEvent(window.data.move, 'moving');

  // Remove text selection while dragging
  (window.getSelection ? window.getSelection() : document.selection).empty();
}

export const callPositionUpdate = {
  x() { updatePosition(true, false); },
  y() { updatePosition(false, true); },
  all() { updatePosition(true, true); },
};

export function repeatRaf() {
  callPositionUpdate[window.data.axis](window.data);
  window.data.posAnimation = requestAnimationFrame(repeatRaf);
}

export default function setUpMovement() {
  // Apply CSS class to move element
  window.data.move.classList.add(window.data.class.move);

  // Begin moving animation
  window.data.posAnimation = requestAnimationFrame(repeatRaf);

  // Avoid this function to fire another time
  eventListener(['mousemove', 'touchmove'], setUpMovement, 'remove');
}
