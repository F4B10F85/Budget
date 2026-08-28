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

    fiseValue: 0,

    unblockedValue: 0,

    blockedItalyValue: 0,

    blockedForeignValue: 0,

    divisioneSelezionata: "all",

    meseSelezionato: "all",

    sourceFile: null,

    importedAt: null

};


function getDivisionLabel(value) {

    const divisione =
        String(value ?? "").trim();

    if (divisione === "1") {

        return "Kep Italia";

    }

    if (divisione === "2") {

        return "Veredus";

    }

    return "";

}

function getFilteredBudgetRows() {

    const rows =
        Array.isArray(budgetData.extraction)
            ? budgetData.extraction
            : [];


    return rows.filter(row => {

        /*
        |--------------------------------------------------------------------------
        | FILTRO DIVISIONE
        |--------------------------------------------------------------------------
        */

        if (
            budgetData.divisioneSelezionata !== "all"
        ) {

            const divisione =
                String(
                    row.divisione ?? ""
                ).trim();


            if (
                divisione !==
                budgetData.divisioneSelezionata
            ) {

                return false;

            }

        }


        /*
        |--------------------------------------------------------------------------
        | FILTRO MESE
        |--------------------------------------------------------------------------
        |
        | Il mese selezionato rappresenta una DATA LIMITE.
        |
        | Agosto = tutto fino al 31/08
        | Aprile = tutto fino al 30/04
        |
        | Non filtriamo quindi "dentro il mese".
        |--------------------------------------------------------------------------
        */

        if (
            budgetData.meseSelezionato !== "all"
        ) {

            const mese =
                Number(
                    budgetData.meseSelezionato
                );


            const dataConsegna =
                row.dataConsegna;


            if (
                !(dataConsegna instanceof Date) ||
                Number.isNaN(
                    dataConsegna.getTime()
                )
            ) {

                return false;

            }


            const anno =
                dataConsegna.getFullYear();


            const ultimoGiorno =
                new Date(
                    anno,
                    mese,
                    0,
                    23,
                    59,
                    59,
                    999
                );


            if (
                dataConsegna >
                ultimoGiorno
            ) {

                return false;

            }

        }


        return true;

    });

}

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

            budgetData.extraction =
                normalizedRows;

            budgetData.sourceFile =
                file.name;

            budgetData.importedAt =
                new Date();

            processImportedData(file.name);


            /*
            |------------------------------------------------------------------
            | Aggiornamento interfaccia
            |------------------------------------------------------------------
            */

           
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
            toNumber(
                row["Quantità ordinato"]
            ),

        quantitaSaldo:
            toNumber(
                row["Quantità saldo"]
            ),

        linea:
            row["Linea"],

        famiglia:
            row["Famiglia"],

        bloccaEvasione:
            row["BloccaEvasione*"],

        valore:
            toNumber(
                row["ImponibileSaldo"]
            ),

        dataConsegna:
            normalizeDate(
                row["Data consegna"]
            ),

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

function processImportedData(fileName) {

    console.log(
        `Elaborazione del file ${fileName || budgetData.sourceFile} completata.`
    );


    calculateFiseValue();

    calculateUnblockedValue();

    calculateBlockedOrders();

    updateImportSummary();

    renderImportedOrders();

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

/*
|--------------------------------------------------------------------------
| Calcolo F.I.S.E.
|--------------------------------------------------------------------------
|
| Cerca nel campo normalizzato "cliente" tutte le righe la cui
| Ragione sociale originale inizia con "F.I.S.E."
|
| Il valore da sommare è il campo normalizzato "valore",
| derivato dalla colonna Excel "ImponibileSaldo".
|
|--------------------------------------------------------------------------
*/

function calculateFiseValue() {

    const rows =
        getFilteredBudgetRows();

    budgetData.fiseValue = 0;


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        budgetData.fiseValue = 0;

        updateFiseDisplay();

        return;

    }


    let total = 0;

    let matchingRows = 0;


    rows.forEach(row => {

        const cliente =
            String(
                row.cliente ?? ""
            )
            .trim();


        if (!cliente) {

            return;

        }


        if (
            !cliente
                .toUpperCase()
                .startsWith("F.I.S.E.")
        ) {

            return;

        }


        const valore =
            Number(
                row.valore || 0
            );


        if (
            Number.isFinite(valore)
        ) {

            total += valore;

        }


        matchingRows++;

    });


    budgetData.fiseValue =
        total;


    console.log(
        "Righe F.I.S.E. trovate:",
        matchingRows
    );


    console.log(
        "Valore F.I.S.E.:",
        total
    );


    updateFiseDisplay();

}

function parseExcelCurrency(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    let text =
        String(value)
            .trim()
            .replace(/\s/g, "")
            .replace(/€/g, "");


    if (
        text.includes(",")
    ) {

        text =
            text
                .replace(/\./g, "")
                .replace(",", ".");

    }


    const number =
        Number(text);


    return Number.isFinite(number)
        ? number
        : 0;

}


function updateFiseDisplay() {

    const element =
        document.getElementById(
            "automatic-fise"
        );


    if (element) {

        const value =
            Number(
                budgetData.fiseValue || 0
            );


        element.textContent =
            value.toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    if (
        typeof updateProjectionTotals ===
        "function"
    ) {

        updateProjectionTotals();

    }

}

/*
|--------------------------------------------------------------------------
| Calcolo Ordini sbloccati
|--------------------------------------------------------------------------
|
| Cerca tutte le righe in cui:
|
| BloccaEvasione* = "No"
|
| e somma il campo normalizzato "valore",
| derivato da "ImponibileSaldo".
|
|--------------------------------------------------------------------------
*/

function calculateUnblockedValue() {

    const rows =
        getFilteredBudgetRows();

    budgetData.unblockedValue = 0;

    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        updateUnblockedDisplay();

        return;

    }

    let total = 0;
    let matchingRows = 0;

    rows.forEach(row => {

        const bloccaEvasione =
            String(
                row.bloccaEvasione ?? ""
            )
            .trim()
            .toUpperCase();

        if (
            bloccaEvasione !== "NO"
        ) {

            return;

        }

        const valore =
            Number(
                row.valore || 0
            );

        if (
            Number.isFinite(valore)
        ) {

            total += valore;

        }

        matchingRows++;

    });

    budgetData.unblockedValue =
        total;

    console.log(
        "Righe Ordini sbloccati:",
        matchingRows
    );

    console.log(
        "Valore Ordini sbloccati:",
        total
    );

    updateUnblockedDisplay();

}

function calculateBlockedOrders() {

    const rows =
        getFilteredBudgetRows();


    budgetData.blockedItalyValue = 0;

    budgetData.blockedForeignValue = 0;


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        updateBlockedOrdersDisplay();

        return;

    }


    let italyTotal = 0;

    let foreignTotal = 0;


    rows.forEach(row => {

        const bloccaEvasione =
            String(
                row.bloccaEvasione ?? ""
            )
            .trim()
            .toUpperCase();


        /*
        |--------------------------------------------------------------------------
        | Consideriamo soltanto gli ordini BLOCCATI
        |--------------------------------------------------------------------------
        */

        if (
            bloccaEvasione === "NO"
        ) {

            return;

        }


        const valore =
            Number(
                row.valore || 0
            );


        if (
            !Number.isFinite(valore)
        ) {

            return;

        }


        const stato =
            String(
                row.stato ?? ""
            )
            .trim()
            .toUpperCase();


        /*
        |--------------------------------------------------------------------------
        | ITALIA
        |--------------------------------------------------------------------------
        */

        if (
            stato === "ITALIA"
        ) {

            italyTotal += valore;

        }


        /*
        |--------------------------------------------------------------------------
        | ESTERO
        |--------------------------------------------------------------------------
        |
        | Tutto ciò che NON è ITALIA.
        |--------------------------------------------------------------------------
        */

        else {

            foreignTotal += valore;

        }

    });


    budgetData.blockedItalyValue =
        italyTotal;


    budgetData.blockedForeignValue =
        foreignTotal;


    console.log(
        "Ordini bloccati Italia:",
        italyTotal
    );


    console.log(
        "Ordini bloccati Estero:",
        foreignTotal
    );


    updateBlockedOrdersDisplay();

}

function updateBlockedOrdersDisplay() {

    const italyElement =
        document.getElementById(
            "automatic-blocked-italy"
        );


    const foreignElement =
        document.getElementById(
            "automatic-blocked-foreign"
        );


    if (italyElement) {

        italyElement.textContent =
            Number(
                budgetData.blockedItalyValue || 0
            ).toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    if (foreignElement) {

        foreignElement.textContent =
            Number(
                budgetData.blockedForeignValue || 0
            ).toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    if (
        typeof updateProjectionTotals ===
        "function"
    ) {

        updateProjectionTotals();

    }

}

function updateUnblockedDisplay() {

    const element =
        document.getElementById(
            "automatic-unblocked"
        );


    if (element) {

        const value =
            Number(
                budgetData.unblockedValue || 0
            );


        element.textContent =
            value.toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    if (
        typeof updateProjectionTotals ===
        "function"
    ) {

        updateProjectionTotals();

    }

}