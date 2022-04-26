const fs = require("fs");
const mysql = require("mysql");
const fastcsv = require("fast-csv");
const csv = require('csv-parser')


fs.createReadStream('d.csv')
    .pipe(csv())
    .on('headers', (headers) => 
    {
        console.log(`First header: ${headers[0]}`);
        console.log(`Second header: ${headers[1]}`);



        
        let stream = fs.createReadStream("d.csv");
        let csvData = [];
    
        let csvStream = fastcsv
            .parse()
            .on("data", function (data) {
                csvData.push(data);
            })
            .on("end", function () {
                // remove the first line: header
                csvData.shift();

                // create a new connection to the database
                const connection = mysql.createConnection({
                    host: "localhost",
                    user: "root",
                    password: "",
                    database: "FIS"
                });


                // open the connection
                connection.connect(error => {
                    if (error) {
                        console.error(error);
                    } else {
                        connection.query('SHOW COLUMNS FROM Subjects', function (err, rows, fields) {
                            console.log(`Database first Header value : ${rows[0].Field}`);
                            console.log(`Database Second header value: ${rows[1].Field}`);
                            if (headers[0] === rows[0].Field && headers[1] === rows[1].Field) {
                                let query = `INSERT INTO Subjects (${headers[0]},${headers[1]}) VALUES ?`;
                                connection.query(query, [csvData], (error, response) => {
                                    console.log(error || response);
                                });
                            }
                            else{
                                console.log('Check your Csv file headers and retry !')
                            }
                        });

                    }
                });

            });

        stream.pipe(csvStream);
    }) //headers end brackets
