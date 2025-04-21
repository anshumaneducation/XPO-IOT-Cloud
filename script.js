// Import necessary Firebase libraries
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js';

// Firebase configuration
  const firebaseConfig = {

    apiKey: "AIzaSyAsUAVmIsCq3V9aWfnV6PFm3bd3cqGM_0w",
    authDomain: "xpo-iot.firebaseapp.com",
    databaseURL: "https://xpo-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xpo-iot",
    storageBucket: "xpo-iot.firebasestorage.app",
    messagingSenderId: "1064490535871",
    appId: "1:1064490535871:web:f731d0f198dcd2cb9baf0a"

  };


// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Authenticate user
export function authenticate() {
    const usernameInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const enteredPassword = passwordInput.value;
    const enteredUsername = usernameInput.value.split('@')[0];

    // Fetch the correct password from Firebase
    const passwordRef = ref(database, `/${enteredUsername}/iot_password`);
    onValue(passwordRef, (snapshot) => {
        const correctPassword = snapshot.val();

        // get data 
        sessionStorage.setItem('username', enteredUsername);
            localStorage.setItem('username', enteredUsername);
            localStorage.setItem('password', enteredPassword);

            

        if (enteredPassword === correctPassword) {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('data-container').style.display = 'block';
            // Correct password
            fetchAndDisplayData(enteredUsername);
        } 
        else{
            alert("Username or password is incorrect!")
        }
        
        
    }, (error) => {
        console.error("Error authenticating user:", error);
        alert("An error occurred while logging in. Please try again.");
    });
}

// Fetch and display data from Firebase
function fetchAndDisplayData(userId) {

    let html1 = document.getElementById("value-iot").innerHTML;
    let html2 = document.getElementById("parameter-iot").innerHTML;
    const value_from_db_ref_1 = ref(database, `/${userId}/Parameter`);
    console.log(value_from_db_ref_1)

    onValue(value_from_db_ref_1, (snapshot) => {
        const parameter_from_db = snapshot.val();
        console.log(parameter_from_db)
        document.getElementById("parameter-iot").innerHTML = parameter_from_db;
    });

    const value_from_db_ref_2 = ref(database, `/${userId}/Value`);
    console.log(value_from_db_ref_2)

    onValue(value_from_db_ref_2, (snapshot) => {
        const value_from_db = snapshot.val();
        console.log(value_from_db)
        document.getElementById("value-iot").innerHTML = value_from_db;
    });
    
    
}

// Logout Function
function logout() {
    // Clear stored credentials
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    sessionStorage.removeItem('username');

    // Hide data container and show login form
    document.getElementById('data-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';

    alert("Logged out successfully!");
}




// Auto-login if credentials are stored
function autoLogin() {
    const savedUsername = localStorage.getItem('username');
    const savedPassword = localStorage.getItem('password');

    if (savedUsername && savedPassword) {
        const passwordRef = ref(database, `/${savedUsername}/iot_password`);
        onValue(passwordRef, (snapshot) => {
            const correctPassword = snapshot.val();
            if (savedPassword === correctPassword) {
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('data-container').style.display = 'block';

                fetchAndDisplayData(savedUsername);
            } else {
                alert('Saved credentials are invalid. Please log in again.');
                localStorage.clear();
            }
        }, (error) => {
            console.error("Error checking stored credentials:", error);
        });
    }
}
// Trigger auto-login on page load
document.addEventListener('DOMContentLoaded', autoLogin);

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    authenticate();
});
// Attach event listener to the logout button
document.getElementById('logout-button').addEventListener('click', logout);