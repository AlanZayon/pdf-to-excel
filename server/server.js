const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf-parse');

const app = express();
const upload = multer({ dest: 'uploads/' });


app.post('/upload', upload.single('pdfFile'), (req, res) => {

    const data = req.file.path;

    fs.readFile(data, (err, data) => {
        if (err) {
            console.error('Error reading PDF file:', err);
            return;
        }
        PDFParser(data).then(pdfData => {
            const dataSplited = pdfData.text.split('\n');
            const data = [];
            const subDatasArray = [];
            const subTotaisValueArray = [];
            const pushedInfos = [];

            for (let i = 0; i < dataSplited.length; i++) {

                // Assuming your PDF has a specific structure, modify this logic to extract relevant data.
                // For example, you might need to skip certain rows or split text into columns.

                if (dataSplited[i] == 'AgênciaEstabelecimentoValor RestituídoReferência') {
                    datasValue = dataSplited[i + 1];
                    var subDatas = datasValue.substr(0, 10);
                    subDatasArray.push(subDatas);

                } else if (dataSplited[i] == 'Totais') {
                    totaisSplited = dataSplited[i + 1].split(",");
                    subStr = totaisSplited[totaisSplited.length - 2].substr(2);
                    var subTotaisValue = subStr + "," + totaisSplited[totaisSplited.length - 1];
                    subTotaisValueArray.push(subTotaisValue);

                } else if (dataSplited[i] == 'Composição do Documento de Arrecadação') {
                    let infoSplited = dataSplited[i + 1].split("-");
                    if (infoSplited.length <= 2) {
                        infoSub = infoSplited[0].split(/\d/g);
                        var infoSubSplited = infoSub[4];
                        pushedInfos.push(infoSubSplited);
                    } else {
                        infoSub = infoSplited[1].split(/\d/g);
                        var infoSubSplited = infoSub[0];
                        pushedInfos.push(infoSubSplited);
                    }
                }

            }
            data.push(subDatasArray, pushedInfos, subTotaisValueArray);

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(data);

            // Transpose the data
            const transposedData = [];
            Object.keys(worksheet).forEach((cellAddress) => {
                const { c, r } = XLSX.utils.decode_cell(cellAddress);
                if (!transposedData[c]) {
                    transposedData[c] = [];
                }
                transposedData[c][r] = worksheet[cellAddress].v;
            });

            const transposedWorksheet = XLSX.utils.aoa_to_sheet(transposedData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, transposedWorksheet, 'Sheet1');

            const excelFilePath = path.join(__dirname, '../public', 'downloads', 'customized_file.xlsx');
            // Save workbook to Excel file
            XLSX.writeFile(workbook, excelFilePath);

            res.download(excelFilePath, 'customized_file.xlsx');
        })

    })
});

//app.use(express.static('public'));

var assetsPath = path.join(__dirname, '../public');
app.use(express.static(assetsPath));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/' + 'index.html'));
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
