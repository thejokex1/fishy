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
    navigator.clipboard.writeText('5T4Nu8pJzAtZFDHstR4z9x2paiN8Mxkqe3gwtTwmpump').then(() => {
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

const leaderboardButton = document.getElementById('show-leaderboard');
const leaderboardPanel = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');

// Toggle leaderboard visibility
leaderboardButton.addEventListener('click', () => {
  if (leaderboardPanel.style.display === 'none') {
    leaderboardPanel.style.display = 'block';
    fetchLeaderboard(); // Fetch data when opened
  } else {
    leaderboardPanel.style.display = 'none';
  }
});

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAx87w5mVBoTWIzp52T5zBV9j4UDyFqt9g",
  authDomain: "fish-in-a-bowl.firebaseapp.com",
  databaseURL: "https://fish-in-a-bowl-default-rtdb.firebaseio.com",
  projectId: "fish-in-a-bowl",
  storageBucket: "fish-in-a-bowl.firebasestorage.app",
  messagingSenderId: "592391681079",
  appId: "1:592391681079:web:a0d4b68656397e63f33bb2",
  measurementId: "G-NGPZNXG98J"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Fetch leaderboard from Firebase
function fetchLeaderboard() {
  const leaderboardRef = db.ref('leaderboard');
  leaderboardRef.once('value', (snapshot) => {
    const data = snapshot.val() || {};
    const sortedData = Object.entries(data)
      .sort((a, b) => b[1] - a[1]) // Sort by total distance
      .map(([country, distance]) => ({ country, distance }));

    leaderboardList.innerHTML = ''; // Clear the list

    // Populate the leaderboard
    sortedData.forEach(({ country, distance }) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${country}: ${Math.round(distance / 10).toLocaleString()} Meters`;
      leaderboardList.appendChild(listItem);
    });
  });
}

// Detect user's country
let userCountry = 'Unknown';
function detectCountry() {
  fetch('https://ip-api.com/json/')
    .then((response) => response.json())
    .then((data) => {
      userCountry = data.country || 'Unknown';
    })
    .catch((error) => console.error('Country detection failed:', error));
}

// Call country detection on page load
detectCountry();

// Track and update leaderboard
let totalDistance = 0; // User's distance
document.addEventListener('mousemove', (event) => {
  if (lastX !== null && lastY !== null) {
    const distance = calculateDistance(lastX, lastY, event.pageX, event.pageY);
    totalDistance += distance;

    // Update Firebase
    const countryRef = db.ref(`leaderboard/${userCountry}`);
    countryRef.once('value').then((snapshot) => {
      const currentDistance = snapshot.val() || 0;
      countryRef.set(currentDistance + distance);
    });
  }
  lastX = event.pageX;
  lastY = event.pageY;
});
