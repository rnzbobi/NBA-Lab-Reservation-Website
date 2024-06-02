document.addEventListener('DOMContentLoaded', function() {
    const ticketsPerPage = 3;
    let currentPage = 1;

    const reservations = [
        {
            id: 123456,
            seatNumber: 'A1',
            arena: 'Crypto.com Arena',
            requestDate: 'May 20, 2024',
            startDate: 'May 26, 2024 12:00 PM',
            endDate: 'May 26, 2024 02:00 PM',
            isLate: false
        },
        {
            id: 123457,
            seatNumber: 'B2',
            arena: 'Madison Square Garden',
            requestDate: 'May 21, 2024',
            startDate: 'May 27, 2024 01:00 PM',
            endDate: 'May 27, 2024 03:00 PM',
            isLate: false
        },
        {
            id: 123458,
            seatNumber: 'C3',
            arena: 'Target Center',
            requestDate: 'May 22, 2024',
            startDate: 'May 28, 2024 02:00 PM',
            endDate: 'May 28, 2024 04:00 PM',
            isLate: true
        },
        {
            id: 123459,
            seatNumber: 'D4',
            arena: 'Chase Center',
            requestDate: 'May 23, 2024',
            startDate: 'May 29, 2024 03:00 PM',
            endDate: 'May 29, 2024 05:00 PM',
            isLate: false
        },
        {
            id: 123460,
            seatNumber: 'E5',
            arena: 'Wells Fargo Center',
            requestDate: 'May 24, 2024',
            startDate: 'May 30, 2024 04:00 PM',
            endDate: 'May 30, 2024 06:00 PM',
            isLate: false
        },
        {
            id: 123461,
            seatNumber: 'F6',
            arena: 'Chase Center',
            requestDate: 'May 25, 2024',
            startDate: 'May 31, 2024 05:00 PM',
            endDate: 'May 31, 2024 07:00 PM',
            isLate: true
        },
        {
            id: 123462,
            seatNumber: 'G7',
            arena: 'Madison Square Garden',
            requestDate: 'May 26, 2024',
            startDate: 'June 1, 2024 06:00 PM',
            endDate: 'June 1, 2024 08:00 PM',
            isLate: true
        },
        {
            id: 123463,
            seatNumber: 'H8',
            arena: 'Madison Square Garden',
            requestDate: 'May 27, 2024',
            startDate: 'June 2, 2024 07:00 PM',
            endDate: 'June 2, 2024 09:00 PM',
            isLate: false
        }
    ];

    const ticketContainer = document.getElementById('remove-ticket-container');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageNumbersContainer = document.getElementById('page-numbers');
    const totalPages = Math.ceil(reservations.length / ticketsPerPage);

    function displayTickets() {
        ticketContainer.innerHTML = '';
        const start = (currentPage - 1) * ticketsPerPage;
        const end = start + ticketsPerPage;
        const pageTickets = reservations.slice(start, end);

        pageTickets.forEach(ticket => {
            const ticketRow = document.createElement('tr');

            let removeButtonHtml = '';
            if (ticket.isLate) {
                removeButtonHtml = `
                    <button class="remove-reservation-button-custom" onclick="showRemoveConfirmation(${ticket.id})">
                        Remove
                    </button>
                `;
            }

            const editButtonHtml = `
                <a class="edit-reservation-button-custom" href="modify_reservation_page.html?id=${ticket.id}">
                    Edit
                </a>
            `;

            ticketRow.innerHTML = `
                <td>${ticket.id}</td>
                <td>${ticket.seatNumber}</td>
                <td>${ticket.arena}</td>
                <td>${ticket.requestDate}</td>
                <td>${ticket.startDate}</td>
                <td>${ticket.endDate}</td>
                <td>${ticket.isLate ? 'Late' : 'On Time'}</td>
                <td>${editButtonHtml}</td>
                <td>${removeButtonHtml}</td>
            `;
            ticketContainer.appendChild(ticketRow);
        });

        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
    }

    function displayPageNumbers() {
        pageNumbersContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.textContent = i;
            pageNumber.classList.add('page-number-custom');
            if (i === currentPage) {
                pageNumber.classList.add('active');
            }
            pageNumber.addEventListener('click', () => {
                currentPage = i;
                displayTickets();
                displayPageNumbers();
            });
            pageNumbersContainer.appendChild(pageNumber);
        }
    }

    window.showRemoveConfirmation = function(id) {
        const confirmation = confirm("Are you sure you want to remove this reservation?");
        if (confirmation) {
            removeReservation(id);
        }
    }

    function removeReservation(id) {
        const index = reservations.findIndex(ticket => ticket.id === id);
        if (index !== -1) {
            reservations.splice(index, 1);
            displayTickets();
            displayPageNumbers();
        }
    }

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTickets();
            displayPageNumbers();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayTickets();
            displayPageNumbers();
        }
    });

    displayTickets();
    displayPageNumbers();
});
