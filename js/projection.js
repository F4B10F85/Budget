"use strict";

/*
|--------------------------------------------------------------------------
| Budget - Projection
|--------------------------------------------------------------------------
| Analisi del portafoglio ordini importato.
|
| ATTENZIONE:
| Le regole definitive di classificazione della proiezione verranno
| costruite successivamente sulla base della logica del file originale.
|
| In questa fase analizziamo esclusivamente i dati presenti nell'Excel.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

function normalizeText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .trim()
        .toUpperCase();

}


/*
|--------------------------------------------------------------------------
| Totale valore portafoglio
|--------------------------------------------------------------------------
*/

function calculateBacklogTotal() {

    return budgetData.extraction.reduce(
        (total, row) => total + row.valore,
        0
    );

}


/*
|--------------------------------------------------------------------------
| Quantità ordinata totale
|--------------------------------------------------------------------------
*/

function calculateOrderedQuantity() {

    return budgetData.extraction.reduce(
        (total, row) => total + row.quantitaOrdinata,
        0
    );

}


/*
|--------------------------------------------------------------------------
| Quantità a saldo totale
|--------------------------------------------------------------------------
*/

function calculateBacklogQuantity() {

    return budgetData.extraction.reduce(
        (total, row) => total + row.quantitaSaldo,
        0
    );

}


/*
|--------------------------------------------------------------------------
| Valori distinti
|--------------------------------------------------------------------------
*/

function getDistinctValues(field) {

    const values = new Set();

    budgetData.extraction.forEach(row => {

        const value = row[field];

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {

            values.add(String(value).trim());

        }

    });

    return [...values];

}


/*
|--------------------------------------------------------------------------
| Conteggio per campo
|--------------------------------------------------------------------------
*/

function countByField(field) {

    const result = {};

    budgetData.extraction.forEach(row => {

        let value = row[field];

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {

            value = "VUOTO";

        } else {

            value = String(value).trim();

        }

        if (!result[value]) {

            result[value] = {
                righe: 0,
                quantita: 0,
                valore: 0
            };

        }

        result[value].righe += 1;

        result[value].quantita += row.quantitaSaldo;

        result[value].valore += row.valore;

    });

    return result;

}


/*
|--------------------------------------------------------------------------
| Aggregazione per mese di consegna
|--------------------------------------------------------------------------
*/

function aggregateByDeliveryMonth() {

    const result = {};

    budgetData.extraction.forEach(row => {

        if (!row.dataConsegna) {
            return;
        }

        const date = row.dataConsegna;

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const key = `${year}-${month}`;

        if (!result[key]) {

            result[key] = {
                anno: year,
                mese: date.getMonth() + 1,
                righe: 0,
                quantita: 0,
                valore: 0
            };

        }

        result[key].righe += 1;

        result[key].quantita += row.quantitaSaldo;

        result[key].valore += row.valore;

    });

    return result;

}


/*
|--------------------------------------------------------------------------
| Analisi completa del portafoglio
|--------------------------------------------------------------------------
*/

function analyzePortfolio() {

    const extraction =
        budgetData.extraction;


    const analysis = {

        totale: {

            righe:
                extraction.length,

            quantitaOrdinata:
                calculateOrderedQuantity(),

            quantitaSaldo:
                calculateBacklogQuantity(),

            valore:
                calculateBacklogTotal()

        },


        distinti: {

            clienti:
                getDistinctValues("cliente").length,

            articoli:
                getDistinctValues("articolo").length,

            famiglie:
                getDistinctValues("famiglia").length,

            linee:
                getDistinctValues("linea").length,

            stati:
                getDistinctValues("stato").length,

            blocchi:
                getDistinctValues("bloccaEvasione").length

        },


        perFamiglia:
            countByField("famiglia"),


        perLinea:
            countByField("linea"),


        perStato:
            countByField("stato"),


        perBlocco:
            countByField("bloccaEvasione"),


        perDivisione:
            countByField("divisione"),


        perMese:
            aggregateByDeliveryMonth()

    };


    console.log(
        "===== ANALISI PORTAFOGLIO ====="
    );

    console.log(
        "Totale:",
        analysis.totale
    );

    console.log(
        "Clienti distinti:",
        analysis.distinti.clienti
    );

    console.log(
        "Articoli distinti:",
        analysis.distinti.articoli
    );

    console.log(
        "Famiglie distinte:",
        analysis.distinti.famiglie
    );

    console.log(
        "Per famiglia:",
        analysis.perFamiglia
    );

    console.log(
        "Per stato:",
        analysis.perStato
    );

    console.log(
        "Per blocco:",
        analysis.perBlocco
    );

    console.log(
        "Per mese:",
        analysis.perMese
    );


    return analysis;

}