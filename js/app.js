"use strict";


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApplication();

    }
);


function initializeApplication() {

    initializeNavigation();

    initializeImportButtons();

    initializeBudgetForm();

    initializeManualValues();

    initializeUnblockedProbability();

    initializeDivisionFilter();

    initializeExcelImport();

    updateDashboardBudget();

    updateAnnualBudgetTotal();

    initializeMonthFilter();

    console.log(
        "Budget inizializzato."
    );

}


/* NAVIGAZIONE */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                showSection(
                    item.dataset.section
                );

            }
        );

    });


    const internalLinks =
        document.querySelectorAll(
            "[data-section-target]"
        );


    internalLinks.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showSection(
                    button.dataset.sectionTarget
                );

            }
        );

    });


    const budgetButton =
        document.getElementById(
            "edit-budget-button"
        );


    if (budgetButton) {

        budgetButton.addEventListener(
            "click",
            () => {

                showSection("budget");

            }
        );

    }

}


function showSection(
    sectionName
) {

    const sections =
        document.querySelectorAll(
            ".app-section"
        );


    sections.forEach(section => {

        section.classList.remove(
            "active"
        );

    });


    const target =
        document.getElementById(
            `section-${sectionName}`
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.section ===
                sectionName
        );

    });


    updatePageHeader(
        sectionName
    );

}


/* HEADER */

function updatePageHeader(
    sectionName
) {

    const titles = {

        dashboard: [
            "Dashboard",
            "Situazione e proiezione del fatturato"
        ],

        budget: [
            "Budget annuale",
            "Obiettivi mensili di fatturato"
        ],

        portfolio: [
            "Portafoglio",
            "Ordini ancora aperti"
        ],

        analysis: [
            "Analisi",
            "Andamento e approfondimenti"
        ]

    };


    const data =
        titles[sectionName];


    if (!data) {
        return;
    }


    const title =
        document.getElementById(
            "page-title"
        );


    const subtitle =
        document.getElementById(
            "page-subtitle"
        );


    if (title) {

        title.textContent =
            data[0];

    }


    if (subtitle) {

        subtitle.textContent =
            data[1];

    }

}


/* IMPORTAZIONE */

function initializeImportButtons() {

    const fileInput =
        document.getElementById(
            "excel-file"
        );

    const importButton =
        document.getElementById(
            "import-button"
        );

    const portfolioImportButton =
        document.getElementById(
            "portfolio-import-button"
        );


    if (!fileInput) {

        console.error(
            "Input Excel #excel-file non trovato."
        );

        return;

    }


    if (importButton) {

        importButton.addEventListener(
            "click",
            function () {

                fileInput.value = "";

                fileInput.click();

            }
        );

    }


    if (portfolioImportButton) {

        portfolioImportButton.addEventListener(
            "click",
            function () {

                fileInput.value = "";

                fileInput.click();

            }
        );

    }

}


/* BUDGET */

function initializeBudgetForm() {

    const saveButton =
        document.getElementById(
            "save-budget-button"
        );


    if (!saveButton) {
        return;
    }


    loadBudgetsIntoForm();


    saveButton.addEventListener(
        "click",
        saveAllBudgets
    );


    const inputs =
        document.querySelectorAll(
            ".budget-month-card input"
        );


    inputs.forEach(input => {

        input.addEventListener(
            "input",
            updateAnnualBudgetTotal
        );

    });

}


function loadBudgetsIntoForm() {

    const budgets =
        getStoredBudgets();


    const inputs =
        document.querySelectorAll(
            ".budget-month-card input"
        );


    inputs.forEach(input => {

        const month =
            input.dataset.month;


        if (
            Object.prototype.hasOwnProperty.call(
                budgets,
                month
            )
        ) {

            input.value =
                budgets[month];

        }

    });

}


function saveAllBudgets() {

    const budgets = {};


    const inputs =
        document.querySelectorAll(
            ".budget-month-card input"
        );


    inputs.forEach(input => {

        const month =
            input.dataset.month;


        const value =
            Number(input.value);


        budgets[month] =
            Number.isFinite(value) &&
            value >= 0
                ? value
                : 0;

    });


    localStorage.setItem(
        "budget-monthly",
        JSON.stringify(budgets)
    );


    updateAnnualBudgetTotal();

    updateDashboardBudget();

    alert(
        "Budget annuale salvato."
    );

}


function getStoredBudgets() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "budget-monthly"
            )
        ) || {};

    } catch (error) {

        console.error(
            "Errore lettura budget:",
            error
        );

        return {};

    }

}


function updateAnnualBudgetTotal() {

    const inputs =
        document.querySelectorAll(
            ".budget-month-card input"
        );


    let total = 0;


    inputs.forEach(input => {

        const value =
            Number(input.value);


        if (
            Number.isFinite(value) &&
            value >= 0
        ) {

            total += value;

        }

    });


    const element =
        document.getElementById(
            "annual-budget-total"
        );


    if (element) {

        element.textContent =
            `Budget annuale: ${formatCurrency(total)}`;

    }

}


function updateDashboardBudget() {

    const month =
        getCurrentMonth();


    const budgets =
        getStoredBudgets();


    const value =
        Number(
            budgets[month] || 0
        );


    const element =
        document.getElementById(
            "dashboard-budget"
        );


    if (element) {

        element.textContent =
            formatCurrency(value);

    }


    updateDashboardMetrics();

}


function getCurrentMonth() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}`;

}


/* METRICHE */

function updateDashboardMetrics(projectionTotal = 0) {

    const budget =
        getStoredBudgets()[
            getCurrentMonth()
        ] || 0;


    const realized =
        Number(projectionTotal) || 0;


    const projection =
        Number(projectionTotal) || 0;


    const gap =
        projection - budget;


    setText(
        "dashboard-realized",
        formatCurrency(realized)
    );


    setText(
        "dashboard-projection",
        formatCurrency(projection)
    );


    setText(
        "dashboard-gap",
        formatSignedCurrency(gap)
    );


    setText(
        "dashboard-realized-percent",
        calculatePercentage(
            realized,
            budget
        )
    );


    setText(
        "dashboard-projection-percent",
        calculatePercentage(
            projection,
            budget
        )
    );


    setText(
        "dashboard-gap-percent",
        calculatePercentage(
            gap,
            budget
        )
    );

}


/* UTILITY */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function formatCurrency(
    value
) {

    const number =
        Number(value);


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


function formatSignedCurrency(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {

        return "€ 0,00";

    }


    if (number > 0) {

        return `+ ${formatCurrency(number)}`;

    }


    if (number < 0) {

        return `- ${formatCurrency(
            Math.abs(number)
        )}`;

    }


    return "€ 0,00";

}


function calculatePercentage(
    value,
    total
) {

    if (!total) {

        return "0,0%";

    }


    return `${(
        value / total * 100
    ).toLocaleString(
        "it-IT",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    )}%`;

}

/* DATI MANUALI */

function initializeManualValues() {

    const ddtField =
        document.getElementById("manual-ddt");

    const creditNotesField =
        document.getElementById("manual-credit-notes");


    /*
    |--------------------------------------------------------------------------
    | RESET INIZIALE
    |--------------------------------------------------------------------------
    |
    | DDT Emessi e Note di credito sono valori temporanei.
    |
    | Ad ogni caricamento della pagina partono da zero
    | e NON vengono recuperati dal localStorage.
    |
    |--------------------------------------------------------------------------
    */

    if (ddtField) {

        ddtField.value = "";

    }


    if (creditNotesField) {

        creditNotesField.value = "";

    }


    /*
    |--------------------------------------------------------------------------
    | DDT EMESSI
    |--------------------------------------------------------------------------
    */

    if (ddtField) {

        ddtField.addEventListener(
            "input",
            function () {

                updateProjectionTotals();

            }
        );


        ddtField.addEventListener(
            "blur",
            function () {

                const value =
                    parseInputCurrency(
                        ddtField.value
                    );


                ddtField.value =
                    value > 0
                        ? formatInputCurrency(value)
                        : "";


                updateProjectionTotals();

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | NOTE DI CREDITO
    |--------------------------------------------------------------------------
    */

    if (creditNotesField) {

        creditNotesField.addEventListener(
            "input",
            function () {

                updateProjectionTotals();

            }
        );


        creditNotesField.addEventListener(
            "blur",
            function () {

                const value =
                    parseInputCurrency(
                        creditNotesField.value
                    );


                creditNotesField.value =
                    value > 0
                        ? formatInputCurrency(value)
                        : "";


                updateProjectionTotals();

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | CALCOLO INIZIALE
    |--------------------------------------------------------------------------
    */

    updateProjectionTotals();

}

function updateProjectionTotals() {

    /*
    |--------------------------------------------------------------------------
    | VALORI MANUALI
    |--------------------------------------------------------------------------
    */

    const ddtField =
        document.getElementById(
            "manual-ddt"
        );


    const creditNotesField =
        document.getElementById(
            "manual-credit-notes"
        );


    const ddt =
        parseInputCurrency(
            ddtField
                ? ddtField.value
                : ""
        );


    const creditNotes =
        parseInputCurrency(
            creditNotesField
                ? creditNotesField.value
                : ""
        );


    /*
    |--------------------------------------------------------------------------
    | F.I.S.E.
    |--------------------------------------------------------------------------
    */

    const fise =
        Number(
            budgetData.fiseValue || 0
        );


    /*
    |--------------------------------------------------------------------------
    | ORDINI SBLOCCATI
    |--------------------------------------------------------------------------
    */

    const unblocked =
        Number(
            budgetData.unblockedValue || 0
        );


    const unblockedProbabilityField =
        document.getElementById(
            "unblocked-probability"
        );


    const unblockedProbability =
        parseProbability(
            unblockedProbabilityField
                ? unblockedProbabilityField.value
                : ""
        );


    const unblockedProjected =
        unblocked *
        (
            unblockedProbability / 100
        );


    /*
    |--------------------------------------------------------------------------
    | ORDINI BLOCCATI ITALIA
    |--------------------------------------------------------------------------
    */

    const blockedItaly =
        Number(
            budgetData.blockedItalyValue || 0
        );


    const blockedItalyProbabilityField =
        document.getElementById(
            "blocked-italy-probability"
        );


    const blockedItalyProbability =
        parseProbability(
            blockedItalyProbabilityField
                ? blockedItalyProbabilityField.value
                : ""
        );


    const blockedItalyProjected =
        blockedItaly *
        (
            blockedItalyProbability / 100
        );


    /*
    |--------------------------------------------------------------------------
    | ORDINI BLOCCATI ESTERO
    |--------------------------------------------------------------------------
    */

    const blockedForeign =
        Number(
            budgetData.blockedForeignValue || 0
        );


    const blockedForeignProbabilityField =
        document.getElementById(
            "blocked-foreign-probability"
        );


    const blockedForeignProbability =
        parseProbability(
            blockedForeignProbabilityField
                ? blockedForeignProbabilityField.value
                : ""
        );


    const blockedForeignProjected =
        blockedForeign *
        (
            blockedForeignProbability / 100
        );


    /*
    |--------------------------------------------------------------------------
    | ALTRE COMPONENTI
    |--------------------------------------------------------------------------
    */

    const certain =
        getProjectionValue(
            "projection-certain"
        );


    const probable =
        getProjectionValue(
            "projection-probable"
        );


    const portfolio =
        getProjectionValue(
            "projection-portfolio"
        );


    const backlog =
        getProjectionValue(
            "projection-backlog"
        );


    /*
    |--------------------------------------------------------------------------
    | TOTALE
    |--------------------------------------------------------------------------
    */

    const total =
        ddt
        - creditNotes
        - fise
        + unblockedProjected
        + blockedItalyProjected
        + blockedForeignProjected
        + certain
        + probable
        + portfolio
        + backlog;


    /*
    |--------------------------------------------------------------------------
    | AGGIORNA TOTALE
    |--------------------------------------------------------------------------
    */

    setText(
        "projection-total",
        formatCurrency(total)
    );


    /*
    |--------------------------------------------------------------------------
    | AGGIORNA DASHBOARD
    |--------------------------------------------------------------------------
    */

    updateDashboardMetrics(
        total
    );

}

function getStoredManualValues() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "budget-manual-values"
            )
        ) || {};

    } catch (error) {

        console.error(
            "Errore lettura dati manuali:",
            error
        );

        return {};

    }

}

function saveManualValuesDirectly() {

    /*
    |--------------------------------------------------------------------------
    | DDT e Note di credito sono valori temporanei.
    |
    | NON vengono salvati nel localStorage.
    | Rimangono validi solo durante la sessione corrente.
    |--------------------------------------------------------------------------
    */

    updateProjectionTotals();

}

function getInputNumber(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return 0;

    }


    const value =
        Number(
            element.value
        );


    if (
        !Number.isFinite(value) ||
        value < 0
    ) {

        return 0;

    }


    return value;

}



function getProjectionValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return 0;

    }


    const value =
        element.dataset.value;


    if (
        value === undefined ||
        value === null
    ) {

        return 0;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}

function parseInputCurrency(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return 0;

    }


    let text =
        String(value)
            .trim()
            .replace(/\s/g, "")
            .replace(/€/g, "");


    /*
     * Gestione formato italiano:
     *
     * 12.500,50
     * 12500,50
     * 12500.50
     */

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


    if (
        !Number.isFinite(number) ||
        number < 0
    ) {

        return 0;

    }


    return number;

}

function formatInputCurrency(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {

        return "";

    }


    return number.toLocaleString(
        "it-IT",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}

function formatManualInput(input) {

    let value =
        input.value;


    /*
     * Manteniamo soltanto numeri,
     * punto e virgola.
     */

    value =
        value.replace(
            /[^\d.,]/g,
            ""
        );


    if (!value) {

        input.value = "";

        return;

    }


    /*
     * Se l'utente sta scrivendo la parte
     * decimale, la conserviamo.
     */

    const hasComma =
        value.includes(",");


    let integerPart =
        value.split(",")[0];


    let decimalPart =
        hasComma
            ? value.split(",").slice(1).join("")
            : "";


    /*
     * Il punto viene considerato come
     * separatore delle migliaia.
     */

    integerPart =
        integerPart.replace(
            /\./g,
            ""
        );


    integerPart =
        integerPart.replace(
            /^0+(?=\d)/,
            ""
        );


    if (!integerPart) {

        integerPart = "0";

    }


    /*
     * Formattazione delle migliaia.
     */

    const formattedInteger =
        Number(integerPart)
            .toLocaleString(
                "it-IT"
            );


    if (hasComma) {

        decimalPart =
            decimalPart
                .replace(
                    /[^\d]/g,
                    ""
                )
                .slice(0, 2);


        input.value =
            `${formattedInteger},${decimalPart}`;

    } else {

        input.value =
            formattedInteger;

    }

}

function initializeUnblockedProbability() {

    const field =
        document.getElementById(
            "unblocked-probability"
        );


    if (!field) {

        return;

    }


    const stored =
        localStorage.getItem(
            "budget-unblocked-probability"
        );


    if (stored !== null) {

        field.value =
            `${stored}%`;

    }


    field.addEventListener(
        "input",
        () => {

            let value =
                field.value
                    .replace("%", "")
                    .replace(",", ".")
                    .replace(/[^\d.]/g, "");


            if (value === "") {

                field.value = "";

                saveUnblockedProbability();

                updateProjectionTotals();

                return;

            }


            let number =
                Number(value);


            if (!Number.isFinite(number)) {

                field.value = "";

                return;

            }


            number =
                Math.min(
                    100,
                    Math.max(
                        0,
                        number
                    )
                );


            field.value =
                `${number}%`;


            saveUnblockedProbability();

            updateProjectionTotals();

        }
    );


    field.addEventListener(
        "blur",
        () => {

            const value =
                parseProbability(
                    field.value
                );


            field.value =
                `${value}%`;


            saveUnblockedProbability();

            updateProjectionTotals();

        }
    );

}

function parseProbability(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(
            String(value)
                .replace("%", "")
                .replace(",", ".")
                .trim()
        );


    if (!Number.isFinite(number)) {

        return 0;

    }


    return Math.min(
        100,
        Math.max(
            0,
            number
        )
    );

}

function saveUnblockedProbability() {

    const field =
        document.getElementById(
            "unblocked-probability"
        );


    if (!field) {

        return;

    }


    const value =
        parseProbability(
            field.value
        );


    localStorage.setItem(
        "budget-unblocked-probability",
        value
    );

}

function initializeDivisionFilter() {

    const field =
        document.getElementById(
            "division-filter"
        );


    if (!field) {

        return;

    }


    field.value =
        budgetData.divisioneSelezionata;


    field.addEventListener(
        "change",
        () => {

            budgetData.divisioneSelezionata =
                field.value;


            console.log(
                "Divisione selezionata:",
                field.value
            );


            calculateFiseValue();

            calculateUnblockedValue();

            updateProjectionTotals();

        }
    );

}

function initializeMonthFilter() {

    const monthField =
        document.getElementById(
            "month-filter"
        );


    if (!monthField) {

        return;

    }


    monthField.value =
        budgetData.meseSelezionato;


    monthField.addEventListener(
        "change",
        function () {

            budgetData.meseSelezionato =
                monthField.value;


            console.log(
                "Mese selezionato:",
                budgetData.meseSelezionato
            );


            /*
            |--------------------------------------------------------------------------
            | Ricalcolo completo
            |--------------------------------------------------------------------------
            */

            calculateFiseValue();

            calculateUnblockedValue();

            calculateBlockedOrders();

            updateProjectionTotals();

        }
    );

}