window.addEventListener("DOMContentLoaded", (event) => {
  const dropArea = document.getElementById("dropArea");
  const dataTable = document.getElementById("dataTable");
  const button = document.querySelector("button");
  /* when click on button call the buttonAlert function */

  // Prevenir comportamientos de arrastrar por defecto
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  // Resaltar área de soltar cuando se arrastra un elemento sobre ella
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  // Eliminar resaltado cuando se arrastra un elemento fuera del área de soltar
  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  // Manejar archivos soltados
  dropArea.addEventListener("drop", handleDrop, false);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropArea.classList.add("highlight");
  }

  function unhighlight() {
    dropArea.classList.remove("highlight");
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    handleFiles(files);
  }

  function handleFiles(files) {
    [...files].forEach(uploadFile);
  }

  function uploadFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const result = e.target.result;
      console.log("Archivo leído:", file.name);
      extractDataFromPDF(result);
    };

    reader.readAsArrayBuffer(file);
  }

  function extractDataFromPDF(fileData) {
    clearTable();
    // Configurar la ruta del archivo de trabajo de pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.js";

    // Cargar el archivo PDF utilizando pdf.js
    pdfjsLib.getDocument(fileData).promise.then(function (pdf) {
      // Extraer datos del PDF de todas las páginas
      const targetPages = [];
      for (let i = 0; i < pdf.numPages; i++) {
        targetPages.push(i + 1);
      }
      const extractedTexts = []; // Cambiado a let

      function extractTextFromPage(pageNumber) {
        return new Promise((resolve, reject) => {
          pdf.getPage(pageNumber).then(function (page) {
            page.getTextContent().then(function (textContent) {
              const extractedText = textContent.items
                .map(function (item) {
                  return item.str;
                })
                .join(" ");

              resolve(extractedText);
            });
          });
        });
      }

      const extractPromises = targetPages.map((pageNumber) =>
        extractTextFromPage(pageNumber)
      );
      Promise.all(extractPromises)
        .then((texts) => {
          console.log("Datos extraídos:", texts);
          extractedTexts.push(...texts);
          processData(extractedTexts);
          sortTableByDate();
        })
        .catch((error) => {
          console.error("Error al extraer datos:", error);
        });
    });
  }

  function formatDate(date) {
    const parts = date.split("/");
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }

  function processData(data) {
    data.forEach((text) => {
      if (text.includes("Total:")) {
        let importe = text.split("Total:")[0].trim().split(" ").pop();
        let cupones = text.split("Total:")[1].trim().split(" ")[0];

        if (cupones === "0") {
          cupones = "0";
          importe = "0";
        }

        let fecha;
        let fechaAfectacion;

        if (text.includes("Rango de fechas")) {
          const fechas = text
            .split("Rango de fechas :")[1]
            .split(" ")[1]
            .split(" a ");
          fecha = fechas[0].trim();
          fechaAfectacion = fechas[0].trim();
        } else {
          fecha = text.split(" ").pop();
        }

        // Agregar los datos a la tabla
        const row = dataTable.insertRow();
        const fechaRecaudacionCell = row.insertCell();
        const importeCell = row.insertCell();
        const cuponesCell = row.insertCell();
        const fechaAfectacionCell = row.insertCell();

        fechaRecaudacionCell.textContent = formatDate(fecha);
        importeCell.textContent = importe;
        cuponesCell.textContent = cupones;
        fechaAfectacionCell.textContent = formatDate(fechaAfectacion);
      }
    });
  }
  function sortTableByDate() {
    const tableRows = [...dataTable.rows];

    tableRows.sort((a, b) => {
      const dateA = new Date(
        a.cells[0].textContent.split("/").reverse().join("-")
      );
      const dateB = new Date(
        b.cells[0].textContent.split("/").reverse().join("-")
      );

      return dateA - dateB;
    });

    tableRows.forEach((row) => {
      dataTable.appendChild(row);
    });
  }
  function clearTable() {
    while (dataTable.rows.length > 1) {
      dataTable.deleteRow(1);
    }
  }

  function processTable() {
    // Obtener la tabla y sus filas
    const dataTable = document.getElementById("dataTable");
    const rows = [...dataTable.rows];

    // Crear un objeto para almacenar las sumas por fecha de recaudación
    const sums = {};

    // Iterar por cada fila de la tabla (excepto la primera fila de encabezado)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Obtener los valores de fecha de recaudación, importe, cupones y fecha de afectación de la fila
      const fechaRecaudacion = row.cells[0].textContent;
      const importe = parseFloat(row.cells[1].textContent.replace(",", "."));
      const cupones = parseInt(row.cells[2].textContent);
      const fechaAfectacion = row.cells[3].textContent;

      // Verificar si la fecha de recaudación ya existe en el objeto de sumas
      if (sums.hasOwnProperty(fechaRecaudacion)) {
        // Si la fecha de recaudación existe, sumar el importe y actualizar la cantidad de cupones y la fecha de afectación
        sums[fechaRecaudacion].importe += importe;
        sums[fechaRecaudacion].cupones += cupones;
      } else {
        // Si la fecha de recaudación no existe, crear una nueva entrada en el objeto de sumas
        sums[fechaRecaudacion] = {
          importe,
          cupones,
          fechaAfectacion,
        };
      }
    }

    // Llamar a la función clearTable para borrar el contenido de la tabla antes de insertar los nuevos datos
    clearTable();

    // Iterar por cada entrada en el objeto de sumas y crear las filas correspondientes en la tabla
    for (const fechaRecaudacion in sums) {
      if (sums.hasOwnProperty(fechaRecaudacion)) {
        const sum = sums[fechaRecaudacion];

        // Crear una nueva fila en la tabla
        const newRow = dataTable.insertRow();

        // Crear las celdas de la fila con los valores de suma
        const fechaRecaudacionCell = newRow.insertCell();
        fechaRecaudacionCell.textContent = fechaRecaudacion;

        const importeCell = newRow.insertCell();
        importeCell.textContent = sum.importe.toFixed(2).replace(".", ",");

        const cuponesCell = newRow.insertCell();
        cuponesCell.textContent = sum.cupones;

        const fechaAfectacionCell = newRow.insertCell();
        fechaAfectacionCell.textContent = sum.fechaAfectacion;
      }
    }
  }
});
