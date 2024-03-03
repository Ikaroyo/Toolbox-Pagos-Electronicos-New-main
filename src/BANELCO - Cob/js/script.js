// Obtener referencias a los elementos HTML
const dropArea = document.getElementById("drop-area");
const fileList = document.getElementById("file-list");
const resultBody = document.getElementById("result-body");

// Agregar eventos de arrastrar y soltar
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("highlight");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("highlight");
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("highlight");

  const files = e.dataTransfer.files;
  clearTable(); // Limpiar la tabla antes de procesar los archivos
  handleFiles(files);
});

// Agregar evento al input de archivo
const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", (e) => {
  const files = e.target.files;
  clearTable(); // Limpiar la tabla antes de procesar los archivos
  handleFiles(files);
});

// Función para procesar los archivos
function handleFiles(files) {
  for (const file of files) {
    const listItem = document.createElement("li");
    listItem.textContent = file.name;
    fileList.appendChild(listItem);

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;
      const data = extractData(contents);
      if (data) {
        createResultRow(data.date, file.name, data.coupons, data.amount);
        sortTableByDate();
      }
    };
    reader.readAsText(file);
  }
}

// Función para limpiar la tabla de resultados
function clearTable() {
  while (resultBody.firstChild) {
    resultBody.removeChild(resultBody.firstChild);
  }
}

// Función para extraer la fecha, la cantidad de cupones y el monto cobrado de la última fila
function extractData(contents) {
  const rows = contents.split("\n");
  const lastRow = rows[rows.length - 2].trim();
  const date = lastRow.substring(8, 16);

  const day = date.substring(6);
  const month = date.substring(4, 6);
  const year = date.substring(0, 4);

  const formattedDate = `${day}-${month}-${year}`;

  const coupons = parseInt(lastRow.substring(16, 23), 10).toString();
  const amount =
    parseFloat(lastRow.substring(24, 39)) + "," + lastRow.substring(39, 41);

  const data = {
    date: formattedDate.trim(),
    coupons: coupons.trim(),
    amount: amount.trim(),
  };

  return data;
}

// Función para crear una nueva fila en la tabla de resultados
function createResultRow(date, filename, coupons, amount) {
  const row = document.createElement("tr");

  const dateCell = document.createElement("td");
  dateCell.textContent = date;
  row.appendChild(dateCell);

  const fileCell = document.createElement("td");
  fileCell.textContent = filename;
  row.appendChild(fileCell);

  const couponsCell = document.createElement("td");
  couponsCell.textContent = coupons;
  row.appendChild(couponsCell);

  const amountCell = document.createElement("td");
  amountCell.textContent = amount;
  row.appendChild(amountCell);

  resultBody.appendChild(row);
}

// Función para ordenar la tabla por fecha
function sortTableByDate() {
  const rows = Array.from(resultBody.getElementsByTagName("tr"));

  rows.sort((a, b) => {
    const dateA = moment(a.cells[0].textContent, "DD-MM-YYYY");
    const dateB = moment(b.cells[0].textContent, "DD-MM-YYYY");

    if (dateA.isBefore(dateB)) {
      return -1;
    } else if (dateA.isAfter(dateB)) {
      return 1;
    } else {
      return 0;
    }
  });

  for (const row of rows) {
    resultBody.appendChild(row);
  }
}
