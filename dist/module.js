/*!
 * v-drag v3.0.9
 * by Nil Vila and contributors
 */
// Get the closest value posible when snaping on a grid
function closestValueToSnap (value, axis) {
  const snapValue = axis === 'x' ? window.data.snapX : window.data.snapY;
  return Math.round(value / snapValue) * snapValue;
}

// Shorthand for muliple events with the same function
function eventListener (types, func, state = 'add') {
  types.forEach((type) => {
    document[`${state}EventListener`](type, func, false);
  });
}

// Return a matrix with transform and translate values
function returnPositionString (matrix, a, b) {
  return `matrix(${matrix || '1, 0, 0, 1,'} ${a}, ${b})`;
}

// Creates an event handler that can be used in Vue code
function vueDragEvent (el, action) {
  el.dispatchEvent(new Event(`v-drag-${action}`));
}

function updatePosition(x, y) {

  if (window.data.move.className.indexOf(window.data.animationCSS) == -1 && window.data.animationCSS !== '') {
    window.data.move.className += ` ${window.data.animationCSS}`;
  }

  // Store relative coordinates
  window.data.relativeX = window.data.mouseX * x;
  window.data.relativeY = window.data.mouseY * y;

  // Apply transformation to move element
  window.data.move.style.transform = returnPositionString(
    window.data.matrix,
    window.data.matrixX + closestValueToSnap(window.data.relativeX, 'x'),
    window.data.matrixY + closestValueToSnap(window.data.relativeY, 'y'),
  );

  // Vue event on drag moving
  vueDragEvent(window.data.move, 'moving');

  // Remove text selection while dragging
  (window.getSelection ? window.getSelection() : document.selection).empty();
}

const callPositionUpdate = {
  x() { updatePosition(true, false); },
  y() { updatePosition(false, true); },
  all() { updatePosition(true, true); },
};

function repeatRaf() {
  callPositionUpdate[window.data.axis](window.data);
  window.data.posAnimation = requestAnimationFrame(repeatRaf);
}

function setUpMovement() {
  // Apply CSS class to move element
  window.data.move.classList.add(window.data.class.move);

  // Begin moving animation
  window.data.posAnimation = requestAnimationFrame(repeatRaf);

  // Avoid this function to fire another time
  eventListener(['mousemove', 'touchmove'], setUpMovement, 'remove');
}

// Return element's left or top position
function getTransformValue (str, dir) {
  // Get top or left position, without translate
  let pos = Number(window.getComputedStyle(window.data.move)[dir].replace('px', ''));

  // Only consider translation when matrix is defined
  if (str !== 'none') {
    // Get all matrix's values
    const itemsArray = str.match(/[0-9.-]+/g);

    // Get matrix translate value, based on the x + y = 8 equation
    pos += Number(itemsArray[8 - dir.length]);
  }

  return pos;
}

function moveElementTransform (transform, left, top) {
  window.data.move.style.transform = transform;
  window.data.move.style.left = left;
  window.data.move.style.top = top;
}

function updateMousePosition (e) {
  e.preventDefault();

  // Update value of the mouse position
  window.data.mouseX = (e.pageX || e.touches[0].pageX) - window.data.initialX;
  window.data.mouseY = (e.pageY || e.touches[0].pageY) - window.data.initialY;

  // Scroll page if dragging over the edges,
  // but only if mouse is static for some time
  window.setTimeout(() => {
    if ((e.clientY || e.touches[0].clientY) > window.innerHeight * 0.8) {
      document.documentElement.scrollTop += 10;
    }

    if ((e.clientY || e.touches[0].clientY) < window.innerHeight * 0.2) {
      document.documentElement.scrollTop -= 10;
    }

    if ((e.clientX || e.touches[0].clientX) > window.innerWidth * 0.8) {
      document.documentElement.scrollLeft += 10;
    }

    if ((e.clientX || e.touches[0].clientX) < window.innerWidth * 0.2) {
      document.documentElement.scrollLeft -= 10;
    }
  }, 100);
}

function dragStart (grabElement, moveElement, axis, snap, animationCSS, e) {
  e.preventDefault();

  // Store elements
  window.data.grab = grabElement;
  window.data.move = moveElement;

  // Store axis
  window.data.axis = axis;

  // Store current mouse or touch position
  window.data.initialX = e.pageX || e.touches[0].pageX;
  window.data.initialY = e.pageY || e.touches[0].pageY;

  // Reset relative coordinates
  window.data.relativeX = 0;
  window.data.relativeY = 0;

  // Store snapping values
  window.data.snapX = snap.x;
  window.data.snapY = snap.y;

  window.data.animationCSS = animationCSS;

  if (window.data.animationCSS !== '') {
    window.data.move.className += ` ${window.data.animationCSS}`;
  }

  // Get transform string of the move element
  const matrix = window.getComputedStyle(window.data.move).transform;

  // Store matrix value
  if (matrix === 'none') {
    window.data.matrix = false;
  } else {
    window.data.matrix = matrix.match(/\d([^,]*,){4}/g);
  }

  // Apply transform to the move element
  const left = getTransformValue(matrix, 'left');
  const top = getTransformValue(matrix, 'top');

  // Replace left and top properties with transform
  moveElementTransform(
    returnPositionString(window.data.matrix, left, top),
    0,
    0,
  );

  window.data.matrixX = left;
  window.data.matrixY = top;

  // Apply CSS class to grab element
  window.data.grab.classList.add(window.data.class.down);

  // Vue event on drag down
  vueDragEvent(moveElement, 'down');
  vueDragEvent(moveElement, 'start');

  // Add events to move drag
  eventListener(['mousemove', 'touchmove'], updateMousePosition);
  eventListener(['mousemove', 'touchmove'], setUpMovement);
}

function dragEnd () {
  // Prevent TypeError from showing
  if (!(window.data.grab && window.data.move)) return;

  // Stop move animation
  cancelAnimationFrame(window.data.posAnimation);

  // Remove setUpMovement() if mouse/touch hasn't moved
  eventListener(['mousemove', 'touchmove'], setUpMovement, 'remove');

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

    const elWidth = parseFloat(window.data.move.offsetWidth);
    const elHeight = parseFloat(window.data.move.offsetHeight);

    const posX = +window.data.move.offsetLeft;
    const posY = +window.data.move.offsetTop;

    if (posX < 0 || posX > document.body.clientWidth) {
      window.data.move.style.left = '0px';
    } else if (posY < 0 || posY > document.body.clientHeight) {
      window.data.move.style.top = '0px';
    } else {
      if (posY > (height - elHeight) && (height - elHeight) + posY < document.body.clientHeight) {
        window.data.move.style.top = `${(height - elHeight)}px`;
      }

      if (posX > (width - elWidth) && (width - elWidth) + posX < document.body.clientWidth) {
        window.data.move.style.left = `${width - elWidth}px`;
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

// Return object even if it's a string (with or without units),
// set 'force' to true to never return an undefined value
function toNumber(input, force) {
  const value = typeof input === 'string' ? parseInt(input.replace(/px/g, ''), 10) : input;
  return (value === 0 || Number.isNaN(value) || (force && value === undefined)) ? 1 : value;
}

// Return many options to an object with x and y values
function getSnappingValues (value) {
  // If value is given as a string, eg. '20px'
  if (typeof value === 'string') {
    const valueArray = value.split(',');

    return {
      x: toNumber(valueArray[0]),
      y: toNumber(valueArray[1]) !== undefined ? toNumber(valueArray[1]) : toNumber(valueArray[0]),
    };
  }

  // If value is given as a number, eg. 20
  if (typeof value === 'number') {
    return {
      x: toNumber(value),
      y: toNumber(value),
    };
  }

  // If value is given as an object, eg. {x: 20, y: 10}
  if (value instanceof Object && (value.x || value.y)) {
    return {
      x: toNumber(value.x) || 1,
      y: toNumber(value.y) || 1,
    };
  }

  // If value is given as an array, eg. [20, 10]
  if (Array.isArray(value)) {
    return {
      x: toNumber(value[0]) || 1,
      y: toNumber(value[1]) !== undefined ? toNumber(value[1], true) : toNumber(value[0], true),
    };
  }

  return {
    x: 1,
    y: 1,
  };
}

// Checks if the given value is a valid axis value ('x', 'y' or 'all')
function isValidAxisValue (axis) {
  const acceptedValues = ['x', 'y', 'all'];

  if (acceptedValues.includes(axis)) {
    return true;
  }
  return false;
}

function dragSetup (el, binding) {
  const value = binding.value || {};
  const handleSelector = value instanceof Object ? value.handle : value;
  const snap = getSnappingValues(value.snap);
  const canDrag = typeof value.canDrag === 'boolean' ? value.canDrag : true;
  const animationCSS = typeof value.animationCSS === 'string' ? value.animationCSS : '';

  if (!canDrag) {
    el.classList.add(window.data.class.initial, window.data.class.dragHandleDisable);
    return;
  }

  if (el.classList.contains(window.data.class.dragHandleDisable)) {
    el.classList.remove(window.data.class.dragHandleDisable);
  }


  const handleArray = [];
  let axis;

  // Update axis value
  if (value instanceof Object && value.axis && isValidAxisValue(value.axis)) {
    axis = value.axis;
  } else if (isValidAxisValue(binding.arg)) {
    axis = binding.arg;
  } else {
    axis = 'all';
  }

  // Store all the DOM elements that will be used as handles.
  // They can be declared using a string with a CSS tag, class or id, or using Vue refs.
  if (handleSelector instanceof HTMLElement) {
    handleArray.push(handleSelector);
  } else {
    // handleArray.push(document.querySelectorAll(handleSelector));
    document.querySelectorAll(handleSelector).forEach((child) => {
      handleArray.push(child);
    });
  }

  if (handleArray.length !== 0) {
    // Define move element and apply CSS class
    el.classList.add(window.data.class.usesHandle);

    handleArray.forEach((grabElement) => {
      // Apply CSS class to each grab element
      grabElement.classList.add(window.data.class.handle);

      // Add events to start drag with handle
      grabElement.onmousedown = (e) => dragStart(grabElement, el, axis, snap, animationCSS, e);
      grabElement.ontouchstart = (e) => dragStart(grabElement, el, axis, snap, animationCSS, e);
    });
  } else {
    // Add events to start drag without handle
    el.onmousedown = (e) => dragStart(el, el, axis, snap, animationCSS, e);
    el.ontouchstart = (e) => dragStart(el, el, axis, snap, animationCSS, e);
  }

  // Apply CSS classes to the element
  el.classList.add(window.data.class.initial);

  // Vue event on setup
  vueDragEvent(el, 'setup');

  // Add event to end drag
  eventListener(['mouseup', 'touchend'], dragEnd);
}

// Add draggable configuration to element for the first time
const mountedHook = (el, binding) => {
  dragSetup(el, binding);

  mountProperties(el, binding);
};

const mountProperties = (el, binding) => {
  const value = binding.value || {};

  const position = value.position ?? null;
  const size = value.size ?? null;

  if (position instanceof Object) {
    el.style.top = typeof position.y === 'number' ? `${position.y}px` : position.y;
    el.style.left = typeof position.x === 'number' ? `${position.x}px` : position.x;
  }

  if (size instanceof Object) {
    el.style.width = typeof size.w === 'number' ? `${size.w}px` : size.w;
    el.style.height = typeof size.h === 'number' ? `${size.h}px` : size.h;
  }
};

// Update the drag configuration
const updatedHook = (el, binding) => {
  // Remove events from updated element
  el.onmousedown = null;
  el.ontouchstart = null;

  const handle = typeof binding.oldValue === 'object'
    ? binding.oldValue.handle
    : binding.oldValue;

  const oldHandleArray = document.querySelectorAll(handle);

  oldHandleArray.forEach((oldHandle) => {
    // Remove events from the old handle
    oldHandle.onmousedown = null;
    oldHandle.ontouchstart = null;

    // Remove CSS classes related to the old handle
    oldHandle.classList.remove(window.data.class.handle);
    el.classList.remove(window.data.class.usesHandle);
  });

  // Vue event if anything is updated
  if (binding.oldValue) {
    Object.keys(binding.oldValue).forEach((key) => {
      vueDragEvent(el, `update-${key}`);
    });
  }

  // Add draggable configuration to element
  dragSetup(el, binding);
};

// Create custom directive
var index = {
  install(Vue, options) {
    // Initialize 'data' object
    window.data = {};

    // Store default event classes
    window.data.class = {
      initial: 'drag-draggable',
      usesHandle: 'drag-uses-handle',
      handle: 'drag-handle',
      down: 'drag-down',
      move: 'drag-move',
      dragHandleDisable: 'drag-handle-disable'
    };

    let removeTransition = true;

    // Replace default event classes with custom ones
    if (options) {
      if (options.eventClass) {
        const classes = options.eventClass;

        Object.keys(classes).forEach((key) => {
          if (classes[key]) {
            window.data.class[key] = classes[key];
          }
        });
      }

      if (typeof options.removeTransition === 'boolean') {
        removeTransition = options.removeTransition;
      }
    }

    // Create stylesheet with basic styling (position, z-index and cursors)
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `.${window.data.class.initial}{position:relative;}.${window.data.class.initial}:not(.${window.data.class.usesHandle}),.${window.data.class.handle}{cursor:move;cursor:grab;cursor:-webkit-grab;}.${window.data.class.handle}.${window.data.class.down},.${window.data.class.initial}:not(.${window.data.class.usesHandle}).${window.data.class.down}{z-index:999;cursor:grabbing;cursor:-webkit-grabbing;}`;
    styleElement.innerHTML += removeTransition === true ? `.${window.data.class.move}{transition:none;}` : '';
    document.body.appendChild(styleElement);

    // Register 'v-drag' directive
    Vue.directive('drag', {
      // Hooks for Vue3
      mounted(el, binding) {
        mountedHook(el, binding);
      },

      updated(el, binding) {
        updatedHook(el, binding);
      },

      // Hooks for Vue2
      inserted(el, binding) {
        mountedHook(el, binding);
      },

      update(el, binding) {
        updatedHook(el, binding);
      },
    });
  },
};

export { index as default };
