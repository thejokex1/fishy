const fish = document.getElementById('fish');
const leftEye = document.querySelector('.left-eye .pupil');
const rightEye = document.querySelector('.right-eye .pupil');
const copyContractButton = document.getElementById('copyContract');

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;

let currentX = targetX;
let currentY = targetY;

// Smoothly move fish toward target
function animateFish() {
  currentX += (targetX - currentX) * 0.1; // Interpolation for smooth motion
  currentY += (targetY - currentY) * 0.1;

  const angle = Math.atan2(targetY - currentY, targetX - currentX) * (180 / Math.PI);

  fish.style.left = `${currentX - fish.offsetWidth / 2}px`;
  fish.style.top = `${currentY - fish.offsetHeight / 2}px`;
  fish.style.transform = `rotate(${angle}deg)`;

  // Move eyes
  moveEyes(angle);

  requestAnimationFrame(animateFish);
}

function moveEyes(angle) {
  const eyeOffsetX = Math.cos(angle * (Math.PI / 180)) * 5; // Small offset
  const eyeOffsetY = Math.sin(angle * (Math.PI / 180)) * 5;

  leftEye.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`;
  rightEye.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`;
}

// Update target on mouse move
document.addEventListener('mousemove', (e) => {
  targetX = e.pageX;
  targetY = e.pageY;
});

// Update target on touch (for mobile)
document.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  targetX = touch.pageX;
  targetY = touch.pageY;
});

// Copy contract to clipboard
// Copy contract to clipboard and update button text temporarily
copyContractButton.addEventListener('click', () => {
    navigator.clipboard.writeText('XXXXXXXXXXXX').then(() => {
      const originalText = copyContractButton.textContent;
      copyContractButton.textContent = 'Copied!';
      setTimeout(() => {
        copyContractButton.textContent = originalText;
      }, 2000);
    });
  });
  

// Start animation
animateFish();

const fishbowl = document.querySelector('.fishbowl');

function createBubble() {
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  
  // Randomize position, size, and duration
  bubble.style.setProperty('--x', `${Math.random() * 100}%`); // Random horizontal position
  bubble.style.setProperty('--size', `${20 + Math.random() * 60}px`); // Random size
  bubble.style.setProperty('--duration', `${5 + Math.random() * 10}s`); // Random duration
  
  fishbowl.appendChild(bubble);

  // Remove bubble after its animation completes
  setTimeout(() => bubble.remove(), parseFloat(bubble.style.getPropertyValue('--duration')) * 1000);
}

// Generate bubbles periodically
setInterval(createBubble, 500); // Creates a bubble every 500ms

let lastX = null;
let lastY = null;
let totalDistance = 0;

const counterElement = document.getElementById('counter');

// Function to calculate the distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Mouse movement event
document.addEventListener('mousemove', (event) => {
  if (lastX !== null && lastY !== null) {
    const distance = calculateDistance(lastX, lastY, event.pageX, event.pageY);
    totalDistance += distance;
    counterElement.textContent = `Swam ${Math.round(totalDistance / 5)} Meters`; // Divide by 10 for a more realistic "meter" scale
  }
  lastX = event.pageX;
  lastY = event.pageY;
});

// Touch movement event for mobile
document.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (lastX !== null && lastY !== null) {
    const distance = calculateDistance(lastX, lastY, touch.pageX, touch.pageY);
    totalDistance += distance;
    counterElement.textContent = `Swam ${Math.round(totalDistance / 10)} Meters`; // Divide by 10 for a more realistic "meter" scale
  }
  lastX = touch.pageX;
  lastY = touch.pageY;
});

