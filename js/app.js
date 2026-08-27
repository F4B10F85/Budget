"use strict";

/*
|--------------------------------------------------------------------------
| Budget - Application
|--------------------------------------------------------------------------
*/


document.addEventListener("DOMContentLoaded", () => {

    initializeApplication();

});


function initializeApplication() {

    initializeNavigation();

    initializeImportButtons();

    initializeBudgetForm();

    initializeMonthSelector();

    initializeExcelImport();

    console.log("Budget inizializzato.");

}


/*
|--------------------------------------------------------------------------
| NAVIGAZIONE
|--------------------------------------------------------------------------
*/

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const section =
                item.dataset.section;

            showSection(section);

        });

    });


    const internalLinks =
        document.querySelectorAll(
            "[data-section-target]"
        );


    internalLinks.forEach(button => {

        button.addEventListener("click", () => {

            showSection(
                button.dataset.sectionTarget
            );

        });

    });

}


function showSection(sectionName) {

    const sections =
        document.querySelectorAll(".app-section");


    sections.forEach(section => {

        section.classList.remove("active");

    });


    const target =
        document.getElementById(
            `section-${sectionName}`
        );


    if (target) {

        target.classList.add("active");

    }


    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );

    });


    updatePageHeader(sectionName);

}


/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

function updatePageHeader(sectionName) {

    const titles = {

        dashboard: [
            "Dashboard",
            "Situazione e proiezione del fatturato"
        ],

        movements: [
            "Movimenti",
            "DDT, fatture e note di credito"
        ],

        portfolio: [
            "Portafoglio",
            "Ordini ancora aperti"
        ],

        budget: [
            "Budget",
            "Obiettivi mensili di fatturato"
        ],

        analysis: [
            "Analisi",
            "Andamento e approfondimenti"
        ],

        settings: [
            "Impostazioni",
            "Configurazione del sistema"
        ]

    };


    const data =
        titles[sectionName];


    if (!data) {
        return;
    }


    const title =
        document.getElementById("page-title");


    const subtitle =
        document.getElementById("page-subtitle");


    if (title) {
        title.textContent = data[0];
    }


    if (subtitle) {
        subtitle.textContent = data[1];
    }

}


/*
|--------------------------------------------------------------------------
| IMPORTAZIONE
|--------------------------------------------------------------------------
*/

function initializeImportButtons() {

    const fileInput =
        document.getElementById("excel-file");


    const buttons = [

        document.getElementById(
            "import-button"
        ),

        document.getElementById(
            "portfolio-import-button"
        )

    ];


    buttons.forEach(button => {

        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                fileInput?.click();

            }
        );

    });

}


/*
|--------------------------------------------------------------------------
| BUDGET
|--------------------------------------------------------------------------
*/

function initializeBudgetForm() {

    const saveButton =
        document.getElementById(
            "save-budget-button"
        );


    const monthInput =
        document.getElementById(
            "budget-month"
        );


    const valueInput =
        document.getElementById(
            "budget-value"
        );


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        () => {

            const month =
                monthInput.value;


            const value =
                Number(valueInput.value);


            if (
                !month ||
                Number.isNaN(value) ||
                value < 0
            ) {

                alert(
                    "Inserisci un valore di budget valido."
                );

                return;

            }


            saveMonthlyBudget(
                month,
                value
            );

        }
    );


    const editButton =
        document.getElementById(
            "edit-budget-button"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                showSection("budget");

                monthInput.focus();

            }
        );

    }

}


function saveMonthlyBudget(
    month,
    value
) {

    const budget =
        getStoredBudgets();


    budget[month] =
        value;


    localStorage.setItem(
        "budget-monthly",
        JSON.stringify(budget)
    );


    updateDashboardBudget();


    alert(
        "Budget mensile salvato."
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


function updateDashboardBudget() {

    const month =
        document.getElementById(
            "projection-month"
        )?.value;


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


/*
|--------------------------------------------------------------------------
| MESE
|--------------------------------------------------------------------------
*/

function initializeMonthSelector() {

    const selector =
        document.getElementById(
            "projection-month"
        );


    if (!selector) {
        return;
    }


    selector.addEventListener(
        "change",
        () => {

            updateDashboardBudget();

        }
    );


    updateDashboardBudget();

}


/*
|--------------------------------------------------------------------------
| METRICHE
|--------------------------------------------------------------------------
*/

function updateDashboardMetrics() {

    const budget =
        getCurrentBudget();


    const realized =
        0;


    const projection =
        0;


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


function getCurrentBudget() {

    const month =
        document.getElementById(
            "projection-month"
        )?.value;


    const budgets =
        getStoredBudgets();


    return Number(
        budgets[month] || 0
    );

}


/*
|--------------------------------------------------------------------------
| UTILITY
|--------------------------------------------------------------------------
*/

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function formatCurrency(value) {

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


function formatSignedCurrency(value) {

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