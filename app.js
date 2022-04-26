const path = require('path');
const express = require('express');
const ejs = require('ejs');
//const bodyParser = require('body-parser');
const app = express();

const mysql = require('mysql');

const fs = require("fs");
let formidable = require('formidable');
// const mysql = require("mysql");
const fastcsv = require("fast-csv");
const csv = require('csv-parser')

var helper = require('./helper');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "FIS"

});

connection.connect(function (error) {
    if (!!error) console.log(error);
    else console.log('Database Connected!');
});

//set views file
app.set('views', path.join(__dirname, 'views'));

//set view engine
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//app.use(connect.bodyParser({strict: false}));
const multer = require('multer');

var g;
let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'C:/Users/Aade$h/Desktop/backupp/test/uploads')
    },
    filename: function (req, file, callback) {
        console.log(file)
        callback(null, file.originalname)
        g = file.originalname;
        console.log(g);
    }
})
app.get('/file', function (req, res) {
    res.render('fileupload')
})
app.post('/file', function (req, res) {
    console.log(req.body);
    let upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            let ext = path.extname(file.originalname)
            console.log(req.body)
            // window.localStorage.setItem("lastname", file.originalname);
            // console.log(window.localStorage.getItem("lastname"))
            // window.filepa = file.originalname;
            if (ext !== '.csv' && ext !== '.xlsx') {
                return callback(res.end('Only Excel files or Csv are allowed'), null)
            }
            callback(null, true)
        }
    }).single('userFile');
    upload(req, res, function (err) {
        res.render('confirmfileupload');
    })

})
app.post('/api/simple', function (req, res) {

    console.log("Outside method : ", g);

    // return res.send(g);

    let muser = req.body.selectpicker;

    console.log('msg value here :', req.body);
    console.log('selectpicker : &&&& , ', req.body.selectpicker, '&&&&&');
    f = 'C:/Users/Aade$h/Desktop/backupp/test/uploads/'
    s = f.concat(g)
    console.log('s:', s);
    fs.createReadStream(s)
        .pipe(csv())
        .on('headers', (headers) => {
            console.log(`First header: ${headers[0]}`);
            console.log(`Second header: ${headers[1]}`);




            let stream = fs.createReadStream(s);
            let csvData = [];

            let csvStream = fastcsv
                .parse()
                .on("data", function (data) {
                    csvData.push(data);
                })
                .on("end", function () {
                    // remove the first line: header
                    csvData.shift();

                    var qr = 'SHOW COLUMNS FROM ' + req.body.selectpicker;
                    console.log('qr &&& ', qr);

                    connection.query(qr, function (err, rows, fields) {
                        var c = 0;

                        if (headers.length === rows.length) {
                            for (let i = 0; i < headers.length; i++) {
                                if (headers[i] === rows[i]["Field"]) {
                                    c++;

                                    //console.log('check here : ', i);
                                }
                                else {
                                    fs.unlink(s, function (err) {
                                        if (err) throw err;
                                        // if no error, file has been deleted successfully
                                        console.log('File deleted!');
                                    }); 
                                    //res.send('please correct your '+headers[i]+' column in your file with correct name as '+rows[i]["Field"]+' column ');
                                    res.render('error', {
                                        textmessage: 'Failed in Uploading ' + req.body.selectpicker + ' data in to database ! ',
                                        reason: 'Please check your Column Names !!!!',
                                        rectify:'Check and correct your data with the below comparision',
                                        headers: headers,
                                        rows: rows
                                    });
                                    // 'please correct your ' + headers[i] + ' column in your file with correct name as ' + rows[i]["Field"] + ' column '


                                 }
                                if (c === headers.length) {
                                    //  res.send('First Success');

                                    console.log('get headers:', headers);
                                    console.log('get cvData:', csvData);

                                    var kk = req.body.selectpicker;

                                    let query = 'INSERT INTO ' + kk + ' VALUES ?';
                                    connection.query(query, [csvData], (error, response) => {
                                        console.log(error || response);
                                    });
                                    
                                    //console.log('test file name :--- ',s);
                                    fs.unlink(s, function (err) {
                                        if (err) throw err;
                                        // if no error, file has been deleted successfully
                                        console.log('File deleted!');
                                    }); 

                                    res.render('success', {
                                        textmessage: 'Successfully uploaded ' + req.body.selectpicker + ' data in to database ! ',
                                        tablename: req.body.selectpicker,
                                        filename:g
                                    });


                                }
                                
                            }
                        }
                        else {
                            fs.unlink(s, function (err) {
                                        if (err) throw err;
                                        // if no error, file has been deleted successfully
                                        console.log('File deleted!');
                                    }); 
                            res.render('error', {
                                textmessage: 'Failed in Uploading ' + req.body.selectpicker + ' data in to database ! ',
                                reason: 'Error has been Occured due to the mismatch in number of columns !',
                                rectify: 'Check the Number of columns should be : ' + rows.length,
                                headers: headers,
                                rows: rows
                            });
                            //res.send('please recheck your csv file');
                        }

                    });


                });

            stream.pipe(csvStream);
        }) //
})


app.get('/', (req, res) => {
    res.render('home', {

    });
});
app.get('/home', (req, res) => {
    res.render('home', {

    });
});


app.get('/bulkui', (req, res) => {

    res.render('fileupload', {

    });
});




// app.post('/bulk',(req,res)=>{
//     let data = "This is a file containing a collection of books.";

// fs.writeFile("C:/Users/Aade$h/Desktop/backupp/test/books.txt", data, (err) => {
//   if (err)
//     console.log(err);
//   else { 
//     console.log("File written successfully\n");
//     console.log("The written has the following contents:");
//     console.log(fs.readFileSync("books.txt", "utf8"));
//   }
// });

//     let muser = req.body.selectpicker;

//     console.log('msg value here :',req.body );
//     console.log('selectpicker : &&&& , ',req.body.selectpicker,'&&&&&');

//      fs.createReadStream('C:/Users/Aade$h/Desktop/backupp/test/faculty_experience.csv')
//     .pipe(csv())
//     .on('headers', (headers) => 
//     {
//         console.log(`First header: ${headers[0]}`);
//         console.log(`Second header: ${headers[1]}`);




//         let stream = fs.createReadStream("C:/Users/Aade$h/Desktop/backupp/test/faculty_experience.csv");
//         let csvData = [];

//         let csvStream = fastcsv
//             .parse()
//             .on("data", function (data) {
//                 csvData.push(data);
//             })
//             .on("end", function () {
//                 // remove the first line: header
//                 csvData.shift();

//                  var qr = 'SHOW COLUMNS FROM ' + req.body.selectpicker;
//                  console.log('qr &&& ',qr);

//                 connection.query(qr, function (err, rows, fields) {
//                     var c=0;

//                     if(headers.length === rows.length)
//                     {
//                         for(let i=0; i<headers.length; i++)
//                         {
//                             if(headers[i] === rows[i]["Field"])
//                             {
//                                 c++;

//                                 console.log('check here : ', i);
//                             }

//                         }
//                         if(c === headers.length)
//                         {
//                             //  res.send('First Success');

//                              console.log('get headers:',headers);
//                              console.log('get cvData:',csvData);

//                                 var kk = req.body.selectpicker;

//                                 let query = 'INSERT INTO '+kk+ ' VALUES ?';
//                                 connection.query(query,[csvData], (error, response) => {
//                                     console.log(error || response);
//                                 });

//                               res.send('Mission Accomplished');
//                         }
//                     }
//                     else
//                     {
//                         res.send('please recheck your csv file');
//                     }

//                 });


//             });

//         stream.pipe(csvStream);
//     }) //headers end brackets
// });
// app.get('/testbulk',(req, res) => {

//    fs.createReadStream('C:/Users/Aade$h/Desktop/backupp/test/d.csv')
//     .pipe(csv())
//     .on('headers', (headers) => 
//     {
//         // console.log(`First header: ${headers[0]}`);
//         // console.log(`Second header: ${headers[1]}`);

//        console.log('Full header:',headers);


//         let stream = fs.createReadStream("C:/Users/Aade$h/Desktop/backupp/test/d.csv");
//         let csvData = [];

//         let csvStream = fastcsv
//             .parse()
//             .on("data", function (data) {
//                 csvData.push(data);
//             })
//             .on("end", function () {
//                 // remove the first line: header
//                 csvData.shift();



//                 connection.query('SHOW COLUMNS FROM Subjects', function (err, rows, fields) {
//                             console.log('Full Rows:',rows[0]["Field"]);

//                             // JSONArray jsonArray = (JSONArray) jsonObject.get(rows);
//                             // console.log('check this : ', jsonArray);

//                             // console.log(`Database first Header value : ${rows[0].Field}`);
//                             // console.log(`Database Second header value: ${rows[1].Field}`);
//                             if (headers[0] === rows[0].Field && headers[1] === rows[1].Field) {
//                                 let query = `INSERT INTO Subjects (${headers[0]},${headers[1]}) VALUES ?`;
//                                 connection.query(query, [csvData], (error, response) => {
//                                     // console.log(error || response);
//                                     console.log('SUCCESSSSSSSSSSSSS');
//                                 });
//                             }
//                             else{
//                                 console.log('Check your Csv file headers and retry !')
//                             }
//                         });

//                 res.send('Mission Accomplished');
//             });

//         stream.pipe(csvStream);
//     }) //headers end brackets




// });

app.get('/showsubjects', (req, res) => {

    let sql = "SELECT * FROM Subjects";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showsubjects', {
            title: 'SUBJECT RECORDS',
            users: rows,
            helper: helper
        });
    });
});
app.get('/showfacultyaddress', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_address";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyaddress', {
            title: 'FACULTY ADDRESS RECORDS',
            users: rows
        })
    });
});
app.get('/showfacultyprofile', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT *,DATE_FORMAT(DOB, '%d/%m/%Y') AS DATE_OF_BIRTH,DATE_FORMAT(joining_date, '%d/%m/%Y') AS joindate,DATE_FORMAT(relieving_date, '%d/%m/%Y') AS relidate,DATE_FORMAT(Designation_date, '%d/%m/%Y') AS desidate FROM `faculty_profile` ";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyprofile', {
            title: 'FACULTY PROFILE RECORDS',
            users: rows
        });
    });
});
app.get('/showfacultyawards', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_award";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyawards', {
            title: 'FACULTY AWARDS RECORDS',
            users: rows
        })
    });
});
app.get('/showfacultybook', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_book";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultybook', {
            title: 'FACULTY BOOK RECORDS',
            users: rows
        })
    });
});

app.get('/showfacultycompetence', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_competence";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultycompetence', {
            title: 'FACULTY COMPETENCE RECORDS',
            users: rows
        })
    });
});

app.get('/showfacultyconference', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT *,DATE_FORMAT(from_date, '%d/%m/%Y') AS ffdate,DATE_FORMAT(to_date, '%d/%m/%Y') AS ttdate  FROM faculty_conference";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyconference', {
            title: 'FACULTY CONFERENCE RECORDS',
            users: rows
        })
    });
});

app.get('/showfacultyeducation', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_education";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyeducation', {
            title: 'FACULTY Education RECORDS',
            users: rows
        })
    });
});
app.get('/showfacultyexperience', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT *, DATE_FORMAT(Joining_date, '%d/%m/%Y') AS JoinDate FROM faculty_experience";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyexperience', {
            title: 'FACULTY EXPERIENCE RECORDS',
            users: rows
        })
    });
});

app.get('/showfacultyfdp', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_fdp";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyfdp', {
            title: 'FACULTY DEVELOPEMENT PROGRAM RECORDS',
            users: rows
        })
    });
});

app.get('/showfacultyjournals', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_journals";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyjournals', {
            title: 'FACULTY JOURNALS RECORDS',
            users: rows
        })
    });
});
app.get('/showfacultyleaves', (req, res) => {

    let sql = "SELECT *, DATE_FORMAT(Start_date, '%d/%m/%Y') AS StartEnd , DATE_FORMAT(End_date, '%d/%m/%Y') AS EndDate FROM faculty_leaves";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyleaves', {
            title: 'FACULTY LEAVES RECORDS',
            users: rows
        })
    });
});
app.get('/showfacultypatent', (req, res) => {

    let sql = "SELECT *, DATE_FORMAT(Awarded_date, '%d/%m/%Y') AS AwardedDate , DATE_FORMAT(File_date, '%d/%m/%Y') AS FileDate FROM faculty_patent";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultypatent', {
            title: 'FACULTY PATENT RECORDS',
            users: rows
        })
    });
});
app.get('/showfacultyvisiting', (req, res) => {

    let sql = "SELECT *, DATE_FORMAT(from_date, '%d/%m/%Y') AS FromDate , DATE_FORMAT(to_date, '%d/%m/%Y') AS ToDate FROM faculty_visiting";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('showfacultyvisiting', {
            title: 'FACULTY VISITING RECORDS',
            users: rows
        })
    });
});

app.get('/filter', (req, res) => {


    res.render('filterhome', {

    });

});
app.get('/viewrecords', (req, res) => {


    res.render('viewrecords', {

    });

});

app.get('/publ', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT *,DATE_FORMAT(DOB, '%d/%m/%Y') AS DATE_OF_BIRTH,DATE_FORMAT(joining_date, '%d/%m/%Y') AS joindate,DATE_FORMAT(relieving_date, '%d/%m/%Y') AS relidate,DATE_FORMAT(Designation_date, '%d/%m/%Y') AS desidate FROM `faculty_profile` ";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('vvvv', {
            title: 'Faculty Profile Details',
            users: rows
        });
    });
});

app.post('/publ', (req, res) => {
    console.log(req.body);
    faculty_name = req.body.faculty_name;
    faculty_education = req.body.faculty_education;
    faculty_exp = req.body.faculty_exp;
    var sql = '';
    //if (faculty_name != null & faculty_education != null & faculty_exp != null) {
    sql = "SELECT * FROM faculty_profile fp ";
    //where fp.Faculty_Name like '" + faculty_name + "%' and fp.Qualification='" + faculty_education + "' and fp.Experience >=" + faculty_exp;
    if (faculty_name !== null || faculty_education !== null || faculty_exp !== null) {
        sql = sql.concat(' where ');
    }
    var tempname = '';
    console.log("tempname at start: " + tempname);
    console.log('facultyname at start : ' + faculty_name);
    if (faculty_name !== '') {

        tempname = "fp.Faculty_Name like '" + faculty_name + "%'";
        sql = sql.concat(tempname);

    }
    console.log('After update 1 : ' + sql);

    var tempeducation = '';
    console.log("tempeducation at start : " + tempeducation);
    console.log('facultyeducation at start : ' + faculty_education);
    if (faculty_education !== '') {
        if (tempname !== '') {
            tempeducation = tempeducation.concat(' and ');
        }
        tempeducation = tempeducation.concat("fp.Qualification='" + faculty_education + "' ");
        sql = sql.concat(tempeducation);

    }
    console.log('After update 2 : ' + sql);

    console.log("tempeducation before try: " + tempeducation);
    var tempexp = '';
    if (faculty_exp !== '') {
        if (tempname !== '' || tempeducation !== '') {
            tempexp = tempexp.concat(' and ');
        }
        tempexp = tempexp.concat("fp.Experience >=" + faculty_exp);
        sql = sql.concat(tempexp);

    }
    tempname = '';
    tempeducation = '';
    tempexp = '';
    console.log("tempname after try : " + tempname);
    console.log("tempeducation after try: " + tempeducation);
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('vvvv', {
            title: 'Faculty Profile Details',
            users: rows
        });
    });
    sql = '';
    console.log('facultyname at end : ' + faculty_name);
    console.log('facultyeducation at end : ' + faculty_education);
    console.log("sql after try : " + sql);


})

//active faculty filter
app.get('/filteractive', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT *,DATE_FORMAT(DOB, '%d/%m/%Y') AS DATE_OF_BIRTH,DATE_FORMAT(joining_date, '%d/%m/%Y') AS joindate,DATE_FORMAT(relieving_date, '%d/%m/%Y') AS relidate,DATE_FORMAT(Designation_date, '%d/%m/%Y') AS desidate FROM `faculty_profile` ";
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('filteractive', {
            title: 'Active Faculty Details',
            users: rows
        });
    });
});

app.post('/filteractive', (req, res) => {
    console.log(req.body);
    // faculty_name = req.body.faculty_name;
    from_pyear = req.body.from_pyear;
    to_pyear = req.body.to_pyear;
    var sql = '';
    var fdate = from_pyear+'/08/31';
    var tdate = to_pyear+'/04/31';

    //if (faculty_name != null & faculty_education != null & faculty_exp != null) {
    
    sql = "SELECT *,DATE_FORMAT(DOB, '%d/%m/%Y') AS DATE_OF_BIRTH,DATE_FORMAT(joining_date, '%d/%m/%Y') AS joindate,DATE_FORMAT(relieving_date, '%d/%m/%Y') AS relidate,DATE_FORMAT(Designation_date, '%d/%m/%Y') AS desidate FROM `faculty_profile` WHERE DATE_FORMAT(joining_date, '%Y/%m/%d') <= '"+fdate+"'  AND '"+tdate +"'<= DATE_FORMAT(relieving_date, '%Y/%m/%d')"

    // if ((from_pyear !== null && to_pyear !== null) || (from_pyear !== '' && to_pyear !== '')) {
    //     sql = sql.concat(' where ');
    // }
    

    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('filteractive', {
            title: 'Active Faculty Details',
            users: rows
        });
    });
    
    
    console.log("sql after try : " + sql);
    sql = '';


})


// Publications 
app.get('/journal', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_journals"
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('publications', {
            title: 'Faculty Journal Publlication Details',
            users: rows
        });
    });
});

app.post('/journal', (req, res) => {
    console.log(req.body);
    faculty_jname = req.body.faculty_jname;
    publication_jtitle = req.body.publication_jtitle;
    ISBN_number = req.body.ISBN_number;
    national = req.body.national;

    var sql = '';
    //if (faculty_name != null & faculty_education != null & faculty_exp != null) {
    sql = "SELECT * FROM faculty_journals fj ";
    //where fp.Faculty_Name like '" + faculty_name + "%' and fp.Qualification='" + faculty_education + "' and fp.Experience >=" + faculty_exp;
    // if (faculty_jname === '' && publication_jtitle === '' &&  ISBN_number === '' && national === '') {
    //     alert("Hi bro 2minsbro");
    // }
    if (faculty_jname !== null || publication_jtitle !== null || ISBN_number !== null || national !== null) {
        sql = sql.concat(' where ');
    }
    var tempname = '';
    // console.log("tempname at start: "+ tempname);
    // console.log('facultyname at start : '+faculty_name);
    if (faculty_jname !== '') {

        tempname = "fj.Faculty_name like '" + faculty_jname + "%'";
        sql = sql.concat(tempname);

    }
    // console.log('After update 1 : ' + sql);

    var temptitle = '';
    // console.log("tempeducation at start : "+ tempeducation);
    // console.log('facultyeducation at start : '+faculty_education);
    if (publication_jtitle !== '') {
        if (tempname !== '') {
            temptitle = temptitle.concat(' and ');
        }
        temptitle = temptitle.concat("fj.Scopus like '" + publication_jtitle + "%' ");
        sql = sql.concat(temptitle);

    }
    // console.log('After update 2 : ' + sql);

    // console.log("tempeducation before try: "+ tempeducation);
    var tempisbn = '';
    if (ISBN_number !== '') {
        if (tempname !== '' || temptitle !== '') {
            tempisbn = tempisbn.concat(' and ');
        }
        tempisbn = tempisbn.concat("fj.sci ='" + ISBN_number + "'");
        sql = sql.concat(tempisbn);

    }

    var tempnational = '';
    if (national !== '') {
        if (tempisbn !== '' || tempname !== '' || temptitle !== '') {
            tempnational = tempnational.concat(' and ');
        }
        tempnational = tempnational.concat("fj.ugclisted='" + national + "'");
        sql = sql.concat(tempnational);
    }
    tempname = '';
    temptitle = '';
    tempisbn = '';
    tempnational = '';
    // console.log("tempname after try : "+ tempname);
    // console.log("tempeducation after try: "+ tempeducation);
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('publications', {
            title: 'Faculty Publication Details',
            users: rows
        });
    });
    sql = '';
    // console.log('facultyname at end : '+faculty_name);
    // console.log('facultyeducation at end : '+faculty_education);
    // console.log("sql after try : "+ sql);


})

//Awards
app.get('/awards', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM faculty_award"
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('awards', {
            title: 'Faculty Award Details',
            users: rows
        });
    });
});

app.post('/awards', (req, res) => {
    console.log(req.body);
    faculty_aname = req.body.faculty_aname;
    awards = req.body.awards;
    organisation_awards = req.body.organisation_awards;
    year = req.body.year;

    var sql = '';
    //if (faculty_name != null & faculty_education != null & faculty_exp != null) {
    sql = "SELECT * FROM faculty_award fa ";
    //where fp.Faculty_Name like '" + faculty_name + "%' and fp.Qualification='" + faculty_education + "' and fp.Experience >=" + faculty_exp;
    if (faculty_aname !== null || awards !== null || organisation_awards !== null || year !== null) {
        sql = sql.concat(' where ');
    }
    var tempname = '';
    // console.log("tempname at start: "+ tempname);
    // console.log('facultyname at start : '+faculty_name);
    if (faculty_aname !== '') {

        tempname = "fa.Faculty_name like '" + faculty_aname + "%'";
        sql = sql.concat(tempname);

    }
    // console.log('After update 1 : ' + sql);

    var tempaward = '';
    // console.log("tempeducation at start : "+ tempeducation);
    // console.log('facultyeducation at start : '+faculty_education);
    if (awards !== '') {
        if (tempname !== '') {
            tempaward = tempaward.concat(' and ');
        }
        tempaward = tempaward.concat("fa.Awards like '" + awards + "%' ");
        sql = sql.concat(tempaward);

    }
    // console.log('After update 2 : ' + sql);

    // console.log("tempeducation before try: "+ tempeducation);
    var temporg = '';
    if (organisation_awards !== '') {
        if (tempname !== '' || tempaward !== '') {
            temporg = temporg.concat(' and ');
        }
        temporg = temporg.concat("fa.Issuing_organisation like '" + organisation_awards + "%'");
        sql = sql.concat(temporg);

    }

    var tempayear = '';
    if (year !== '') {
        if (temporg !== '' || tempname !== '' || tempaward !== '') {
            tempayear = tempayear.concat(' and ');
        }
        tempayear = tempayear.concat("fa.Year=" + year + "");
        sql = sql.concat(tempayear);
    }
    tempname = '';
    tempaward = '';
    temporg = '';
    tempayear = '';
    // console.log("tempname after try : "+ tempname);
    // console.log("tempeducation after try: "+ tempeducation);
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('awards', {
            title: 'Faculty Award Details',
            users: rows
        });
    });
    sql = '';
    // console.log('facultyname at end : '+faculty_name);
    // console.log('facultyeducation at end : '+faculty_education);
    // console.log("sql after try : "+ sql);


})

app.get('/fcompetence', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT fc.Faculty_ID,fp.Faculty_Name,fc.Subject_code, fs.Subject_Name, fc.Specilisation_category FROM faculty_competence fc left Outer JOIN faculty_profile fp on fp.Faculty_ID = fc.Faculty_ID left Outer join subjects fs on fs.Subject_code = fc.Subject_code";


    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('fsubs', {
            title: 'Faculty Subject Details',
            users: rows
        });
    });
});

app.post('/fcompetence', (req, res) => {
    console.log(req.body);
    faculty_name = req.body.faculty_name;
    faculty_scode = req.body.faculty_scode;
    faculty_sname = req.body.faculty_sname;
    var sql = '';

    sql = "SELECT fc.Faculty_ID,fp.Faculty_Name,fc.Subject_code, fs.Subject_Name, fc.Specilisation_category FROM faculty_competence fc left Outer JOIN faculty_profile fp on fp.Faculty_ID = fc.Faculty_ID left Outer join subjects fs on fs.Subject_code = fc.Subject_code";


    if (faculty_name !== null || faculty_scode !== null || faculty_sname !== null) {
        sql = sql.concat(' where ');
    }
    var tempname = '';

    if (faculty_name !== '') {

        tempname = "fp.Faculty_Name like '" + faculty_name + "%'";
        sql = sql.concat(tempname);

    }

    var tempscode = '';
    if (faculty_scode !== '') {
        if (tempname !== '') {
            tempscode = tempscode.concat(' and ');
        }
        tempscode = tempscode.concat("fc.Subject_code='" + faculty_scode + "' ");
        sql = sql.concat(tempscode);

    }

    var tempssname = '';
    if (faculty_sname !== '') {
        if (tempname !== '' || tempscode !== '') {
            tempssname = tempssname.concat(' and ');
        }
        tempssname = tempssname.concat("fs.Subject_Name='" + faculty_sname + "' ");
        sql = sql.concat(tempssname);

    }
    console.log(sql)
    tempname = '';
    tempscode = '';
    tempssname = '';
    let query = connection.query(sql, (err, rows) => {
        if (err) throw err;
        res.render('fsubs', {
            title: 'Faculty Subject Details',
            users: rows
        });
    });
    sql = '';
})


app.get('/test', (req, res) => {
    res.render('qq', {

    });
});

app.get('/success', (req, res) => {
    res.render('success', {

    });
});

app.post('/savesubjects', (req, res) => {
    //var trr = JSON.parse(req.body);
    var reads = req.body;
    console.log('read subject body:', reads);

    let data = { Subject_code: req.body.Subjectcode_subb, Subject_Name: req.body.Subjectname_subb };
    str = JSON.stringify(req.body);
    console.log('req body : ' + str);
    //console.log('values : '+req.body.Subjectcode +'&&&&'+ req.body.Subjectname);
    console.log('data is : ' + data);
    let sql = "INSERT INTO Subjects SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        //   res.redirect('/success');
        res.redirect('/');
    });
});

app.post('/savefacultycompetence', (req, res) => {
    let data = { Faculty_ID: req.body.Facultyid_comp, Subject_code: req.body.Subjectcode_comp, Specilisation_category: req.body.Specilisationcategory };
    console.log('values : ' + req.body.Facultyid + '&&&' + req.body.Subjectcode + '&&&&' + req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_competence SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

app.post('/saveeducation', (req, res) => {
    let data = {
        Faculty_ID: req.body.Facultyid_Education,
        Degree_Diploma: req.body.Degreediploma_Education,
        Specialization: req.body.Specialisation_Education,
        Board_University: req.body.Boarduniversity_Education,
        Percentage_CPI_GPA: req.body.Percentage_Education,
        year_of_pass: req.body.Year_Education,
        Division: req.body.Division_Education,
        certificate_link: req.body.Certificatelink_Education
    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_education  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

app.post('/saveaddress', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_address,
        House_number: req.body.HouseNo_address,
        Street_name: req.body.StreetName_address,
        Area: req.body.AreaName_address,
        Address_line1: req.body.AddressLineone_address,
        Address_line2: req.body.AddressLinetwo_address,
        District: req.body.District_address,
        State: req.body.State_address,
        PinCode: req.body.PIN_address
    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_address  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/savebook', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_book,
        Title: req.body.Title_book,
        ISBN_Number: req.body.ISBN_book,
        Volume: req.body.Volume_book,
        publisher_name: req.body.Pusblisher_book,
        page_number: req.body.NoofPages_book,
        year: req.body.Year_book,
        certificate_link: req.body.Certificate_book
    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_book  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });

})

app.post('/saveconference', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_Conference,
        Conference_name: req.body.Name_Conference,
        year: req.body.Year_Conference,
        venue: req.body.Venue_Conference,
        title: req.body.Title_Conference,
        ISBN_number: req.body.ISBN_Conference,
        publisher_name: req.body.Publisher_Conference,
        link_first_page: req.body.Linkfirstpage_Conference,
        from_date: req.body.fromdate_Conference,
        to_date: req.body.todate_Conference,
        page_numbers: req.body.PageNumbers_Conference,
        category: req.body.Category_Conference,
        scopus: req.body.Scopus_Conference,
        sci: req.body.webofscience_Conference,
        number_of_citations : req.body.numberofcitations_Conference,
        ugclisted: req.body.ugclisted_Conference,
        others: req.body.others_Conference,
        certificate_link: req.body.certificate_Conference

    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_conference  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/saveexperience', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_Experience,
        Designation: req.body.Designation_Experience,
        Experience: req.body.Experience_Experience,
        Organisation: req.body.Oraganisation_Experience,
        work_nature: req.body.WorkNature_Experience,
        Joining_date: req.body.JoiningDate_Experience,
        employment_type: req.body.EmployementType_Experience,
        ratified_service: req.body.RatifiedService_Experience,
        certificate_link: req.body.CertificateLink_Experience

    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_experience  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/saveprofile', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_Id_Profile,
        Faculty_Name: req.body.Name_Profile,
        DOB: req.body.DOB_Profile,
        PAN_no: req.body.PAN_Profile,
        Qualification: req.body.qualification_Profile,
        Specialization: req.body.specialisation_Profile,
        PHD_university: req.body.PHDUniversity_Profile,
        joining_date: req.body.JoiningDate_Profile,
        Designation: req.body.designation_Profile,
        Designation_date: req.body.DesignationDate_Profile,
        Is_associated: req.body.IsAssociated_Profile,
        Association_Nature: req.body.AssociationNature_Profile,
        relieving_date: req.body.RelievingDate_Profile,
        Pay_scale: req.body.PayScale_Profile,
        Experience: req.body.Experience_Profile,
        Other_info: req.body.Otherinfo_Profile,
        Gender: req.body.Gender_Profile,
        Aadhar_no: req.body.Aadhar_Profile,
        Mobile: req.body.Mobile_Profile,
        Alternate_mobile: req.body.AlternateMobile_Profile,
        email: req.body.Email_Profile,
        alternate_email: req.body.AlternateEmail_Profile

    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_profile  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/savevisiting', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_visiting,
        year: req.body.Year_visiting,
        from_date: req.body.fromdate_visiting,
        to_date: req.body.todate_visiting,
        Subject: req.body.Subject_visiting,
        Activity: req.body.Activity_visiting,
        qualification: req.body.Qualification_visiting,
        organisation: req.body.Organisation_visiting,
        designation: req.body.Designation_visiting,
        proof: req.body.Proof_visiting

    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_visiting  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/saveleaves', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_leaves,
        leave_type: req.body.leavetype_leaves,
        Start_date: req.body.fromdate_leaves,
        End_date: req.body.fromdate_leaves,
        year: req.body.year_leaves,
        document_link: req.body.Document_leaves

    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_leaves  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})
app.post('/savepatents', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_patent,
        Patent_Title: req.body.patenttitle_patent,
        Patent_Number: req.body.patentNumber_patent,
        Awarded_date: req.body.Awardeddate_patent,
        File_date: req.body.Filedate_patent,
        Published_Date: req.body.Publisheddate_patent,
        status: req.body.Status_patent,
        certificate_link: req.body.Certificate_patent


    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_patent  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})
app.post('/savejournals', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_Journal,
        Faculty_name: req.body.FacultyName_Journal,
        Publication_Title: req.body.Title_Journal,
        Publisher_name: req.body.Publisher_Journal,
        ISBN_number: req.body.ISBN_Journal,
        Volume_number: req.body.VolumeNo_Journal,
        Scopus: req.body.Scopus_Journal,
        National_international: req.body.National_Journal,
        Proof: req.body.certificate_Journal
    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_journals  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/savefdp', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_FDP,
        Faculty_name: req.body.FacultyName_FDP,
        Marks: req.body.Marks_FDP,
        Days: req.body.Days_FDP,
        Program_title: req.body.ProgramTitle_FDP,
        Sponsoring_agency: req.body.agency_FDP,
        Start_date: req.body.fromdate_FDP,
        End_date: req.body.todate_FDP,
    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_fdp  SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})

app.post('/saveawards', (req, res) => {
    let data = {
        Faculty_ID: req.body.Faculty_ID_Award,
        Faculty_name: req.body.FacultyName_Award,
        Awards: req.body.Awards_Award,
        Issuing_organisation: req.body.IssuingOrganisation_Award,
        Organisation_address: req.body.OrganisationAddress_Award,
        Organisation_email: req.body.OrganisationEmail_Award,
        Year: req.body.Year_Award,
        Is_fellowship: req.body.IsFellowship_Award,
        Faculty_email: req.body.FacultyEmail_Award,
        Faculty_contact: req.body.FacultyContact_Award
    };

    console.log(req.body);
    // console.log('values : '+req.body.Facultyid +'&&&'+req.body.Subjectcode +'&&&&'+ req.body.Specilisationcategory);
    let sql = "INSERT INTO faculty_award SET ?";
    let query = connection.query(sql, data, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
})



app.post('/showerror', (req, res) => {
    res.send("<h1>Please go back and select appropirate table</h1>")
})

// Server Listening
app.listen(5457, () => {
    console.log('Server is running at port 5457');
});