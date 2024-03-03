class PDFManager {
  constructor() {
    this.dropZone = document.getElementById("drag-drop-zone");
    this.pdfFiles = [];
    this.initEventListeners();
  }

  initEventListeners() {
    this.dropZone.addEventListener(
      "dragover",
      this.handleDragOver.bind(this),
      false
    );
    this.dropZone.addEventListener(
      "drop",
      this.handleFileDrop.bind(this),
      false
    );

    document
      .getElementById("sort-button")
      .addEventListener("click", this.sortFilesByName.bind(this), false);
    document
      .getElementById("merge-button")
      .addEventListener("click", this.mergeAllPDFs.bind(this), false);
    document
      .getElementById("delete-button")
      .addEventListener("click", this.deleteAllFiles.bind(this), false);
    document
      .getElementById("load-files")
      .addEventListener("click", this.loadFiles.bind(this), false);
  }

  handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async handleFileDrop(event) {
    event.stopPropagation();
    event.preventDefault();

    const files = event.dataTransfer.files;
    await this.processFiles(files);
  }

  async loadFiles() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.multiple = true;

    fileInput.addEventListener("change", async (event) => {
      const files = event.target.files;
      await this.processFiles(files);
    });

    fileInput.click();
  }

  async processFiles(files) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type === "application/pdf") {
        const isDuplicate = this.pdfFiles.some((pdfFile) => {
          return (
            pdfFile.name === files[i].name && pdfFile.size === files[i].size
          );
        });

        if (isDuplicate) {
          alert("El archivo " + files[i].name + " ya está en la lista.");
        } else {
          this.pdfFiles.push(files[i]);
          document.getElementById("delete-button").classList.remove("disabled");
          if (this.pdfFiles.length >= 2) {
            document
              .getElementById("merge-button")
              .classList.remove("disabled");
            document.getElementById("sort-button").classList.remove("disabled");
          }
        }
      }
    }

    this.updatePDFList();
  }

  updatePDFList() {
    const pdfList = document.getElementById("pdf-list");
    pdfList.innerHTML = "";

    if (this.pdfFiles.length >= 2) {
      document.getElementById("merge-button").classList.remove("disabled");
      document.getElementById("sort-button").classList.remove("disabled");
    }

    if (this.pdfFiles.length >= 1) {
      document.getElementById("delete-button").classList.remove("disabled");
    }

    for (let i = 0; i < this.pdfFiles.length; i++) {
      const listItem = document.createElement("li");
      listItem.textContent = this.pdfFiles[i].name;
      pdfList.appendChild(listItem);
    }
    document.getElementById("pdf-count").textContent = this.pdfFiles.length;
  }

  async mergeAllPDFs() {
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < this.pdfFiles.length; i++) {
      const donorPdfBytes = await this.pdfFiles[i].arrayBuffer();
      const donorPdfDoc = await PDFLib.PDFDocument.load(donorPdfBytes);

      for (let k = 0; k < donorPdfDoc.getPageCount(); k++) {
        const [donorPage] = await pdfDoc.copyPages(donorPdfDoc, [k]);
        pdfDoc.addPage(donorPage);
      }
    }

    const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    const data_pdf = pdfDataUri.substring(pdfDataUri.indexOf(",") + 1);

    this.downloadPDF(data_pdf);
  }

  downloadPDF(data) {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${data}`;
    link.download = new Date().toISOString().slice(0, 19).replace("T", "-");
    link.click();
  }

  deleteAllFiles() {
    this.pdfFiles = [];
    this.updatePDFList();
    document.getElementById("merge-button").classList.add("disabled");
    document.getElementById("sort-button").classList.add("disabled");
    document.getElementById("delete-button").classList.add("disabled");
    document.getElementById("pdf-list").innerHTML =
      "Aun no has subido archivos";
  }

  sortFilesByName() {
    this.pdfFiles.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    this.updatePDFList();
  }
}

// Crear una instancia de la clase PDFManager
const pdfManager = new PDFManager();
