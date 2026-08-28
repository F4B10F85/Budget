"use strict";

/*
|--------------------------------------------------------------------------
| Budget - UI
|--------------------------------------------------------------------------
*/


function renderImportedOrders() {

    /*
    |--------------------------------------------------------------------------
    | La tabella dettagliata è stata eliminata dalla dashboard.
    |
    | I dati rimangono disponibili in budgetData per il motore
    | di analisi.
    |--------------------------------------------------------------------------
    */

    console.log(
        `Portafoglio disponibile: ${budgetData.extraction.length} righe.`
    );

}


function updateDashboardFromAnalysis(analysis) {

    if (!analysis) {
        return;
    }


    /*
    |--------------------------------------------------------------------------
    | Budget
    |--------------------------------------------------------------------------
    */

    const budget =
        getElement("metric-budget");


    /*
    |--------------------------------------------------------------------------
    | Portafoglio
    |--------------------------------------------------------------------------
    */

    setText(
        "metric-backlog",
        formatCurrency(
            analysis.totale.valore
        )
    );


    setText(
        "metric-backlog-rows",
        analysis.totale.righe.toLocaleString("it-IT")
    );


    setText(
        "metric-backlog-quantity",
        analysis.totale.quantitaSaldo.toLocaleString("it-IT")
    );


    /*
    |--------------------------------------------------------------------------
    | Proiezione
    |--------------------------------------------------------------------------
    */

    const projection =
        analysis.totale.valore;


    setText(
        "metric-projection",
        formatCurrency(projection)
    );


    setText(
        "metric-projection-percent",
        "—"
    );


    /*
    |--------------------------------------------------------------------------
    | Realizzato
    |--------------------------------------------------------------------------
    */

    setText(
        "metric-realized",
        "€ 0,00"
    );


    setText(
        "metric-realized-percent",
        "—"
    );


    /*
    |--------------------------------------------------------------------------
    | Confronto con Budget
    |--------------------------------------------------------------------------
    */

    const budgetValue =
        parseBudgetValue(
            budget?.textContent
        );


    if (budgetValue > 0) {

        const percentage =
            projection /
            budgetValue *
            100;


        setText(
            "metric-projection-percent",
            `${percentage.toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }
            )}%`
        );


        const gap =
            projection -
            budgetValue;


        setText(
            "metric-gap",
            formatSignedCurrency(gap)
        );


        setText(
            "metric-gap-percent",
            `${(
                gap /
                budgetValue *
                100
            ).toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }
            )}%`
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Composizione temporanea
    |--------------------------------------------------------------------------
    */

    setText(
        "projection-invoiced",
        "€ 0,00"
    );


    setText(
        "projection-certain",
        "€ 0,00"
    );


    setText(
        "projection-probable",
        "€ 0,00"
    );


    setText(
        "projection-backlog",
        formatCurrency(projection)
    );


    setText(
        "projection-total",
        formatCurrency(projection)
    );

}


/*
|--------------------------------------------------------------------------
| Utility DOM
|--------------------------------------------------------------------------
*/

function getElement(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent = value;

    }

}


/*
|--------------------------------------------------------------------------
| Formattazione valuta
|--------------------------------------------------------------------------
*/

function formatCurrency(value) {

    const number = Number(value);


    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {

        return "€ 0,00";

    }


    return number.toLocaleString(
        "it-IT",
        {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function formatSignedCurrency(value) {

    const number = Number(value);


    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {

        return "€ 0,00";

    }


    if (number >= 0) {

        return `+ ${formatCurrency(number)}`;

    }


    return `- ${formatCurrency(
        Math.abs(number)
    )}`;

}


function parseBudgetValue(text) {

    if (!text) {

        return 0;

    }


    return Number(
        text
            .replace(/[^\d,-]/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
    ) || 0;

}