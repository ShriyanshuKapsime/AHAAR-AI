const userData = JSON.parse(localStorage.getItem('userData'));

// ===== BUTTON SETUP =====
function setupButtons(container) {
  container.querySelectorAll('.add-item').forEach(button => {
    button.onclick = () => {
      const parent = button.closest('.food-items');

      const newFoodItem = document.createElement('div');
      newFoodItem.className = 'food-item';
      newFoodItem.innerHTML = `
        <input class="addcss food" placeholder="Enter food item">
        <button type="button" class="add-item">+</button>
        <button type="button" class="remove-item">❌</button>
      `;

      parent.appendChild(newFoodItem);
      setupButtons(newFoodItem);
    };
  });

  container.querySelectorAll('.remove-item').forEach(button => {
    button.onclick = () => {
      const foodItem = button.closest('.food-item');
      const parent = foodItem.parentElement;

      if (parent.children.length > 1) {
        foodItem.remove();
      } else {
        foodItem.querySelector('input').value = '';
      }
    };
  });
}

document.querySelectorAll('.meal').forEach(setupButtons);

// ===== SUBMIT =====
document.querySelector(".submit").addEventListener("click", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");

  let ingredients = [];

  document.querySelectorAll(".food").forEach(input => {
    const item = input.value.trim();

    if (item) {
      ingredients.push({
        name: item,
        quantity: 100
      });
    }
  });

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ ingredients })
    });

    const total = await res.json();

    if (total.error) {
      alert(total.error);
      return;
    }

    document.getElementById("Resulttable").style.display = "table";

    document.getElementById("intcalories").textContent = total.calories + " kcal";
    document.getElementById("intprotein").textContent = total.protein + " g";
    document.getElementById("intiron").textContent = total.iron + " mg";
    document.getElementById("intvitamind").textContent = total.vitaminD + " µg";
    document.getElementById("intzinc").textContent = total.zinc + " mg";
    document.getElementById("intmagnesium").textContent = total.magnesium + " mg";
    document.getElementById("intfolate").textContent = total.folate + " µg";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});
