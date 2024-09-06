document.addEventListener("DOMContentLoaded", function () {
    
    // Fetch and display the user's first name
    fetch('/getUserFirstName')
        .then(response => response.json())
        .then(data => {
            if (data.firstName) {
                document.getElementById('userFirstName').innerText = data.firstName.toUpperCase();
            }
        })
        .catch(error => console.error('Error:', error));

    // Fetch and display the user's account cards
    fetch('/getUserAccounts')
        .then(response => response.json())
        .then(accounts => {
            const accountCardsContainer = document.getElementById('account-cards-container');
            accountCardsContainer.innerHTML = ''; // Clear any existing content

            accounts.forEach(account => {
                const accountType = account.type.charAt(0).toUpperCase() + account.type.slice(1) + ' Account Activity';
                const balance = `$${account.firstDeposit.toFixed(2)}`;

                const accountCardHTML = `
                    <div class="account-card">
                        <h3>${accountType.toUpperCase()}</h3>
                        <p class="balance">${balance}</p>
                        <p class="label">AVAILABLE BALANCE</p>
                        <button class="view-account-btn">VIEW ACCOUNT</button>
                    </div>
                `;

                accountCardsContainer.insertAdjacentHTML('beforeend', accountCardHTML);
            });

             // Add event listener to each "View Account" button
        const viewAccountButtons = document.querySelectorAll('.view-account-btn');
        viewAccountButtons.forEach((button, index) => {
            button.addEventListener('click', function () {
                toggleAccountActivity(accounts[index].type);
                showAccountActivity();  // Ensure the account activity section is displayed
            });
        });

        })
        .catch(error => console.error('Error:', error));

    function hideAllSections() {
        // Hide all sections
        document.getElementById('account-overview').style.display = 'none';
        document.getElementById('manage-profile').style.display = 'none';
        document.getElementById('make-transfer').style.display = 'none';
        document.getElementById('deposit-money').style.display = 'none';
        document.getElementById('shopping-section').style.display = 'none';
        document.getElementById('pay-bill').style.display = 'none';
         document.getElementById('monthly-statement').style.display = 'none';
        document.getElementById('view-transfers').style.display = 'none';
        document.getElementById('account-activity').style.display = 'none';
         document.getElementById('view-bills').style.display = 'none';
    }

    // Function to show the user profile section
    function showUserProfile() {
        hideAllSections();  // Hide all other sections first
        document.getElementById('manage-profile').style.display = 'block';

        fetch('/getUserProfile')
            .then(response => response.json())
            .then(data => {
                // Populate profile form with user's data
                document.getElementById('username').value = data.username;
                document.getElementById('password').value = data.password;
                document.getElementById('fullName').value = data.fullName;
                document.getElementById('address').value = data.address;
                document.getElementById('city').value = data.city;
                document.getElementById('state').value = data.state;
                document.getElementById('zip').value = data.zipCode;
            })
            .catch(error => console.error('Error:', error));
    }

    // Function to show the shopping section
    function showShopping() {
        hideAllSections();  // Hide all other sections first
        document.getElementById('shopping-section').style.display = 'block';
    }



    // Function to show the monthly statement section
    function showMonthlyStatement() {
        hideAllSections();  // Hide all other sections first
        document.getElementById('monthly-statement').style.display = 'block';

        fetch('/getUserAccounts')
            .then(response => response.json())
            .then(accounts => {
                const accountTypeContainer = document.getElementById('account-type-buttons');
                accountTypeContainer.innerHTML = '';  // Clear any existing buttons

                accounts.forEach(account => {
                    const accountButton = document.createElement('button');
                    accountButton.className = 'account-button';
                    accountButton.textContent = account.type.charAt(0).toUpperCase() + account.type.slice(1);
                    accountTypeContainer.appendChild(accountButton);

                    // Optionally, add event listeners to these buttons to show the respective statements
                    accountButton.addEventListener('click', function () {
                        // Logic to fetch and display the statements for the selected account type
                        displayAccountStatement(account.type);
                    });
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Event listener for Profile link in the header dropdown
    document.getElementById("profile-link").addEventListener("click", function (e) {
        e.preventDefault();
        showUserProfile();
    });

    // Event listener for USER PROFILE link in the sidebar
    document.getElementById("sidebar-profile-link").addEventListener("click", function (e) {
        e.preventDefault();
        showUserProfile();
    });


    // Event listener for Deposit Money link in the sidebar
    document.getElementById("deposit-money-link").addEventListener("click", function (e) {
        e.preventDefault();
        showDepositMoney();
    });

    // Event listener for Shopping link in the sidebar
    document.getElementById("shopping-link").addEventListener("click", function (e) {
        e.preventDefault();
        showShopping();
    });



    // Event listener for Monthly Statement link in the sidebar
    document.getElementById("monthly-statement-link").addEventListener("click", function (e) {
        e.preventDefault();
        showMonthlyStatement();
    });

function showAccountActivity() {
    hideAllSections();  // Hide all other sections first
    document.getElementById('account-activity').style.display = 'block';

    // Add event listeners for each button
    document.getElementById('checking-button').addEventListener('click', function() {
        toggleAccountActivity('checking');
    });

    document.getElementById('savings-button').addEventListener('click', function() {
        toggleAccountActivity('savings');
    });

    document.getElementById('money-market-button').addEventListener('click', function() {
        toggleAccountActivity('money-market');
    });
}


function toggleAccountActivity(accountType) {
    const activityTableBody = document.querySelector('#activity-table tbody');
    activityTableBody.innerHTML = '';  // Clear existing rows

    // Fetch account activity data
    fetch(`/getAccountActivity?accountType=${accountType}`)
        .then(response => response.json())
        .then(activities => {
            let accountOpeningIncluded = false;

            activities.forEach(activity => {
                if (activity.description === 'Account Opening') {
                    accountOpeningIncluded = true;  // Mark that the account opening entry is included
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${activity._id}</td>
                    <td>${new Date(activity.date).toLocaleDateString()}</td>
                    <td>${activity.description}</td>
                    <td>$${activity.amount.toFixed(2)}</td>
                    <td>$${activity.balance.toFixed(2)}</td>
                    <td><button class="delete-btn" ${activity.description === 'Account Opening' ? 'disabled' : ''}>Delete</button></td>
                `;
                activityTableBody.appendChild(row);
            });

            // Only append the account opening entry if it wasn't already included
            if (!accountOpeningIncluded && activities.length > 0) {
                const initialDepositRow = document.createElement('tr');
                const account = activities[0]; // Assuming activities are sorted by date
                initialDepositRow.innerHTML = `
                    <td>${account._id}</td>
                    <td>${new Date(account.date).toLocaleDateString()}</td>
                    <td>Account Opening</td>
                    <td>$${account.amount.toFixed(2)}</td>
                    <td>$${account.balance.toFixed(2)}</td>
                    <td><button class="delete-btn" disabled>Delete</button></td>
                `;
                activityTableBody.appendChild(initialDepositRow); 
            }

            document.getElementById('activity-table').style.display = 'table';
        })
        .catch(error => console.error('Error fetching account activity:', error));
}

// Ensure this function is linked to the corresponding sidebar link
document.getElementById("account-activity-link").addEventListener("click", function (e) {
    e.preventDefault();
    showAccountActivity();
});


document.getElementById("view-account-routing-link").addEventListener("click", function (e) {
    e.preventDefault();

    const modal = document.getElementById('account-routing-modal');
    const accountRoutingInfo = document.getElementById('account-routing-info');

    // Fetch the user's account and routing numbers from the server
    fetch('/getUserAccounts')
        .then(response => response.json())
        .then(accounts => {
            const accountDetails = accounts.map(account => 
                `<p><strong>${account.type.toUpperCase()}</strong>:<br> 
                Account Number: ${account.accountNumber}<br>
                Routing Number: ${account.routingNumber}</p>`
            ).join('<br>');

            accountRoutingInfo.innerHTML = accountDetails;
            modal.style.display = "block";
        })
        .catch(error => console.error('Error fetching account/routing numbers:', error));
});

// Close the modal
document.getElementById("close-account-routing-modal").addEventListener("click", function () {
    document.getElementById('account-routing-modal').style.display = 'none';
});

   
 // Function to show the deposit money section
function showDepositMoney() {
        hideAllSections();  // Hide all other sections first
        
        document.getElementById('cancel-deposit').addEventListener('click', function () {
    document.getElementById('deposit-form').reset();
});

        document.getElementById('deposit-money').style.display = 'block';

        fetch('/getUserAccounts')
            .then(response => response.json())
            .then(accounts => {
                const depositToSelect = document.getElementById('deposit-to');
                depositToSelect.innerHTML = '<option value="" disabled selected>Select Account</option>';

                accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.type;
                    option.text = `${account.type.charAt(0).toUpperCase() + account.type.slice(1)} - $${account.firstDeposit.toFixed(2)}`;
                    depositToSelect.appendChild(option);
                });

                document.getElementById('deposit-form').addEventListener('submit', function (e) {
                    e.preventDefault();

                    const depositTo = depositToSelect.value;
                    const depositAmount = document.getElementById('deposit-amount').value;

                    fetch('/makeDeposit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ depositTo, depositAmount })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Update the account card
                                updateAccountCard(data.updatedAccount);

                                // Add the deposit to the account activity table
                                addAccountActivity(data.newActivity);

                                alert('Deposit successful!');
                            } else {
                                alert('Failed to process deposit: ' + data.error);
                            }
                            
                        })
                        .catch(error => console.error('Error:', error));
                });
            })
            .catch(error => console.error('Error:', error));
    }




    
    function addAccountActivity(activity) {
        const activityTableBody = document.querySelector('#activity-table tbody');
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${activity._id}</td>
            <td>${new Date(activity.date).toLocaleDateString()}</td>
            <td>${activity.description}</td>
            <td>$${activity.amount.toFixed(2)}</td>
            <td>$${activity.balance.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteActivity('${activity._id}', this)" ${activity.description === 'Account Opening' ? 'disabled' : ''}>Delete</button></td>
        `;

        // Insert the new row at the top of the table (before the Account Opening row)
        activityTableBody.insertBefore(newRow, activityTableBody.firstChild);

        // Show the table if it's hidden
        document.getElementById('activity-table').style.display = 'table';
    }

    // Function to delete an account activity
    function deleteActivity(activityId, buttonElement) {
        fetch(`/deleteAccountActivity/${activityId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the row from the table
                const row = buttonElement.parentElement.parentElement;
                row.remove();
            } else {
                alert('Failed to delete activity: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }


 function addAccountActivity(account, description, amount) {
     const activityTableBody = document.querySelector('#activity-table tbody');
     
     // Create a new row for the deposit
     const newRow = document.createElement('tr');
     newRow.innerHTML = `
         <td>${Math.floor(100000 + Math.random() * 900000)}</td>
         <td>${new Date().toLocaleDateString()}</td>
         <td>${description}</td>
         <td>$${parseFloat(amount).toFixed(2)}</td>
         <td>$${account.firstDeposit.toFixed(2)}</td>
         <td><button class="delete-btn">Delete</button></td>
     `;

     // Insert the new row at the top of the table (before the Account Opening row)
     activityTableBody.insertBefore(newRow, activityTableBody.firstChild);

     // Show the table if it's hidden
     document.getElementById('activity-table').style.display = 'table';
 }

 
document.getElementById('shopping-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting the traditional way
    
    // Calculate the total price of selected items
    let totalPrice = 0;
    const checkboxes = document.querySelectorAll('#shopping-form input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const priceText = checkbox.nextElementSibling.innerText;
        const price = parseFloat(priceText.replace('$', ''));
        totalPrice += price;
    });
    

    // Update the checking account balance
    fetch('/updateCheckingBalance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ totalPrice })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the account card with the new balance
            const checkingCard = document.querySelector('.account-card h3:contains("Checking Account Activity")').closest('.account-card');
            const balanceElement = checkingCard.querySelector('.balance');
            balanceElement.textContent = `$${data.newBalance.toFixed(2)}`;
            
            alert('Shopping completed! Your balance has been updated.'); 
        } else {
            alert('Failed to update balance: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});


    function addShoppingActivity(activity) {
    const activityTableBody = document.querySelector('#activity-table tbody');
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${activity._id}</td>
        <td>${new Date(activity.date).toLocaleDateString()}</td>
        <td>${activity.description}</td>
        <td>$${activity.amount.toFixed(2)}</td>
        <td>$${activity.balance.toFixed(2)}</td>
        <td><button class="delete-btn" onclick="deleteActivity('${activity._id}', this)">Delete</button></td>
    `;

    // Insert the new row at the top of the table
    activityTableBody.insertBefore(newRow, activityTableBody.firstChild);
    
    // Show the table if it's hidden
    document.getElementById('activity-table').style.display = 'table';
}


document.getElementById("make-transfer-link").addEventListener("click", function (e) {
    e.preventDefault();
    showMakeTransfer();
});

function showMakeTransfer() {
    hideAllSections();  // Hide all other sections first
    document.getElementById('make-transfer').style.display = 'block';

    fetch('/getUserAccounts')
        .then(response => response.json())
        .then(accounts => {
            const transferFromSelect = document.getElementById('transfer-from');
            const transferToSelect = document.getElementById('transfer-to');

            transferFromSelect.innerHTML = '<option value="" disabled selected>Select Account</option>';
            transferToSelect.innerHTML = '<option value="" disabled selected>Select Account</option>';

            accounts.forEach(account => {
                const optionFrom = document.createElement('option');
                optionFrom.value = account.type;
                optionFrom.text = `${account.type.charAt(0).toUpperCase() + account.type.slice(1)} - $${account.firstDeposit.toFixed(2)}`;
                transferFromSelect.appendChild(optionFrom);

                const optionTo = document.createElement('option');
                optionTo.value = account.type;
                optionTo.text = `${account.type.charAt(0).toUpperCase() + account.type.slice(1)} - $${account.firstDeposit.toFixed(2)}`;
                transferToSelect.appendChild(optionTo);
            });

            if (accounts.length === 1) {
                const optionOther = document.createElement('option');
                optionOther.value = 'other';
                optionOther.text = 'Other';
                transferToSelect.appendChild(optionOther);
            }

            transferFromSelect.addEventListener('change', function() {
                const selectedValue = this.value;
                Array.from(transferToSelect.options).forEach(option => {
                    if (option.value === selectedValue) {
                        option.disabled = true;
                    } else {
                        option.disabled = false;
                    }
                });
                transferToSelect.selectedIndex = 0; // Reset "Transfer To" dropdown
            });

            document.getElementById('transfer-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const transferFrom = transferFromSelect.value;
    const transferTo = transferToSelect.value;
    const amount = document.getElementById('trans-amount').value;

    console.log('Form Data:', { transferFrom, transferTo, amount });

    fetch('/makeTransfer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transferFrom, transferTo, amount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the account cards
            updateAccountCard(data.updatedFromAccount);
            updateAccountCard(data.updatedToAccount);

            alert('Transfer successful!');
        } else {
            alert('Failed to process transfer: ' + data.error);
        }
    })
    .catch(error => console.error('Error:', error));
});
document.getElementById('cancel-transfer').addEventListener('click', function () {
    document.getElementById('transfer-form').reset();
});

        })
        .catch(error => console.error('Error:', error));
}

function updateAccountCard(account) {
    const accountCard = document.querySelector(`.account-card h3:contains("${account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account Activity")`).closest('.account-card');
    const balanceElement = accountCard.querySelector('.balance');
    balanceElement.textContent = `$${account.firstDeposit.toFixed(2)}`;
}


document.getElementById("view-transfers-link").addEventListener("click", function (e) {
    e.preventDefault();
    showViewTransfers();
});


  function handleAccountButtonClick(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.account-button').forEach(btn => btn.classList.remove('active'));

        // Add active class to the clicked button
        button.classList.add('active');
    }



function showViewTransfers() {
    hideAllSections();  // Hide all other sections first
    document.getElementById('view-transfers').style.display = 'block';

    // Fetch and display user's accounts for selection
    fetch('/getUserAccounts')
        .then(response => response.json())
        .then(accounts => {
            const accountButtonsContainer = document.getElementById('account-buttons');
            accountButtonsContainer.innerHTML = '';  // Clear any existing buttons

            accounts.forEach(account => {
                const accountButton = document.createElement('button');
                accountButton.className = 'account-button';
                accountButton.textContent = account.type.charAt(0).toUpperCase() + account.type.slice(1);



                accountButton.addEventListener('click', function () {
                    handleAccountButtonClick(this);
                    fetchTransferRecords(account.type);
                });
                accountButtonsContainer.appendChild(accountButton);
            });
        })
        .catch(error => console.error('Error fetching accounts:', error));
}

function fetchTransferRecords(accountType) {
    fetch(`/getAccountTransfers?accountType=${accountType}`)
        .then(response => response.json())
        .then(transfers => {
            const transfersTableBody = document.querySelector('#transfers-table tbody');
            transfersTableBody.innerHTML = '';  // Clear any existing rows

            transfers.forEach(transfer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transfer._id}</td>
                    <td>${new Date(transfer.date).toLocaleDateString()}</td>
                    <td>${transfer.description}</td>
                    <td>$${transfer.amount.toFixed(2)}</td>
                    <td><button class="delete-btn">Delete</button></td>
                `;
                transfersTableBody.appendChild(row);
            });

            document.getElementById('transfers-table-container').style.display = 'block';
        })
        .catch(error => console.error('Error fetching transfers:', error));
}



//new

// Event listener for PAY BILL link in the sidebar
    document.getElementById("pay-bill-link").addEventListener("click", function (e) {
        e.preventDefault();
        showPayBill();
    });

    // Function to show the PAY BILL section
    function showPayBill() {
        hideAllSections();  // Hide all other sections first


        document.getElementById('pay-bill').style.display = 'block';

        document.getElementById('cancel-bill').addEventListener('click', function () {
    document.getElementById('bill-form').reset();
});


        // Fetch and populate the "Pay From" dropdown with the user's accounts
        fetch('/getUserAccounts')
            .then(response => response.json())
            .then(accounts => {
                const payFromSelect = document.getElementById('pay-from');
                payFromSelect.innerHTML = '<option value="" disabled selected>Select Account</option>';

                accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.type;
                    option.text = `${account.type.charAt(0).toUpperCase() + account.type.slice(1)} - $${account.firstDeposit.toFixed(2)}`;
                    payFromSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching user accounts:', error));
    }

    // Event listener for the "Add Recipient" link
    document.getElementById("add-recipient-link").addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById('add-recipient-modal').style.display = 'block';
    });

    // Close the recipient modal when the close button is clicked
    document.getElementById("close-recipient-modal").addEventListener("click", function () {
        document.getElementById('add-recipient-modal').style.display = 'none';
    });

    // Handle the form submission for adding a recipient
    document.getElementById('recipient-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const recipientName = document.getElementById('recipient-name').value;
        const recipientSelect = document.getElementById('recipient');

        const option = document.createElement('option');
        option.value = recipientName;
        option.text = recipientName;
        recipientSelect.appendChild(option);

        // Close the modal and clear the form
        document.getElementById('add-recipient-modal').style.display = 'none';
        document.getElementById('recipient-form').reset();
    });



    // Event listener for PAY BILL form submission
    document.getElementById('bill-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const payFrom = document.getElementById('pay-from').value;
        const amount = parseFloat(document.getElementById('bill-amount').value);

        if (!payFrom || isNaN(amount)) {
            alert("Please fill out all required fields.");
            return;
        }

        // Perform the payment by sending data to the server
        fetch('/makePayment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payFrom, amount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update the corresponding account card
                updateAccountCard(data.updatedAccount);

                alert('Payment successful!');
            } else {
                alert('Failed to process payment: ' + data.error);
            }
        })
        .catch(error => console.error('Error processing payment:', error));
    });

    function updateAccountCard(updatedAccount) {
        const accountCard = document.querySelector(`.account-card h3:contains("${updatedAccount.type.charAt(0).toUpperCase() + updatedAccount.type.slice(1)} Account Activity")`).closest('.account-card');
        const balanceElement = accountCard.querySelector('.balance');
        balanceElement.textContent = `$${updatedAccount.firstDeposit.toFixed(2)}`;
    }

document.getElementById("view-bills-link").addEventListener("click", function (e) {
    e.preventDefault();
    showViewBills();
});

function showViewBills() {
    hideAllSections();  // Hide all other sections first
    document.getElementById('view-bills').style.display = 'block';

    fetch('/getUserAccounts')
        .then(response => response.json())
        .then(accounts => {
            const accountButtonsContainer = document.getElementById('account-buttons-bills');
            accountButtonsContainer.innerHTML = '';  // Clear any existing buttons

            accounts.forEach(account => {
                const accountButton = document.createElement('button');
                accountButton.className = 'account-button';
                accountButton.textContent = account.type.charAt(0).toUpperCase() + account.type.slice(1);
                accountButton.addEventListener('click', function () {
                    handleAccountButtonClick(this);
                    fetchBillRecords(account.type);
                });
                accountButtonsContainer.appendChild(accountButton);
            });
        })
        .catch(error => console.error('Error fetching accounts:', error));
}

    
function fetchBillRecords(accountType) {
    fetch(`/getAccountBills?accountType=${accountType}`)
        .then(response => response.json())
        .then(bills => {
            const billsTableBody = document.querySelector('#bills-table tbody');
            billsTableBody.innerHTML = '';  // Clear any existing rows

            bills.forEach(bill => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${bill._id}</td>
                    <td>${new Date(bill.date).toLocaleDateString()}</td>
                    <td>Bill Payment from ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}</td>
                    <td>$${bill.amount.toFixed(2)}</td>
                    <td><button class="delete-btn">Delete</button></td>
                `;
                billsTableBody.appendChild(row);
            });

            document.getElementById('bills-table-container').style.display = 'block';
        })
        .catch(error => console.error('Error fetching bills:', error));
}

    // Event listener for the "Cancel" button in the shopping-section
    document.getElementById('cancel-shopping').addEventListener('click', function () {
        // Reset all checkboxes in the shopping form
        const checkboxes = document.querySelectorAll('#shopping-form input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset any other fields in the shopping form if needed
        document.getElementById('shopping-form').reset();
    });


});

