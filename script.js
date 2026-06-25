const chatLauncher = document.getElementById("chatLauncher");
const openChatHero = document.getElementById("openChatHero");

function openBriaChat() {
  alert("Bria chat is coming next. 🍷");
}

if (chatLauncher) {
  chatLauncher.addEventListener("click", openBriaChat);
}

if (openChatHero) {
  openChatHero.addEventListener("click", openBriaChat);
}

const newsletterForm = document.querySelector(".newsletter form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const emailInput = newsletterForm.querySelector("input[type='email']");
    const email = emailInput.value.trim();

    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    alert("You're on the list for Bria's Weekly Pour. 🍷");
    emailInput.value = "";
  });
}
