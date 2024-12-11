document.addEventListener('DOMContentLoaded', function () {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importArea = document.getElementById('importArea');
    const messageDiv = document.getElementById('message');

    let isImportMode = false;

    function showMessage(text, isError = false) {
        messageDiv.textContent = text;
        messageDiv.style.display = 'block';
        messageDiv.className = isError ? 'error' : 'success';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    exportBtn.addEventListener('click', function () {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.scripting.executeScript(
                {
                    target: {tabId: tabs[0].id},
                    func: () => {
                        return JSON.stringify(localStorage);
                    }
                },
                result => {
                    if (chrome.runtime.lastError) {
                        showMessage('Error: Cannot access localStorage', true);
                        return;
                    }

                    const storageData = result[0].result;
                    navigator.clipboard
                        .writeText(storageData)
                        .then(() => {
                            showMessage('localStorage exported to clipboard!');
                        })
                        .catch(err => {
                            showMessage('Failed to copy to clipboard', true);
                        });
                }
            );
        });
    });

    importBtn.addEventListener('click', function () {
        if (!isImportMode) {
            importArea.style.display = 'block';
            importBtn.textContent = 'Confirm Import';
            isImportMode = true;
        } else {
            const jsonData = importArea.value.trim();

            try {
                JSON.parse(jsonData); // Validate JSON format

                chrome.tabs.query(
                    {active: true, currentWindow: true},
                    function (tabs) {
                        chrome.scripting.executeScript(
                            {
                                target: {tabId: tabs[0].id},
                                func: data => {
                                    try {
                                        localStorage.clear();
                                        const parsedData = JSON.parse(data);
                                        Object.entries(parsedData).forEach(
                                            ([key, value]) => {
                                                localStorage.setItem(
                                                    key,
                                                    value
                                                );
                                            }
                                        );
                                        return true;
                                    } catch (e) {
                                        return false;
                                    }
                                },
                                args: [jsonData]
                            },
                            result => {
                                if (
                                    chrome.runtime.lastError ||
                                    !result[0].result
                                ) {
                                    showMessage(
                                        'Error: Failed to import localStorage',
                                        true
                                    );
                                } else {
                                    showMessage(
                                        'LocalStorage imported successfully!'
                                    );
                                    importArea.style.display = 'none';
                                    importBtn.textContent =
                                        'Import LocalStorage';
                                    importArea.value = '';
                                    isImportMode = false;
                                }
                            }
                        );
                    }
                );
            } catch (e) {
                showMessage('Error: Invalid JSON format', true);
            }
        }
    });
});
