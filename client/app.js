document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('result');
    const checkedInList = document.getElementById('checked-in-list');
    const studentRoster = document.getElementById('student-roster');
    const csvFileInput = document.getElementById('csv-file');
    const uploadCsvButton = document.getElementById('upload-csv');
    const deleteSelectedButton = document.getElementById('delete-selected');

    // Modal elements
    const editModal = document.getElementById('edit-modal');
    const closeButton = document.querySelector('.close-button');
    const saveEditButton = document.getElementById('save-edit');
    const editIdOriginalInput = document.getElementById('edit-id-original');
    const editNameInput = document.getElementById('edit-name');
    const editIdInput = document.getElementById('edit-id');

    let validStudents = {};
    let checkedInStudents = {}; // To store checked-in students for persistence

    function setStatus(message, type) {
        resultDiv.textContent = message;
        switch (type) {
            case 'success':
                resultDiv.style.backgroundColor = '#d4edda'; // Green
                break;
            case 'warning':
                resultDiv.style.backgroundColor = '#fff3cd'; // Yellow
                break;
            case 'error':
                resultDiv.style.backgroundColor = '#f8d7da'; // Red
                break;
            default:
                resultDiv.style.backgroundColor = '#e9ecef'; // Default
                break;
        }
    }

    // --- Data Persistence ---
    function saveRoster() {
        localStorage.setItem('validStudents', JSON.stringify(validStudents));
    }

    function loadRoster() {
        const storedRoster = localStorage.getItem('validStudents');
        if (storedRoster) {
            validStudents = JSON.parse(storedRoster);
            renderRoster();
        }
    }

    function saveCheckedInStudents() {
        localStorage.setItem('checkedInStudents', JSON.stringify(checkedInStudents));
    }

    function loadCheckedInStudents() {
        const storedCheckedIn = localStorage.getItem('checkedInStudents');
        if (storedCheckedIn) {
            checkedInStudents = JSON.parse(storedCheckedIn);
            renderCheckedInList();
        }
    }

    function renderCheckedInList() {
        checkedInList.innerHTML = '';
        Object.entries(checkedInStudents).forEach(([id, data]) => {
            const listItem = document.createElement('li');
            listItem.id = `checked-in-${id}`;

            const studentInfo = document.createElement('span');
            studentInfo.className = 'student-info';
            studentInfo.textContent = `${data.name} (ID: ${id})`;

            const timestamp = document.createElement('span');
            timestamp.className = 'timestamp';
            timestamp.textContent = data.time;

            listItem.appendChild(studentInfo);
            listItem.appendChild(timestamp);
            checkedInList.appendChild(listItem);
        });
    }

    // --- Roster Management ---
    function renderRoster() {
        studentRoster.innerHTML = '';
        Object.entries(validStudents).forEach(([id, name]) => {
            const listItem = document.createElement('li');
            listItem.id = `roster-student-${id}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.id = id;
            checkbox.onchange = toggleDeleteButton;

            const studentInfo = document.createElement('span');
            studentInfo.className = 'roster-student-info';
            studentInfo.textContent = `${name} (ID: ${id})`;

            const actions = document.createElement('div');
            actions.className = 'roster-actions';

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.onclick = () => openEditModal(id, name);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteStudent(id);

            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            listItem.appendChild(checkbox);
            listItem.appendChild(studentInfo);
            listItem.appendChild(actions);
            studentRoster.appendChild(listItem);
        });
        toggleDeleteButton();
        saveRoster(); // Save roster after rendering
    }

    function deleteStudent(id) {
        if (confirm(`Are you sure you want to delete ${validStudents[id]}?`)) {
            delete validStudents[id];
            renderRoster();
            // Also remove from checked-in if they were there
            if (checkedInStudents[id]) {
                delete checkedInStudents[id];
                saveCheckedInStudents();
                renderCheckedInList();
            }
        }
    }

    function openEditModal(id, name) {
        editIdOriginalInput.value = id;
        editNameInput.value = name;
        editIdInput.value = id;
        editModal.style.display = 'flex';
    }

    closeButton.onclick = () => {
        editModal.style.display = 'none';
    };

    saveEditButton.onclick = () => {
        const originalId = editIdOriginalInput.value;
        const newName = editNameInput.value.trim();
        const newId = editIdInput.value.trim();

        if (!newName || !newId) {
            alert('Name and ID cannot be empty.');
            return;
        }

        if (originalId !== newId && validStudents[newId]) {
            alert('The new Student ID is already in use.');
            return;
        }

        // Update checked-in student if ID changed
        if (originalId !== newId && checkedInStudents[originalId]) {
            checkedInStudents[newId] = checkedInStudents[originalId];
            checkedInStudents[newId].name = newName; // Update name in checked-in list too
            delete checkedInStudents[originalId];
            saveCheckedInStudents();
            renderCheckedInList();
        }

        delete validStudents[originalId];
        validStudents[newId] = newName;

        renderRoster();
        editModal.style.display = 'none';
    };

    uploadCsvButton.onclick = () => {
        setStatus('Starting CSV upload...', 'default');
        if (csvFileInput.files.length === 0) {
            setStatus('Please select a CSV file to upload.', 'warning');
            return;
        }

        const file = csvFileInput.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                setStatus('File read. Parsing data...', 'default');
                const text = event.target.result;
                const lines = text.split(/\r\n|\n/);
                const newStudents = {};
                let count = 0;

                lines.forEach((line, index) => {
                    if (line.trim() === '') return; // Skip empty lines
                    const parts = line.split(',');
                    if (parts.length >= 2) { // Handle ID,FirstName,LastName
                        const id = parts[0].trim();
                        const name = parts.slice(1).join(' ').trim(); // Join remaining parts for the name
                        if (id && name) {
                            newStudents[id] = name;
                            count++;
                        }
                    } else {
                        console.warn(`Skipping malformed line ${index + 1}: ${line}`);
                    }
                });

                if (count > 0) {
                    validStudents = newStudents;
                    renderRoster();
                    setStatus(`Successfully uploaded and processed ${count} students.`, 'success');
                } else {
                    setStatus('Could not find any valid student data in the file. Please check the format.', 'error');
                }
            } catch (e) {
                setStatus(`An error occurred during parsing: ${e.message}`, 'error');
                console.error(e);
            }
        };

        reader.onerror = () => {
            setStatus('Error reading the file.', 'error');
        };

        setStatus(`Reading file: ${file.name}...`, 'default');
        reader.readAsText(file);
    };

    function toggleDeleteButton() {
        const anyChecked = studentRoster.querySelector('input[type="checkbox"]:checked');
        deleteSelectedButton.style.display = anyChecked ? 'inline-block' : 'none';
    }

    deleteSelectedButton.onclick = () => {
        const selectedCheckboxes = studentRoster.querySelectorAll('input[type="checkbox"]:checked');
        if (selectedCheckboxes.length === 0) {
            alert('No students selected to delete.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedCheckboxes.length} selected students?`)) {
            selectedCheckboxes.forEach(checkbox => {
                const idToDelete = checkbox.dataset.id;
                delete validStudents[idToDelete];
                // Also remove from checked-in if they were there
                if (checkedInStudents[idToDelete]) {
                    delete checkedInStudents[idToDelete];
                }
            });
            renderRoster();
            saveCheckedInStudents();
            renderCheckedInList();
        }
    };

    // --- QR Code Scanning ---
    function onScanSuccess(decodedText, decodedResult) {
        const studentId = decodedText;
        const studentName = validStudents[studentId];

        if (studentName) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();

            if (!checkedInStudents[studentId]) {
                checkedInStudents[studentId] = { name: studentName, time: timeString };
                saveCheckedInStudents();
                renderCheckedInList();
                setStatus(`Checked in ${studentName} at ${timeString}`, 'success');
            } else {
                setStatus(`${studentName} is already checked in.`, 'warning');
            }
        }
    } else {
            setStatus('Error: Student ID not found in roster.', 'error');
        }
    }

    function onScanError(errorMessage) {
        // This is called frequently, so we'll avoid logging to the console
        // to prevent spam.
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess, onScanError);

    // Initial load and render
    loadRoster();
    loadCheckedInStudents();
});