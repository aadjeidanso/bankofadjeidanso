document.addEventListener('DOMContentLoaded', function () {
    const mainForm = document.getElementById('main-form');
    const notification = document.getElementById('notification');
    
    const popupBox = document.getElementById('popup-box');
    const popupBoxBoth = document.getElementById('popup-box-both');
    const savingsCHRadioButton = document.getElementById('savings-ch-radio');
    const bothRadioButton = document.getElementById('both-radio');
    const accountType1 = document.getElementById('account-type1');
    const accountType2 = document.getElementById('account-type2');

    const addSingleAccountButton = document.getElementById('add-single-account');
    const addBothAccountsButton = document.getElementById('add-both-accounts');

    let isPopupOpen = false;
    let accounts = [];

    savingsCHRadioButton.addEventListener('change', function () {
        if (this.checked) {
            popupBox.style.display = 'flex'; // Show the single account pop-up box
            isPopupOpen = true;
        }
    });

    bothRadioButton.addEventListener('change', function () {
        if (this.checked) {
            popupBoxBoth.style.display = 'flex'; // Show the both accounts pop-up box
            isPopupOpen = true;
        }
    });

    popupBox.addEventListener('click', function (event) {
        if (event.target === popupBox) {
            popupBox.style.display = 'none'; // Hide the single account pop-up box
            isPopupOpen = false;
        }
    });

    popupBoxBoth.addEventListener('click', function (event) {
        if (event.target === popupBoxBoth) {
            popupBoxBoth.style.display = 'none'; // Hide the both accounts pop-up box
            isPopupOpen = false;
        }
    });

    accountType1.addEventListener('change', function () {
        const selectedValue = accountType1.value;
        for (const option of accountType2.options) {
            option.disabled = option.value === selectedValue;
        }
    });

    accountType2.addEventListener('change', function () {
        const selectedValue = accountType2.value;
        for (const option of accountType1.options) {
            option.disabled = option.value === selectedValue;
        }
    });

    addSingleAccountButton.addEventListener('click', function () {
        const accountType = document.getElementById('account-type').value;
        const firstDeposit = document.getElementById('first-deposit').value;

        if (accountType && firstDeposit) {
            accounts.push({
                type: accountType,
                firstDeposit: firstDeposit
            });

            popupBox.style.display = 'none'; // Hide the pop-up box
            isPopupOpen = false;
        } else {
            alert("Please select an account type and enter a deposit amount.");
        }
    });

    addBothAccountsButton.addEventListener('click', function () {
        const accountType1Value = document.getElementById('account-type1').value;
        const firstDeposit1 = document.getElementById('first-deposit1').value;

        const accountType2Value = document.getElementById('account-type2').value;
        const firstDeposit2 = document.getElementById('first-deposit2').value;

        if (accountType1Value && firstDeposit1 && accountType2Value && firstDeposit2) {
            accounts.push({
                type: accountType1Value,
                firstDeposit: firstDeposit1
            });
            accounts.push({
                type: accountType2Value,
                firstDeposit: firstDeposit2
            });

            popupBoxBoth.style.display = 'none'; // Hide the pop-up box
            isPopupOpen = false;
        } else {
            alert("Please select both account types and enter deposit amounts.");
        }
    });

    mainForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Add Money-Market account by default
        accounts.unshift({
            type: 'money-market',
            firstDeposit: document.getElementById('fd').value
        });

        // Remove any previous accounts fields
        mainForm.querySelectorAll('input[name="accounts"]').forEach(input => input.remove());

        // Append accounts as hidden fields
        accounts.forEach(account => {
            const accountTypeField = document.createElement('input');
            accountTypeField.type = 'hidden';
            accountTypeField.name = 'accounts[]';
            accountTypeField.value = JSON.stringify(account);
            mainForm.appendChild(accountTypeField);
        });

        const formData = new FormData(mainForm);

        fetch('/submit_form', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                notification.style.display = 'block';
                notification.style.color = 'green';
                notification.textContent = data.message;
            } else {
                notification.style.display = 'block';
                notification.style.color = 'red';
                notification.textContent = data.message;
            }
        })
        .catch(error => {
            notification.style.display = 'block';
            notification.style.color = 'red';
            notification.textContent = 'Error occurred while creating account';
        });
    });
});
