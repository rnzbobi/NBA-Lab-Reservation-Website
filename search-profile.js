// search-profile.js

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const profileUsername = document.querySelector('.profile-username h4');
    const profileHandle = document.querySelector('.profile-username p');
    const profileId = document.querySelector('.profile-details h4');

    // Function to handle the search
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        let randomID = '';
        let randomName = '';

        // Check if the search term matches any of the predefined names
        if (searchTerm === 'lebron' || searchTerm === 'kendrick' || searchTerm === 'drake' || searchTerm === 'marr') {
            // Generate random ID and name
            randomID = Math.floor(Math.random() * 1000000);
            randomName = generateRandomName();

            // Update profile information
            profileUsername.textContent = randomName;
            profileHandle.textContent = '@' + randomName.toLowerCase().replace(' ', ''); // Update the handle
            profileId.textContent = 'ID: ' + randomID;
        }
    }

    // Function to generate a random name
    function generateRandomName() {
        const names = ['LeBron James', 'Kendrick Lamar', 'Drake', 'Marr'];
        const randomIndex = Math.floor(Math.random() * names.length);
        return names[randomIndex];
    }

    // Listen for Enter key press on the search input
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    // Listen for click on the search icon
    document.querySelector('.search-button').addEventListener('click', function() {
        handleSearch();
    });
});
