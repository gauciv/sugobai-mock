const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

document.querySelectorAll(".service-card").forEach((card) => {
  card.addEventListener("click", () => showToast(`${card.dataset.service} is ready to book`));
});

document.querySelector("#search-button").addEventListener("click", () => {
  showToast("Tell us what needs doing and find the right local pro");
});

document.querySelector("#filter-button").addEventListener("click", () => {
  showToast("Filter by service, rating, and availability");
});

document.querySelector("#post-job").addEventListener("click", () => {
  showToast("Describe the job and get offers from nearby pros");
});

document.querySelector(".location-button").addEventListener("click", () => {
  showToast("Showing available local pros in Cebu City");
});

document.querySelector(".avatar-button").addEventListener("click", () => {
  showToast("Your profile is just a tap away");
});

document.querySelector("#all-services").addEventListener("click", () => {
  showToast("Browse local pros by the work you need done");
});

document.querySelector("#activity-link").addEventListener("click", () => {
  showToast("Showing trusted local professionals");
});

document.querySelector("#worker-button").addEventListener("click", () => {
  showToast("Opening Jun’s verified profile and project portfolio");
});

document.querySelector("#worker-invite").addEventListener("click", () => {
  showToast("Find nearby jobs and build your local reputation");
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.tab !== "Home") showToast(`${tab.dataset.tab} view selected`);
  });
});
