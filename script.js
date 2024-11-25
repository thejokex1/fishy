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
  const swimSound = document.getElementById("swimSound"); // Add this to reference the audio element

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
  
  // Fetch user's country using IP Geolocation API
  fetch("https://get.geojs.io/v1/ip/geo.json")
    .then((response) => response.json())
    .then((data) => {
      userCountry = data.country || "Unknown";
      console.log(`User is from: ${userCountry}`);
      updateCountryScoreDisplay(); // Update the UI as needed
    })
    .catch((error) => console.error("Error fetching country:", error));
  
  // Fetch the country codes JSON file
  let countryCodeMap = {};
  fetch("https://flagcdn.com/en/codes.json")
    .then((response) => response.json())
    .then((data) => {
      countryCodeMap = data; // Store the mapping in a global variable
    })
    .catch((error) => console.error("Error fetching country codes:", error));
  
    function animateFish() {
        currentX += (targetX - currentX) * 0.1; // Interpolation for smooth motion
        currentY += (targetY - currentY) * 0.1;
      
        const angle = Math.atan2(targetY - currentY, targetX - currentX) * (180 / Math.PI);
      
        fish.style.left = `${currentX - fish.offsetWidth / 2}px`;
        fish.style.top = `${currentY - fish.offsetHeight / 2}px`;
        fish.style.transform = `rotate(${angle}deg)`;
      
        // Play swimming sound when moving, but only after audio is initialized
        if (Math.abs(targetX - currentX) > 1 || Math.abs(targetY - currentY) > 1) {
          if (isAudioInitialized && swimSound.paused) {
            swimSound.play();
          }
        } else {
          swimSound.pause(); // Stop sound if no movement
        }
      
        // Move eyes
        moveEyes(angle);
      
        // Keep the animation loop running
        requestAnimationFrame(animateFish);
      }
      
      
  
  function moveEyes(angle) {
    const eyeOffsetX = Math.cos(angle * (Math.PI / 180)) * 5; // Small offset
    const eyeOffsetY = Math.sin(angle * (Math.PI / 180)) * 5;
  
    leftEye.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`;
    rightEye.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`;
  }
  
  // Mouse move (desktop)
document.addEventListener("mousemove", (e) => {
    updateTargetPosition(e.pageX, e.pageY);
  });
  
  // Touch move (mobile)
  document.addEventListener("touchmove", (e) => {
    const touch = e.touches[0]; // Get the first touch point
    updateTargetPosition(touch.pageX, touch.pageY);
  });

  // Prevent scrolling during touch interactions
document.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevent scrolling
  }, { passive: false });
  

  function updateTargetPosition(x, y) {
    targetX = x;
    targetY = y;
  }
  
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
  
  function handleMovement(x, y) {
    if (lastX !== null && lastY !== null) {
      const distance = calculateDistance(lastX, lastY, x, y);
      totalDistance += distance;
      accumulatedDistance += distance;
  
      // Update UI
      updateCountryScoreDisplay();
    }
    lastX = x;
    lastY = y;
  }
  
  // Mouse move (desktop)
  document.addEventListener("mousemove", (e) => {
    handleMovement(e.pageX, e.pageY);
  });
  
  // Touch move (mobile)
  document.addEventListener("touchmove", (e) => {
    const touch = e.touches[0]; // Get the first touch point
    handleMovement(touch.pageX, touch.pageY);
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
  
  // Country normalization
  function normalizeCountryName(countryName) {
    const normalizationMap = {
      Türkiye: "Turkey", // Normalize Turkish to the standard English country name
      Deutschland: "Germany", // Example for German
      "The Netherlands": "Netherlands",
      // Add more normalization rules as needed
    };
  
    return normalizationMap[countryName] || countryName; // Return the original name if no match
  }
  
  // Function to get the country code based on the normalized country name
  function getCountryCode(countryName) {
    const normalizedCountryName = normalizeCountryName(countryName);
    const countryCode = Object.keys(countryCodeMap).find(
      (key) => countryCodeMap[key] === normalizedCountryName
    );
    return countryCode || null; // If not found, return null
  }

  let isAudioInitialized = false;

function initializeAudio() {
  swimSound.play().then(() => {
    swimSound.pause(); // Immediately pause after initializing
    isAudioInitialized = true;
  }).catch((error) => {
    console.warn("Audio cannot play automatically. Waiting for user interaction.");
  });

  // Remove these listeners after initializing the audio
  document.removeEventListener("click", initializeAudio);
  document.removeEventListener("keydown", initializeAudio);
  document.removeEventListener("touchstart", initializeAudio);
}

// Add listeners for first interaction (desktop and mobile)
document.addEventListener("click", initializeAudio);
document.addEventListener("keydown", initializeAudio);
document.addEventListener("touchstart", initializeAudio);
