// Define mutually exclusive groups as an array of arrays (feel free to add as many as you want)
// Group 0: "Push genou" (default) and "Push up"
// Group 1: "Cooper course" (default) and "Cooper nage and Cooper velo"
var mutuallyExclusiveGroups = [
  ["Push genou", "Push up"],
  ["Cooper course", "Cooper nage", "Cooper vélo"],
];
// To add new mutually exclusive exercises, simply add a them to the array above. ex: ,["Saut vertical", "Saut horizontal"]

// Global element references
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

var cat_exes = [];
var csv;

// Fetch and process CSV data
JSC.fetch(
  "https://raw.githubusercontent.com/kyocanada/check-my-workouts/master/indices.csv"
)
  .then((response) => response.text())
  .then((text) => {
    csv = csvToJsonRegex(text);
    csv.forEach((line) => {
      var cat_exe = Object.create({
        Categorie: line.Categorie,
        Exercice: line.Exercice,
        Unite: line.Unite.trim(),
      });
      // For each mutually exclusive group, if the exercise is in that group, insert the option selector
      for (let g = 0; g < mutuallyExclusiveGroups.length; g++) {
        if (mutuallyExclusiveGroups[g].includes(cat_exe.Exercice)) {
          insertExclusiveOptionSelector(line.Categorie, g);
        }
      }
      // Determine where to insert this exercise in the dynamic structure
      switch (isCatExeInArray(cat_exes, cat_exe)) {
        case 1:
          break;
        case 2:
          cat_exes.push(cat_exe);
          var catDiv = document.getElementById(
            `container_${encode(line.Categorie)}`
          );
          var exeDiv = createExe(cat_exe);
          catDiv.appendChild(exeDiv);
          break;
        case 3:
          cat_exes.push(cat_exe);
          // Create new category container
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
  });

// Inserts an option selector into the category container for a given group
function insertExclusiveOptionSelector(category, groupIndex) {
  var containerId = "container_" + encode(category);
  var catContainer = document.getElementById(containerId);
  // Check if an option selector for this group is already inserted
  if (
    catContainer &&
    !catContainer.querySelector(
      ".option-selector[data-group='" + groupIndex + "']"
    )
  ) {
    var optionDiv = document.createElement("div");
    optionDiv.classList.add("option-selector");
    optionDiv.setAttribute("data-group", groupIndex);
    // Unique radio name per category and group
    var radioName = "exclusiveOptions_" + encode(category) + "_" + groupIndex;

    var optionsHTML =
      '<p class="option-title">Sélectionnez une option</p><div class="option-buttons">';
    mutuallyExclusiveGroups[groupIndex].forEach(function (exercise, i) {
      var checked = i === 0 ? "checked" : "";
      optionsHTML +=
        '<label class="option-label">' +
        '<input type="radio" name="' +
        radioName +
        '" value="' +
        exercise +
        '" ' +
        checked +
        ">" +
        exercise +
        "</label>";
    });
    optionsHTML += "</div>";
    optionDiv.innerHTML = optionsHTML;

    optionDiv.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        updateExclusiveDisplayForCategoryAndGroup(category, groupIndex);
      });
    });

    catContainer.insertBefore(optionDiv, catContainer.firstChild);
    updateExclusiveDisplayForCategoryAndGroup(category, groupIndex);
  }
}

// Updates the display for a given category and group based on the selected radio button
function updateExclusiveDisplayForCategoryAndGroup(category, groupIndex) {
  var containerId = "container_" + encode(category);
  var catContainer = document.getElementById(containerId);
  var radioName = "exclusiveOptions_" + encode(category) + "_" + groupIndex;
  var selectedRadio = catContainer.querySelector(
    'input[name="' + radioName + '"]:checked'
  );
  var selectedValue = selectedRadio ? selectedRadio.value : null;
  catContainer
    .querySelectorAll(`.exe[data-exclusive='true'][data-group='${groupIndex}']`)
    .forEach(function (exeDiv) {
      if (
        selectedValue &&
        exeDiv.getAttribute("data-exercise") === selectedValue
      ) {
        exeDiv.style.display = "";
      } else {
        exeDiv.style.display = "none";
      }
    });
}

// Convert CSV string to JSON using regex
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
          String(values[j]).slice(1);
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
  if (typeof foundCatExe !== "undefined") return 1;
  const foundCat = array.find((e) => cat_exe.Categorie == e.Categorie);
  if (typeof foundCat !== "undefined") return 2;
  return 3;
}

// Create the exercise element; if it belongs to a mutually exclusive group, only show it if it is the default
function createExe(obj) {
  var exeDiv = document.createElement("div");
  exeDiv.setAttribute("id", encode(obj.Exercice));
  exeDiv.setAttribute("class", "exe");
  var groupIndex = -1;
  for (let g = 0; g < mutuallyExclusiveGroups.length; g++) {
    if (mutuallyExclusiveGroups[g].includes(obj.Exercice)) {
      groupIndex = g;
      break;
    }
  }
  if (groupIndex !== -1) {
    exeDiv.setAttribute("data-exclusive", "true");
    exeDiv.setAttribute("data-group", groupIndex);
    exeDiv.setAttribute("data-exercise", obj.Exercice);
    // Only display the default option on load
    if (obj.Exercice !== mutuallyExclusiveGroups[groupIndex][0]) {
      exeDiv.style.display = "none";
    }
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
      exeDiv.appendChild(inputMin);
      var textMin = document.createElement("h4");
      textMin.innerHTML = "min";
      exeDiv.appendChild(textMin);
      var inputSec = document.createElement("input");
      inputSec.setAttribute("type", "number");
      inputSec.setAttribute("id", `input_${encode(obj.Exercice)}_sec`);
      inputSec.value = 0;
      inputSec.addEventListener("focus", () => inputSec.select());
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
      exeDiv.appendChild(input);
      var unite = document.createElement("h4");
      unite.innerHTML = obj.Unite;
      exeDiv.appendChild(unite);
      break;
  }
  return exeDiv;
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

document.addEventListener("DOMContentLoaded", function () {
  var elAd = document.getElementById("weebly-footer-signup-container-v3");
  if (elAd) {
    elAd.remove();
    var divs = document.getElementsByTagName("div");
    divs[divs.length - 2].remove();
  }
});
