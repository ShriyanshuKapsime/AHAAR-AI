
// ===== DROPDOWNS =====
const genderDropdown = document.querySelector('.dropdown-content');
const genderButton = document.querySelector('.dropdown-button');

genderDropdown.addEventListener('click', function (e) {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const selectedGender = e.target.textContent;
    genderButton.textContent = selectedGender;
    genderButton.dataset.value = selectedGender;
  }
});

const activityDropdown = document.querySelector('.dropdown-content2');
const activityButton = document.querySelector('.dropdown-button2');

activityDropdown.addEventListener('click', function (e) {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const selectedActivity = e.target.textContent;
    activityButton.textContent = selectedActivity;
    activityButton.dataset.value = selectedActivity;
  }
});

// ===== COLLECT DATA =====
function collectFormData() {
  return {
    name: document.querySelector('input[placeholder="Name"]').value,
    height: document.querySelector('input[placeholder="Height(in cm)"]').value,
    weight: document.querySelector('input[placeholder="Weight(in kg)"]').value,
    age: document.querySelector('input[placeholder="Age"]').value,
    gender: genderButton.dataset.value || '',
    activity: activityButton.dataset.value || ''
  };
}

// ===== REGISTER USER =====
const proceedButton = document.getElementById('proceed');

proceedButton.addEventListener('click', async () => {
  const data = collectFormData();

  // Save locally
  localStorage.setItem('userData', JSON.stringify(data));

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        email: data.name + "@ahaar.app",
        password: "123456"
      })
    });

    const result = await res.json();

    if (result.token) {
      localStorage.setItem("token", result.token);
    } else {
      console.warn("No token received");
    }

  } catch (err) {
    console.error("Auth error:", err);
  }

  // Go next
  window.location.href = "Ahaar3.html";
});
