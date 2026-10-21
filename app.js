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
  showToast("Tell us what you need and we’ll find a Sugo for you");
});

document.querySelector(".location-button").addEventListener("click", () => {
  showToast("Showing available Sugos in Cebu City");
});

document.querySelector(".avatar-button").addEventListener("click", () => {
  showToast("Your profile is just a tap away");
});

document.querySelector("#all-services").addEventListener("click", () => {
  showToast("More services are coming soon");
});

document.querySelector("#promo-button").addEventListener("click", () => {
  showToast("Your ₱50 welcome offer is ready");
});

document.querySelector("#activity-link").addEventListener("click", () => {
  document.querySelector('[data-tab="Activity"]').click();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.tab !== "Home") showToast(`${tab.dataset.tab} view selected`);
  });
});
