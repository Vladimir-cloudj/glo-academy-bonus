"use strict";

// DOM Elements
const heroesGrid = document.getElementById("heroesGrid");
const movieFilter = document.getElementById("movieFilter");
const heroesCount = document.getElementById("heroesCount");

// State
let allHeroes = [];
let uniqueMovies = new Set();
let isLoading = false; // Флаг для предотвращения повторных загрузок

// ===== Fetch Data =====
const fetchData = async (url) => {
  try {
    console.log("🔄 Загрузка данных из:", url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Данные загружены:", data);
    return data;
  } catch (error) {
    console.error("❌ Ошибка загрузки:", error);
    heroesGrid.innerHTML = `
            <div class="error">
                ❌ Ошибка загрузки данных: ${error.message}<br>
                <small>Убедитесь, что файл dbHeroes.json существует и запущен локальный сервер</small>
            </div>
        `;
    return null;
  }
};

// ===== Create Hero Card =====
const createHeroCard = (hero) => {
  const card = document.createElement("div");
  card.className = "hero-card";
  card.dataset.movies = hero.movies ? hero.movies.join(",") : "";

  // Determine status class
  const status = hero.status ? hero.status.toLowerCase().trim() : "unknown";
  let statusText = "Неизвестно";
  let statusClass = "status-unknown";

  if (status === "alive") {
    statusText = "Жив";
    statusClass = "status-alive";
  } else if (status === "deceased") {
    statusText = "Погиб";
    statusClass = "status-deceased";
  } else if (status === "destroyed") {
    statusText = "Уничтожен";
    statusClass = "status-deceased";
  }

  // Get photo path - проверяем несколько вариантов
  let photoPath = "dbimage/default.jpg";
  if (hero.photo) {
    const cleanPhoto = hero.photo.trim();
    photoPath = cleanPhoto.startsWith("dbimage/")
      ? cleanPhoto
      : `dbimage/${cleanPhoto}`;
  }

  card.innerHTML = `
        <img src="${photoPath}" alt="${hero.name}" class="hero-image" onerror="this.src='dbimage/default.jpg'; this.onerror=null;">
        <div class="hero-info">
            <h2 class="hero-name">${hero.name}</h2>
            ${hero.realName ? `<p class="hero-real-name">${hero.realName}</p>` : ""}
            
            <div class="hero-details">
                ${
                  hero.species
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Вид:</span>
                    <span class="detail-value">${hero.species}</span>
                </div>
                `
                    : ""
                }
                
                ${
                  hero.citizenship
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Гражданство:</span>
                    <span class="detail-value">${hero.citizenship}</span>
                </div>
                `
                    : ""
                }
                
                ${
                  hero.gender
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Пол:</span>
                    <span class="detail-value">${hero.gender === "male" ? "Мужской" : hero.gender === "female" ? "Женский" : hero.gender}</span>
                </div>
                `
                    : ""
                }
                
                <div class="detail-row">
                    <span class="detail-label">Статус:</span>
                    <span class="detail-value ${statusClass}">${statusText}</span>
                </div>
                
                ${
                  hero.birthDay
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Рождение:</span>
                    <span class="detail-value">${hero.birthDay}</span>
                </div>
                `
                    : ""
                }
                
                ${
                  hero.deathDay
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Смерть:</span>
                    <span class="detail-value">${hero.deathDay}</span>
                </div>
                `
                    : ""
                }
                
                ${
                  hero.actors
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Актёр:</span>
                    <span class="detail-value">${hero.actors}</span>
                </div>
                `
                    : ""
                }
            </div>
            
            ${
              hero.movies && hero.movies.length > 0
                ? `
            <div class="hero-movies">
                <div class="movies-title">🎬 Фильмы:</div>
                <div class="movies-list">
                    ${hero.movies.map((movie) => `<span class="movie-tag">${movie}</span>`).join("")}
                </div>
            </div>
            `
                : ""
            }
        </div>
    `;

  return card;
};

// ===== Render Heroes =====
const renderHeroes = (heroes) => {
  console.log("📊 Отрисовка героев:", heroes.length);
  heroesGrid.innerHTML = "";

  if (!heroes || heroes.length === 0) {
    heroesGrid.innerHTML = '<div class="error">😕 Герои не найдены</div>';
    return;
  }

  heroes.forEach((hero, index) => {
    const card = createHeroCard(hero);
    // Stagger animation - только один раз
    card.style.animationDelay = `${index * 0.05}s`;
    heroesGrid.appendChild(card);
  });

  heroesCount.textContent = `Показано героев: ${heroes.length} из ${allHeroes.length}`;
};

// ===== Extract Unique Movies =====
const extractUniqueMovies = (heroes) => {
  uniqueMovies.clear();
  if (!heroes) return [];

  heroes.forEach((hero) => {
    if (hero.movies && Array.isArray(hero.movies)) {
      hero.movies.forEach((movie) => {
        if (movie) uniqueMovies.add(movie.trim());
      });
    }
  });
  return Array.from(uniqueMovies).sort();
};

// ===== Populate Filter =====
const populateFilter = (movies) => {
  // Keep the "All" option
  movieFilter.innerHTML = '<option value="all">Все герои</option>';

  if (!movies) return;

  movies.forEach((movie) => {
    const option = document.createElement("option");
    option.value = movie;
    option.textContent = movie;
    movieFilter.appendChild(option);
  });
};

// ===== Filter Heroes =====
const filterHeroes = (movie) => {
  console.log("🔍 Фильтр:", movie);
  if (movie === "all") {
    renderHeroes(allHeroes);
  } else {
    const filtered = allHeroes.filter(
      (hero) => hero.movies && hero.movies.includes(movie),
    );
    renderHeroes(filtered);
  }
};

// ===== Initialize =====
const init = async () => {
  // Предотвращаем повторную инициализацию
  if (isLoading) {
    console.warn("⚠️ Уже идет загрузка...");
    return;
  }

  isLoading = true;
  console.log("🚀 Инициализация приложения...");

  heroesGrid.innerHTML = '<div class="loading">⏳ Загрузка данных...</div>';

  try {
    // Load heroes data
    allHeroes = await fetchData("dbHeroes.json");

    if (!allHeroes) {
      console.error("❌ Данные не загружены");
      return;
    }

    console.log("✅ Всего героев:", allHeroes.length);

    // Extract and populate movies
    const movies = extractUniqueMovies(allHeroes);
    console.log("🎬 Уникальных фильмов:", movies.length);
    populateFilter(movies);

    // Render all heroes initially
    renderHeroes(allHeroes);

    // Add filter event listener (только один раз!)
    movieFilter.removeEventListener("change", filterHeroes);
    movieFilter.addEventListener("change", (e) => {
      filterHeroes(e.target.value);
    });
  } catch (error) {
    console.error("❌ Ошибка инициализации:", error);
    heroesGrid.innerHTML = `
            <div class="error">
                ❌ Критическая ошибка: ${error.message}
            </div>
        `;
  } finally {
    isLoading = false;
  }
};

// Start the app (только один раз!)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
