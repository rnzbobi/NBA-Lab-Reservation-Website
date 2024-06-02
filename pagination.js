document.addEventListener('DOMContentLoaded', function() {
    const ticketsPerPage = 3;
    let currentPage = 1;

    const tickets = [
        {
            id: 123456,
            seatNumber: 'A1',
            arena: 'Crypto.com Arena',
            requestDate: 'May 20, 2024',
            startDateTime: 'May 26, 2024 12:00 PM',
            endDateTime: 'May 26, 2024 02:00 PM',
            isLate: false
        },
        {
            id: 123457,
            seatNumber: 'B2',
            arena: 'Madison Square Garden',
            requestDate: 'May 21, 2024',
            startDateTime: 'May 27, 2024 01:00 PM',
            endDateTime: 'May 27, 2024 03:00 PM',
            isLate: false
        },
        {
            id: 123458,
            seatNumber: 'C3',
            arena: 'Target Center',
            requestDate: 'May 22, 2024',
            startDateTime: 'May 28, 2024 02:00 PM',
            endDateTime: 'May 28, 2024 04:00 PM',
            isLate: true
        },
        {
            id: 123459,
            seatNumber: 'D4',
            arena: 'Chase Center',
            requestDate: 'May 23, 2024',
            startDateTime: 'May 29, 2024 03:00 PM',
            endDateTime: 'May 29, 2024 05:00 PM',
            isLate: false
        },
        {
            id: 123460,
            seatNumber: 'E5',
            arena: 'Wells Fargo Center',
            requestDate: 'May 24, 2024',
            startDateTime: 'May 30, 2024 04:00 PM',
            endDateTime: 'May 30, 2024 06:00 PM',
            isLate: false
        }
    ];

    const ticketContainer = document.getElementById('ticket-container');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageNumbersContainer = document.getElementById('page-numbers');
    const totalPages = Math.ceil(tickets.length / ticketsPerPage);

    function displayTickets() {
        ticketContainer.innerHTML = '';
        const start = (currentPage - 1) * ticketsPerPage;
        const end = start + ticketsPerPage;
        const pageTickets = tickets.slice(start, end);

        pageTickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.classList.add('see-reservation-profile-right-page');
            ticketElement.innerHTML = `
                <div class="see-reservation-box">
                    <div class="see-reservation-id">
                        <h3>Reservation #${ticket.id}</h3>
                    </div>
                    <div class="see-reservation-details-container">
                        <div class="see-reservation-details-right">
                            <h2>Seat Number: ${ticket.seatNumber}</h2>
                        </div>
                        <div class="see-reservation-details-left">
                            <h2>Arena: ${ticket.arena}</h2>
                        </div>
                    </div>
                    <div class="see-reservation-dates">
                        <h2>Date of Request: ${ticket.requestDate}</h2>
                        <h2>Starting Date & Time: ${ticket.startDateTime}</h2>
                        <h2>Ending Date & Time: ${ticket.endDateTime}</h2>
                    </div>
                    <a class="see-reservation-modify-reservation" href="modify_reservation_page.html?id=${ticket.id}">
                        <h4>Modify</h4>
                    </a>
                </div>
            `;
            ticketContainer.appendChild(ticketElement);
        });

        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
    }

    function displayPageNumbers() {
        pageNumbersContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.textContent = i;
            pageNumber.classList.add('page-number');
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
