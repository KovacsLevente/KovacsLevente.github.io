const languages = ["USA / CA","AU / IE / UK","DE / CH","FR","NL","SE","ES/MX","NO","DK","IT","FI"];
var baseURL = 'https://raw.githubusercontent.com/levente-tg/namegen_source/main/';

var options = [
    "Personalization",
    "ProductDesign",
    "ProductType",
    "ProductComponents",
    "StoneType",
    "MaterialType",
    "Audience"
];

var csvURLs =  {};
var csvData = {};
var csvArray = [];


function loadCSV(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load CSV file: ' + response.status);
            }
            return response.text();
        })
        .catch(error => {
            console.error(error);
        });
}

function csvToArray(csv) {
    var rows = csv.split('\n');
    var result = [];
    
    rows.forEach(function(row) {
        var cells = row.split(';');
        result.push(cells);
    });
    
    return result;
}

function populateSelector(data, id) {
    var selector = document.getElementById(id);
    selector.innerHTML = '';

    data.forEach(function(row, index) {
        if (index === 0) return; 
        var optionElement = document.createElement('option');
        optionElement.textContent = row[0]; // First column (eng/us)
        selector.appendChild(optionElement);
    });
}

function showResult(data) {
    var resultTable = document.querySelector('#resultTable tbody');
    resultTable.innerHTML = '';

    data.forEach(function(rowData) {
        var row = document.createElement('tr');

        rowData.forEach(function(cellData) {
            var cell = document.createElement('td');
            cell.textContent = cellData;
            row.appendChild(cell);
        });

        var extraCell = document.createElement('td');
        var button = document.createElement('button');
        button.textContent = 'Copy';
        button.onclick = function() {
            copyToClipboard(this);
        };
        
        extraCell.appendChild(button);
        row.appendChild(extraCell);

        resultTable.appendChild(row);
    });
};

function copyToClipboard(button) {
    var row = button.parentNode.parentNode;
    var textarea = document.createElement('textarea');
    var cells = row.getElementsByTagName("td");
    var secondColumn = cells[1];
    textarea.value = secondColumn.innerText.trim();
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function generateName(formData) {
    var generatedNames = [];

    languages.forEach(function(language) {
        var nameTemp = [];
        nameTemp.push(language);

        var generatedTemp = formData.get('freeText');
        
        options.forEach(function(option) {
            var optionTemp = csvToArray(csvData[option]);
            // Remove linebreak from last element (FI)
            optionTemp[0][optionTemp[0].length - 1] = optionTemp[0][optionTemp[0].length - 1].trim();
            var languageIndex = optionTemp[0].indexOf(language);
            var selectedIndex = 0;

            optionTemp.forEach(function(row, index) {
                if (row[0].trim() === formData.get(option)) {
                    selectedIndex = index;
                }
            });
            
            generatedTemp += ' ' + optionTemp[selectedIndex][languageIndex];
            
        });
        nameTemp.push(generatedTemp);
        generatedNames.push(nameTemp);
    });

    showResult(generatedNames);
}

function main() {

    options.forEach(function(option) {
        csvURLs[option] = baseURL + option + '.csv';
    });
    
    var promises = Object.keys(csvURLs).map(key => {
        var url = csvURLs[key];
        return loadCSV(url)
            .then(csvContent => {
                csvData[key] = csvContent;
            });
    });

    Promise.all(promises)
        .then(() => {
            // CSV loaded from now on, hopefully
            options.forEach(function(option) {
                populateSelector(csvToArray(csvData[option]), option);
            });
        })
        .catch(error => {
            console.error("Error loading CSV files:", error);
        });
    
    // Submit listener
    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();
        
        // FormData is like a dict i guess, idk
        var formData = new FormData(event.target); 

        generateName(formData);
    });
}

main();
