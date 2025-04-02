var cats = document.getElementById("cats");

var input_date = document.getElementById("date");
Date.prototype.toDateInputValue = function () {
  var local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
};
input_date.value = new Date().toDateInputValue();
var input_name = document.getElementById("name");
var input_age = document.getElementById("age");
var input_sexe = document.getElementById("sexe");

var summary = document.getElementById("summary_full");
var container_summary = document.getElementById("container_summary");

var mutuallyExclusiveGroups = [
  ["Push genou", "Push up"], // First group
  // You can add more groups later if needed
];

// (async () => {
//     const url = "https://raw.githubusercontent.com/kyocanada/check-my-workouts/master/indices.xlsx";
//     const data = await (await fetch(url)).arrayBuffer();

//     const workbook = XLSX.read(data);
//     console.log("workbook.Sheets ", workbook.Sheets)

//     const ws = XLSX.utils.sheet_to_json(workbook.Sheets.Homme)
//     console.log(ws)

//     var categories = []
//     var exercices = []

//     ws.forEach(r => {
//         if (categories.indexOf(r.Categorie) === -1)
//             categories.push(r.Categorie)
//         if (exercices.indexOf(r.Exercice) === -1)
//             exercices.push(r.Exercice)
//     });
//     console.log(categories)
//     console.log(exercices)
//     console.log(workbook.Sheets.Homme["A1"].h)
//     var range = XLSX.utils.decode_range(workbook.Sheets.Homme['!ref'])
//     var rowCount = range.e.r
//     var colCount = range.e.c
// })();

var csv;
var cat_exes = [];

JSC.fetch(
  "https://raw.githubusercontent.com/kyocanada/check-my-workouts/master/indices.csv"
)
  // JSC.fetch("./indices.csv")
  .then((response) => response.text()) // promise
  .then((text) => {
    csv = csvToJsonRegex(text);
    // console.log("text", text)
    // console.log("csv.json", csv)

    csv.forEach((line) => {
      var cat_exe = Object.create({
        Categorie: line.Categorie,
        Exercice: line.Exercice,
        Unite: line.Unite.trim(),
      });

      // console.log("", `${cat_exe.Categorie} / ${cat_exe.Exercice} : ${isCatExeInArray(cat_exes, cat_exe)}`)

      switch (isCatExeInArray(cat_exes, cat_exe)) {
        case 1: // Exercice et categorie existent deja
          break;
        case 2: // Nouvel exercice sous categorie existant
          cat_exes.push(cat_exe);

          var catDiv = document.getElementById(
            `container_${encode(line.Categorie)}`
          );

          var exeDiv = createExe(cat_exe);

          catDiv.appendChild(exeDiv);
          break;
        case 3: // Nouvelle catégorie et nouvel exercice
          cat_exes.push(cat_exe);

          var textCat = document.createElement("h2");
          textCat.setAttribute("class", "cat_title");
          textCat.innerHTML = `▷ ${line.Categorie}`;
          cats.appendChild(textCat);

          var catContainer = document.createElement("div");
          catContainer.setAttribute(
            "id",
            `container_${encode(line.Categorie)}`
          );
          catContainer.setAttribute("class", "cat hide");

          var exeDiv = createExe(cat_exe);
          catContainer.appendChild(exeDiv);

          textCat.addEventListener("click", function () {
            catContainer.classList.toggle("hide");
            var txtcat = catContainer.classList.contains("hide")
              ? `▷ ${line.Categorie}`
              : `▽ ${line.Categorie}`;
            textCat.innerHTML = txtcat;
          });

          cats.appendChild(catContainer);
          break;
        default:
          break;
      }
    });

    // console.log("cat-exes", cat_exes)
  });

function csvToJsonRegex(csvString) {
  const regex = /,(?=(?:[^"]*"[^"]*")*(?![^"]*"))/;
  const rows = csvString.split("\n");
  const headers = rows[0].split(regex);
  const jsonData = [];

  for (let i = 1; i < rows.length - 1; i++) {
    const values = rows[i].split(regex);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      if (j < 5) {
        values[j] =
          String(values[j]).charAt(0).toUpperCase() +
          String(values[j]).slice(1); // Capitalize first letter
      }
      obj[headers[j].trim()] = values[j];
    }
    jsonData.push(obj);
  }

  return jsonData;
}

function encode(str) {
  return str.replace(/[\u0300-\u036f]/g, "").replace(/ /g, "_");
}

function isCatExeInArray(array, cat_exe) {
  const foundCatExe = array.find(
    (e) => cat_exe.Categorie === e.Categorie && cat_exe.Exercice === e.Exercice
  );
  if (typeof foundCatExe !== "undefined") return 1; // Exercice et categorie existent deja
  const foundCat = array.find((e) => cat_exe.Categorie == e.Categorie);
  if (typeof foundCat !== "undefined") return 2; // Nouvel exercice sous categorie existant
  return 3; // Nouvelle catégorie et nouvel exercice
}

function createExe(obj) {
  var exeDiv = document.createElement("div");
  exeDiv.setAttribute("id", encode(obj.Exercice));
  exeDiv.setAttribute("class", "exe");

  // Check if this exercise is part of a mutually exclusive group
  let isExclusiveExercise = false;
  let groupIndex = -1;
  let groupName = "";

  for (let i = 0; i < mutuallyExclusiveGroups.length; i++) {
    if (mutuallyExclusiveGroups[i].includes(obj.Exercice)) {
      isExclusiveExercise = true;
      groupIndex = i;
      groupName = `exclusive_group_${i}`;
      break;
    }
  }

  // For exclusive exercises, add a radio button
  if (isExclusiveExercise) {
    var radioContainer = document.createElement("div");
    radioContainer.setAttribute("class", "radio-container");

    var radioInput = document.createElement("input");
    radioInput.setAttribute("type", "radio");
    radioInput.setAttribute("name", groupName);
    radioInput.setAttribute("id", `radio_${encode(obj.Exercice)}`);
    radioInput.setAttribute("value", obj.Exercice);

    // Add event listener to the radio button
    radioInput.addEventListener("change", function () {
      // Enable inputs for this exercise
      handleExclusiveSelection(groupIndex, obj.Exercice);
    });

    radioContainer.appendChild(radioInput);

    var radioLabel = document.createElement("label");
    radioLabel.setAttribute("for", `radio_${encode(obj.Exercice)}`);
    radioLabel.innerText = "Select";
    radioContainer.appendChild(radioLabel);

    exeDiv.appendChild(radioContainer);
  }

  var textExe = document.createElement("h3");
  textExe.innerHTML = obj.Exercice;
  exeDiv.appendChild(textExe);

  switch (obj.Unite) {
    case "sec":
      var inputMin = document.createElement("input");
      inputMin.setAttribute("type", "number");
      inputMin.setAttribute("id", `input_${encode(obj.Exercice)}_min`);
      inputMin.value = 0;
      inputMin.addEventListener("focus", () => inputMin.select());

      // If it's an exclusive exercise, initially disable it
      if (isExclusiveExercise) {
        inputMin.setAttribute("disabled", "true");
        inputMin.setAttribute("data-exclusive-group", groupIndex);
      }

      exeDiv.appendChild(inputMin);

      var textMin = document.createElement("h4");
      textMin.innerHTML = "min";
      exeDiv.appendChild(textMin);

      var inputSec = document.createElement("input");
      inputSec.setAttribute("type", "number");
      inputSec.setAttribute("id", `input_${encode(obj.Exercice)}_sec`);
      inputSec.value = 0;
      inputSec.addEventListener("focus", () => inputSec.select());

      // If it's an exclusive exercise, initially disable it
      if (isExclusiveExercise) {
        inputSec.setAttribute("disabled", "true");
        inputSec.setAttribute("data-exclusive-group", groupIndex);
      }

      exeDiv.appendChild(inputSec);

      var textSec = document.createElement("h4");
      textSec.innerHTML = "s";
      exeDiv.appendChild(textSec);
      break;

    case "rep":
    default:
      var input = document.createElement("input");
      input.setAttribute("type", "number");
      input.setAttribute("id", `input_${encode(obj.Exercice)}`);
      input.value = 0;
      input.addEventListener("focus", () => input.select());

      // If it's an exclusive exercise, initially disable it
      if (isExclusiveExercise) {
        input.setAttribute("disabled", "true");
        input.setAttribute("data-exclusive-group", groupIndex);
      }

      exeDiv.appendChild(input);

      var unite = document.createElement("h4");
      unite.innerHTML = obj.Unite;
      exeDiv.appendChild(unite);
      break;
  }

  return exeDiv;
}

// Add this new function to handle exclusive exercise selection
function handleExclusiveSelection(groupIndex, selectedExercise) {
  // Get all input elements with the data-exclusive-group attribute matching this group
  const inputs = document.querySelectorAll(
    `[data-exclusive-group="${groupIndex}"]`
  );

  inputs.forEach((input) => {
    // Enable input for the selected exercise, disable for others
    const inputId = input.id;
    if (inputId.includes(encode(selectedExercise))) {
      input.removeAttribute("disabled");
    } else {
      input.setAttribute("disabled", "true");
      input.value = 0; // Reset value when disabled
    }
  });
}

function submit() {
  container_summary.innerHTML = "";

  var age = input_age.value;
  var sexe = input_sexe.checked ? "F" : "H";

  var textDate = document.createElement("p");
  textDate.innerHTML = `Sommaire du ${input_date.value}`;
  container_summary.appendChild(textDate);

  var textNom = document.createElement("p");
  textNom.innerHTML = `Pour ${input_name.value} (${age}) : ${sexe}`;
  container_summary.appendChild(textNom);

  var desc = "";
  var color = "";

  cat_exes.forEach((cat_exe) => {
    var exe_value = 0;
    var text_result = "";

    switch (cat_exe.Unite.trim()) {
      case "sec":
        var exe_value_min = parseInt(
          document.getElementById(`input_${encode(cat_exe.Exercice)}_min`).value
        );
        var exe_value_sec = parseInt(
          document.getElementById(`input_${encode(cat_exe.Exercice)}_sec`).value
        );
        exe_value = exe_value_min * 60 + exe_value_sec;

        text_result = `${cat_exe.Exercice}: ${exe_value_min}min ${exe_value_sec}s`;
        break;
      case "rep":
      default:
        exe_value = parseInt(
          document.getElementById(`input_${encode(cat_exe.Exercice)}`).value
        );
        text_result = `${cat_exe.Exercice}:  ${exe_value} ${cat_exe.Unite}`;
        break;
    }

    if (exe_value > 0) {
      var exeDiv = document.createElement("div");
      var textExe = document.createElement("h3");
      textExe.innerHTML = text_result;
      exeDiv.appendChild(textExe);

      const indices = csv.filter(
        (i) =>
          cat_exe.Categorie === i.Categorie &&
          cat_exe.Exercice === i.Exercice &&
          i.Sexe === sexe
      );

      if (indices.length > 0) {
        var textDesc = document.createElement("h3");
        var indice = indices[0];

        if (exe_value < indice.Orange) {
          desc = "Problématique";
          color = "red";
        } else if (exe_value < indice.Yellow) {
          desc = "Risques accrus";
          color = "orange";
        } else if (exe_value < indice.Blue) {
          desc = "Bien";
          color = "yellow";
        } else if (exe_value < indice.Green) {
          desc = "Très bien";
          color = "blue";
        } else {
          desc = "Excellent";
          color = "green";
        }
        textDesc.setAttribute("class", color);
        textDesc.innerHTML = desc;
        exeDiv.appendChild(textDesc);

        container_summary.appendChild(exeDiv);
      }
    }
  });

  summary.classList.remove("hide");
}

function hideSummary() {
  summary.classList.add("hide");
}

document.addEventListener("DOMContentLoaded", function (event) {
  var elAd = document.getElementById("weebly-footer-signup-container-v3");
  if (elAd) {
    elAd.remove();

    var divs = document.getElementsByTagName("div");
    divs[divs.length - 2].remove();
  }
});
