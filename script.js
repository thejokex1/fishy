import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// DOM Elements
const fish = document.getElementById("fish");
const leftEye = document.querySelector(".left-eye .pupil");
const rightEye = document.querySelector(".right-eye .pupil");
const counterElement = document.getElementById("counter");
const leaderboardContainer = document.getElementById("leaderboard-list");
// Leaderboard DOM Elements
const toggleButton = document.getElementById("toggle-leaderboard");
const fullLeaderboard = document.getElementById("full-leaderboard");
const topCountryName = document.getElementById("top-country-name");
const topCountryFlag = document.getElementById("top-country-flag");
const topCountryScore = document.getElementById("top-country-score");
const topCountryPreview = document.getElementById("top-country-preview");

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;
let currentX = targetX;
let currentY = targetY;
let lastX = null;
let lastY = null;
let totalDistance = 0;
let accumulatedDistance = 0;

// Firebase Firestore instance (defined in index.html)
const db = window.db;

// Country Detection
let userCountry = null;

// Fetch the country codes JSON file from the flagcdn API
let countryCodeMap = {};

// Fetch user's country using IP Geolocation API
fetch("http://ip-api.com/json/")
  .then((response) => response.json())
  .then((data) => {
    userCountry = data.country || "Unknown";
    console.log(`User is from: ${userCountry}`);
    updateCountryScoreDisplay(); // Display initial country score
  })
  .catch((error) => {
    console.error("Error fetching country:", error);
    userCountry = "Unknown"; // Set default if there's an error
    updateCountryScoreDisplay(); // Display score with fallback value
  });

// Fetch the country codes JSON file
fetch("https://flagcdn.com/en/codes.json")
  .then((response) => response.json())
  .then((data) => {
    countryCodeMap = data; // Store the mapping in a global variable
  })
  .catch((error) => console.error("Error fetching country codes:", error));

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
document.addEventListener("mousemove", (e) => {
  targetX = e.pageX;
  targetY = e.pageY;
});

// Start fish animation
animateFish();

// Generate Bubbles
const fishbowl = document.querySelector(".fishbowl");

function createBubble() {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  // Randomize position, size, and duration
  bubble.style.setProperty("--x", `${Math.random() * 100}%`);
  bubble.style.setProperty("--size", `${20 + Math.random() * 60}px`);
  bubble.style.setProperty("--duration", `${5 + Math.random() * 10}s`);

  fishbowl.appendChild(bubble);

  // Remove bubble after its animation completes
  setTimeout(() => bubble.remove(), parseFloat(bubble.style.getPropertyValue("--duration")) * 1000);
}

// Generate bubbles periodically
setInterval(createBubble, 500); // Creates a bubble every 500ms

// Function to calculate the distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

document.addEventListener("mousemove", (event) => {
  if (lastX !== null && lastY !== null) {
    const distance = calculateDistance(lastX, lastY, event.pageX, event.pageY);
    totalDistance += distance;
    accumulatedDistance += distance;

    // Update UI locally
    updateCountryScoreDisplay();
  }
  lastX = event.pageX;
  lastY = event.pageY;
});

// Periodic database update function
async function periodicUpdate() {
  if (!userCountry || accumulatedDistance === 0) return;

  const countryRef = doc(db, "leaderboard", userCountry);
  const countrySnap = await getDoc(countryRef);

  const currentScore = countrySnap.exists() ? countrySnap.data().score : 0;
  const newScore = Math.round(currentScore + accumulatedDistance); // Round accumulatedDistance
  await setDoc(countryRef, { score: newScore });

  // Reset accumulated distance after update
  accumulatedDistance = 0;

  // Refresh UI
  updateCountryScoreDisplay();
}

// Display user's country score
async function updateCountryScoreDisplay() {
  if (!userCountry) return;

  const countryRef = doc(db, "leaderboard", userCountry);
  const countrySnap = await getDoc(countryRef);

  const currentScore = countrySnap.exists() ? countrySnap.data().score : 0;
  counterElement.textContent = `Swam ${Math.round(
    totalDistance / 5
  )} Meters (${userCountry}: ${currentScore} Meters)`;
}

// Call periodicUpdate every 1 second
setInterval(periodicUpdate, 1000);

toggleButton.addEventListener("click", () => {
  const isExpanded = fullLeaderboard.classList.contains("expanded");
  fullLeaderboard.classList.toggle("expanded", !isExpanded); // Toggle visibility
  fullLeaderboard.classList.toggle("hidden", isExpanded); // Hide when collapsed
  toggleButton.textContent = isExpanded ? "⬇" : "⬆"; // Update arrow direction
});

// Populate Leaderboard
function setupLeaderboardListener() {
  const leaderboardQuery = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(10)
  );

  onSnapshot(leaderboardQuery, (snapshot) => {
    fullLeaderboard.innerHTML = "";
    let index = 0;

    snapshot.forEach((doc) => {
      const country = doc.id;
      const score = doc.data().score.toLocaleString();
      let flagUrl = "";
      try {
        const countryCode = getCountryCode(country); // Get countryCode for the flag URL

        flagUrl = countryCode
          ? `https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png`
          : `https://flagcdn.com/32x24/${country.toLowerCase()}.png`; // Use countryCode or fallback to country name
      } catch (error) {}

      const entry = document.createElement("div");
      entry.className = "leaderboard-entry";
      entry.innerHTML = `<span><img src="${flagUrl}" alt="${country} flag" /> ${country}</span><span>${score} Meters</span>`;
      fullLeaderboard.appendChild(entry);

      index++;
    });
  });
}

function setupTopCountryPreview() {
  const leaderboardQuery = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(10) // Fetch the top 10 countries
  );

  onSnapshot(leaderboardQuery, (snapshot) => {
    const topCountry = snapshot.docs[0]; // The first entry
    let flagUrl = "";
    if (topCountry) {
      const country = topCountry.id; // Country name
      const score = topCountry.data().score.toLocaleString(); // Formatted score

      const countryCode = getCountryCode(country); // Get countryCode for the flag URL
      try {
        flagUrl = countryCode
          ? `https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png`
          : `https://flagcdn.com/32x24/${country.toLowerCase()}.png`; // Use countryCode or fallback to country name
      } catch (error) {}

      // Update the top country preview

      // Update the top country preview
      document.getElementById("top-country-flag").src = flagUrl;
      document.getElementById("top-country-flag").alt = `${country} flag`;
      document.getElementById("top-country-name").textContent = `#1 ${country}`;
      document.getElementById("top-country-score").textContent = `${score} Meters`;

      // Update the static leaderboard entries
      snapshot.forEach((doc, index) => {
        const country = doc.id;
        const score = doc.data().score.toLocaleString();

        const leaderboardEntries = document.querySelectorAll(".leaderboard-entry");
        if (leaderboardEntries[index]) {
          leaderboardEntries[index].querySelector(".country-name").textContent = country;
          leaderboardEntries[index].querySelector(".country-score").textContent = `${score} Meters`;
        }
      });
    }
  });
}

// Initialize the leaderboard functionality
setupTopCountryPreview();

// Toggle Button Logic

toggleButton.addEventListener("click", () => {
  const fullLeaderboard = document.getElementById("full-leaderboard");
  const isExpanded = !fullLeaderboard.classList.contains("hidden");
  fullLeaderboard.classList.toggle("hidden", isExpanded); // Show/Hide leaderboard
  toggleButton.textContent = isExpanded ? "⬇" : "⬆"; // Update button text
});

setupLeaderboardListener();

function normalizeCountryName(countryName) {
  const normalizationMap = {
    Türkiye: "Turkey", // Normalize Turkish to the standard English country name
    Deutschland: "Germany", // Example for German
    // Add more normalization rules as needed
  };

  // If the country is in the normalization map, return the normalized value
  return normalizationMap[countryName] || countryName; // Return the original name if no match
}

// Function to get the country code based on the normalized country name
function getCountryCode(countryName) {
  // First, normalize the country name
  const normalizedCountryName = normalizeCountryName(countryName);

  // Now, use the normalized country name to find the country code
  const countryCode = Object.keys(countryCodeMap).find(
    (key) => countryCodeMap[key] === normalizedCountryName
  );
  return countryCode || null; // If not found, return null
}
