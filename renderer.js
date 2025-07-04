document.getElementById("calculate").addEventListener("click", () => {
  const time = parseFloat(document.getElementById("time").value);
  const pace = document.getElementById("pace").value.trim();

  if (!time || !pace.includes(":")) {
    document.getElementById("resault").innerText = "Enter correct data.";
    return;
  }

  const [min, sec] = pace.split(":").map(Number);
  const paceMin = min + sec / 60;

  const distance = time / paceMin;
  document.getElementById("resault").innerText = `Distance: ${distance.toFixed(
    2
  )} km`;
});
