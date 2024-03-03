const dataByDate = {};

function processHtmlFile(filename, htmlDoc) {
  let l1 = 0;
  let l2 = 0;
  let fecha = "";

  const tdElements = htmlDoc.querySelectorAll("td.tt");
  for (const tdElement of tdElements) {
    if (tdElement.textContent === "RECAUDACION") {
      const nextTdElement = tdElement.nextElementSibling;
      if (nextTdElement && nextTdElement.tagName === "TD") {
        console.log("Procesando archivo:", filename);
        console.log("Valor de la celda:", nextTdElement.textContent);
        if (filename.indexOf("liq1") !== -1) {
          l1 = parseFloat(
            nextTdElement.textContent.replace(/\./g, "").replace(",", ".")
          );
          console.log("Valor de L1:", l1);
        } else if (filename.indexOf("liqb1") !== -1) {
          l2 = parseFloat(
            nextTdElement.textContent.replace(/\./g, "").replace(",", ".")
          );
          console.log("Valor de L2:", l2);
        }
      }
    } else if (tdElement.textContent === "FECHA DE PAGO") {
      const nextTdElement = tdElement.nextElementSibling;
      if (nextTdElement && nextTdElement.tagName === "TD") {
        console.log("Procesando archivo:", filename);
        console.log("Fecha depago:", nextTdElement.textContent);
        fecha = nextTdElement.textContent.trim();
      }
    }
  }

  if (fecha) {
    const fechaModificada = restarDias(fecha, 2);
    if (!dataByDate[fechaModificada]) {
      dataByDate[fechaModificada] = { l1: 0, l2: 0 };
    }
    dataByDate[fechaModificada].l1 += l1;
    dataByDate[fechaModificada].l2 += l2;
  }
}

function restarDias(fecha, dias) {
  const fechaOriginal = moment(fecha, "DD/MM/YYYY");
  const fechaModificada = fechaOriginal.subtract(dias, "days");
  return fechaModificada.format("DD/MM/YYYY");
}

function renderTable() {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = "";

  const dataArray = Object.entries(dataByDate).map(([fecha, { l1, l2 }]) => ({
    fecha,
    l1,
    l2,
    total: l1 + l2,
  }));

  dataArray.sort((a, b) =>
    moment(a.fecha, "DD/MM/YYYY").diff(moment(b.fecha, "DD/MM/YYYY"))
  );

  const tableRows = dataArray.reduce((rows, { fecha, l1, l2, total }) => {
    const newRow = `
      <tr data-date="${fecha}">
        <td>${fecha}</td>
        <td class="l1">${l1.toFixed(2).replace(".", ",")}</td>
        <td class="l2">${l2.toFixed(2).replace(".", ",")}</td>
        <td class="total">${total.toFixed(2).replace(".", ",")}</td>
      </tr>
    `;
    return rows + newRow;
  }, "");

  tableBody.innerHTML = tableRows;
}

function handleDrop(event) {
  // clear data
  Object.keys(dataByDate).forEach((key) => delete dataByDate[key]);

  event.preventDefault();
  const files = event.dataTransfer.files;
  let numFilesProcessed = 0;
  for (const file of files) {
    if (file.type === "text/html") {
      const reader = new FileReader();
      reader.onload = ((filename) => {
        return (event) => {
          const content = event.target.result;
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(content, "text/html");
          processHtmlFile(filename.toLowerCase(), htmlDoc);
          renderTable();
        };
      })(file.name);
      reader.readAsText(file);
    }
  }
}

function handleDragOver(event) {
  event.preventDefault();
}

const dropZone = document;
dropZone.addEventListener("dragover", handleDragOver, false);
dropZone.addEventListener("drop", handleDrop, false);

renderTable();
