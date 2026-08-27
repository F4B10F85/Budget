"use strict";

/*
|--------------------------------------------------------------------------
| Budget - Excel
|--------------------------------------------------------------------------
| Importazione del file Excel degli ordini aperti.
|
| Il file caricato dall'utente contiene un singolo foglio con le colonne:
|
| Ragione sociale
| Articolo
| Quantità ordinato
| Quantità saldo
| Linea
| Famiglia
| BloccaEvasione*
| ImponibileSaldo
| Data consegna
| DesStato*
| Divisione*
| Rif. registrazione
| Numero Riga*
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Struttura dati principale
|--------------------------------------------------------------------------
*/

let budgetData = {

    extraction: [],

    families: [],

    projection: [],

    budget: [],

    sourceFile: null,

    importedAt: null

};


/*
|--------------------------------------------------------------------------
| Colonne richieste dal file Excel
|--------------------------------------------------------------------------
*/

const REQUIRED_EXCEL_COLUMNS = [

    "Ragione sociale",
    "Articolo",
    "Quantità ordinato",
    "Quantità saldo",
    "Linea",
    "Famiglia",
    "BloccaEvasione*",
    "ImponibileSaldo",
    "Data consegna",
    "DesStato*",
    "Divisione*",
    "Rif. registrazione",
    "Numero Riga*"

];


/*
|--------------------------------------------------------------------------
| Inizializzazione importazione
|--------------------------------------------------------------------------
*/

function initializeExcelImport() {

    const fileInput =
        document.getElementById("excel-file");

    const dropZone =
        document.getElementById("drop-zone");


    if (!fileInput) {

        console.error(
            "Input Excel #excel-file non trovato."
        );

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Importazione tramite selezione file
    |--------------------------------------------------------------------------
    */

    fileInput.addEventListener(
        "change",
        (event) => {

            const file =
                event.target.files[0];

            if (file) {

                processExcelFile(file);

            }

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Drag & Drop
    |--------------------------------------------------------------------------
    |
    | Il drag & drop è opzionale.
    | Se il drop-zone non esiste nell'interfaccia,
    | l'importazione tramite pulsante continua comunque a funzionare.
    |
    |--------------------------------------------------------------------------
    */

    if (dropZone) {

        dropZone.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                dropZone.classList.add(
                    "dragover"
                );

            }
        );


        dropZone.addEventListener(
            "dragleave",
            () => {

                dropZone.classList.remove(
                    "dragover"
                );

            }
        );


        dropZone.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                dropZone.classList.remove(
                    "dragover"
                );


                const file =
                    event.dataTransfer.files[0];


                if (file) {

                    processExcelFile(file);

                }

            }
        );

    }


    console.log(
        "Importazione Excel inizializzata."
    );

}


/*
|--------------------------------------------------------------------------
| Elaborazione file Excel
|--------------------------------------------------------------------------
*/

function processExcelFile(file) {

    console.log("File selezionato:", file);


    /*
    |----------------------------------------------------------------------
    | Controllo estensione
    |----------------------------------------------------------------------
    */

    if (!file.name.match(/\.(xlsx|xls)$/i)) {

        showImportStatus(
            "Errore: il file selezionato non è un file Excel valido."
        );

        return;

    }


    showImportStatus(
        `Lettura di "${file.name}" in corso...`
    );


    const reader = new FileReader();


    reader.onload = function(event) {

        try {

            const data = new Uint8Array(
                event.target.result
            );


            /*
            |------------------------------------------------------------------
            | Lettura workbook
            |------------------------------------------------------------------
            */

            const workbook = XLSX.read(
                data,
                {
                    type: "array",
                    cellDates: true
                }
            );


            console.log(
                "Fogli trovati:",
                workbook.SheetNames
            );


            /*
            |------------------------------------------------------------------
            | Il file deve contenere almeno un foglio
            |------------------------------------------------------------------
            */

            if (
                !workbook.SheetNames ||
                workbook.SheetNames.length === 0
            ) {

                throw new Error(
                    "Il file Excel non contiene fogli."
                );

            }


            /*
            |------------------------------------------------------------------
            | Utilizziamo il primo foglio del file.
            |
            | Non è necessario che si chiami ESTRAPOLAZIONE.
            |------------------------------------------------------------------
            */

            const sheetName = workbook.SheetNames[0];

            const worksheet = workbook.Sheets[sheetName];


            /*
            |------------------------------------------------------------------
            | Conversione in oggetti JavaScript
            |------------------------------------------------------------------
            */

            const rows = XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: null,
                    raw: true
                }
            );


            console.log(
                "Righe lette:",
                rows.length
            );


            /*
            |------------------------------------------------------------------
            | Validazione struttura
            |------------------------------------------------------------------
            */

            validateExcelColumns(rows);


            /*
            |------------------------------------------------------------------
            | Normalizzazione
            |------------------------------------------------------------------
            */

            const normalizedRows = rows.map(
                normalizeExcelRow
            );


            /*
            |------------------------------------------------------------------
            | Salvataggio nel dataset principale
            |------------------------------------------------------------------
            */

            budgetData.extraction = normalizedRows;

            budgetData.sourceFile = file.name;

            budgetData.importedAt = new Date();


            console.log(
                "Dati importati:",
                budgetData.extraction
            );


            /*
            |------------------------------------------------------------------
            | Aggiornamento interfaccia
            |------------------------------------------------------------------
            */

            processImportedData();


        } catch (error) {

            console.error(
                "Errore durante l'importazione Excel:",
                error
            );


            showImportStatus(
                `Errore durante l'importazione: ${error.message}`
            );

        }

    };


    reader.onerror = function() {

        console.error(
            "Impossibile leggere il file."
        );


        showImportStatus(
            "Errore: impossibile leggere il file."
        );

    };


    reader.readAsArrayBuffer(file);

}


/*
|--------------------------------------------------------------------------
| Validazione colonne
|--------------------------------------------------------------------------
*/

function validateExcelColumns(rows) {

    if (!rows || rows.length === 0) {

        throw new Error(
            "Il foglio Excel non contiene righe di dati."
        );

    }


    const availableColumns = Object.keys(rows[0]);


    console.log(
        "Colonne trovate:",
        availableColumns
    );


    const missingColumns =
        REQUIRED_EXCEL_COLUMNS.filter(
            column => !availableColumns.includes(column)
        );


    if (missingColumns.length > 0) {

        throw new Error(
            "Nel file Excel mancano le seguenti colonne: " +
            missingColumns.join(", ")
        );

    }

}


/*
|--------------------------------------------------------------------------
| Normalizzazione riga
|--------------------------------------------------------------------------
*/

function normalizeExcelRow(row) {

    return {

        cliente:
            row["Ragione sociale"],

        articolo:
            row["Articolo"],

        quantitaOrdinata:
            toNumber(row["Quantità ordinato"]),

        quantitaSaldo:
            toNumber(row["Quantità saldo"]),

        linea:
            row["Linea"],

        famiglia:
            row["Famiglia"],

        bloccaEvasione:
            row["BloccaEvasione*"],

        valore:
            toNumber(row["ImponibileSaldo"]),

        dataConsegna:
            normalizeDate(row["Data consegna"]),

        stato:
            row["DesStato*"],

        divisione:
            row["Divisione*"],

        riferimentoRegistrazione:
            row["Rif. registrazione"],

        numeroRiga:
            row["Numero Riga*"]

    };

}


/*
|--------------------------------------------------------------------------
| Conversione numerica
|--------------------------------------------------------------------------
*/

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (typeof value === "number") {

        return value;

    }


    const normalized = String(value)
        .replace(/\./g, "")
        .replace(",", ".");


    const number = Number(normalized);


    return Number.isNaN(number)
        ? 0
        : number;

}


/*
|--------------------------------------------------------------------------
| Normalizzazione data
|--------------------------------------------------------------------------
*/

function normalizeDate(value) {

    if (!value) {

        return null;

    }


    if (value instanceof Date) {

        return value;

    }


    /*
    |----------------------------------------------------------------------
    | Se SheetJS restituisce un numero seriale Excel
    |----------------------------------------------------------------------
    */

    if (typeof value === "number") {

        const excelEpoch = new Date(
            Date.UTC(1899, 11, 30)
        );


        return new Date(
            excelEpoch.getTime() +
            value * 86400000
        );

    }


    const parsed = new Date(value);


    if (!Number.isNaN(parsed.getTime())) {

        return parsed;

    }


    return null;

}


/*
|--------------------------------------------------------------------------
| Elaborazione dati importati
|--------------------------------------------------------------------------
*/

function processImportedData() {

    const count =
        budgetData.extraction.length;


    console.log(
        `Importazione completata: ${count} righe.`
    );


    updateImportSummary();

    renderImportedOrders();


    /*
    |--------------------------------------------------------------------------
    | Analisi automatica del portafoglio
    |--------------------------------------------------------------------------
    */

    const analysis =
        analyzePortfolio();


    /*
    |--------------------------------------------------------------------------
    | Aggiornamento dashboard
    |--------------------------------------------------------------------------
    */

    updateDashboardFromAnalysis(
        analysis
    );

}


/*
|--------------------------------------------------------------------------
| Riepilogo importazione
|--------------------------------------------------------------------------
*/

function updateImportSummary() {

    const count =
        budgetData.extraction.length;


    const recordsInfo =
        document.getElementById("records-info");


    if (recordsInfo) {

        recordsInfo.textContent =
            `${count.toLocaleString("it-IT")} righe importate dal file "${budgetData.sourceFile}".`;

    }


    showImportStatus(

        `Importazione completata: ${count.toLocaleString("it-IT")} righe caricate correttamente.`

    );

}


/*
|--------------------------------------------------------------------------
| Messaggio stato importazione
|--------------------------------------------------------------------------
*/

function showImportStatus(message) {

    const status =
        document.getElementById("import-status");


    if (!status) {

        return;

    }


    status.textContent = message;

    status.classList.remove("hidden");

}


/*
|--------------------------------------------------------------------------
| Formattazione valuta
|--------------------------------------------------------------------------
*/

function formatCurrency(value) {

    const number = Number(value);


    if (Number.isNaN(number)) {

        return "0,00 €";

    }


    return number.toLocaleString(

        "it-IT",

        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }

    ) + " €";

}


/*
|--------------------------------------------------------------------------
| Formattazione data
|--------------------------------------------------------------------------
*/

function formatDate(value) {

    if (!value) {

        return "";

    }


    if (value instanceof Date) {

        return value.toLocaleDateString(
            "it-IT"
        );

    }


    return String(value);

}