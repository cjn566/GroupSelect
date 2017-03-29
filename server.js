"use strict";

const MAX_ROWS = 50;
let port = 3000;

let fs = require('fs');
let path = require('path');
let bodyParser = require('body-parser');
let sqlite3 = require('sqlite3').verbose();
let express = require('express');
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/', express.static(path.join(__dirname, '/dist')));

app.get('/', function (req, res) {
    console.log("HIT")
})

let db = new sqlite3.Database('group-select');
let lastUseIdx = 0;
let mostUsed = 0;

// Log what the current last use index is
let logLastUseIdx = () => {
    console.log("Current Last Use Index: " + lastUseIdx);
};

// Return a set of relations that contain the given element name in either of the columns
let getRelationsForLease = function (element, limit, callback) {
    db.all(
        "SELECT * FROM relation WHERE first = $query OR second = $query ORDER BY totalUses DESC LIMIT $limit",
        {
            $query: element,
            $limit: limit
        },
        function (err, rows) {
            if (err) {
                console.log(err);
            }
            else {
                callback(rows);
            }
        }
    );
};

// API: Receive a list of element, return a list of most related elements
app.get('/getRelated', function (req, res) {
    if (!req.query.list) {
        res.json([]);
    }
    let ret = [];
    let finalists = [];
    let rem = req.query.list.length;
    let limit = req.query.limit || MAX_ROWS;
    let acceptList = req.query.list;

    console.log("list: ", req.query.list);

    // For each element supplied...
    acceptList.forEach(function (accept) {

        // Get n relations, sorted by most frequently related
        getRelationsForLease(accept, limit, function (rows) {

            // For each relation to the element...
            rows.forEach(function (row) {

                // Get the related element name
                let relatedLease = (accept === row.first) ? row.second : row.first;
                let existingFinalist = finalists.find((element) => {
                    return element.name === relatedLease
                });

                // If the related element is not in the finalists already, add it with the relation count
                if (!existingFinalist) {
                    finalists.push({
                        name: relatedLease,
                        numRelations: row.count,
                    });
                }

                // Otherwise, the related element is found in the finalists, so just increment its count AAA
                else {
                    existingFinalist.numRelations += row.count;
                }
            });

            console.log("finalists after each loop: ", finalists);

            // When there are no more elements to process...
            if (!--rem) {

                // If there were no relations
                if (!finalists.length) {
                    console.log("no related elements. returning: ", ret);
                    res.json(ret);
                    return;
                }

                // Filter out the already accepted elements from the finalists
                finalists = finalists.filter(function (finalist) {
                    return !acceptList.some((accept) => {
                        return finalist.name === accept;
                    });

                    // and truncates to {limit} finalists
                }).slice(0, limit + 1);

                console.log("finalists after processing: ", finalists);

                // Get a list of element objects from the finalists
                let omissions = req.body.omissions || [];
                let omitStr = omissions.map(() => '?').join(',');
                rem = finalists.length;
                finalists.forEach((el) => {
                    let params = [el.name].concat(omissions);
                    db.get("SELECT * FROM element WHERE name = ? AND name NOT IN (" + omitStr + ")", params, function (err, item) {
                        if (item) {
                            ret.push(item);
                        }
                        if (!--rem) {
                            res.json(ret);
                            return;
                        }
                    });
                });
            }
        });
    });
});

// API: Get top {limit} of the most used elements
app.get('/getLeases', function (req, res) {
    let omissions = req.query.omissions || [];
    let limit = parseInt(req.query.limit) || MAX_ROWS;

    let finish = function (results) {
        res.json(results);
    };

    let omitPlaceholders = omissions.map(() => '?').join(',');
    let SQLparams = omissions.concat([
        '%' + (req.query.filterText || "") + '%',
        limit
    ]);

    db.all("SELECT * FROM element WHERE name NOT IN (" + omitPlaceholders + ") AND name LIKE ? ORDER BY totalUses DESC LIMIT ?",
        SQLparams,
        function (err, mostRows) {
            if (err) {
                console.log(err);
                return;
            }

            // If the result is less than the limit, we know that there are no more matches, can return as is.
            if (mostRows.length < limit) {
                finish(mostRows);
                return;
            }
            else {
                // Append ommissions with new data
                omissions = omissions.concat(mostRows.map((el) => {
                    return el.name
                }));
                omitPlaceholders = omissions.map(() => '?').join(',');
                SQLparams = omissions.concat(SQLparams.slice(-2));
                db.all("SELECT * FROM element WHERE name NOT IN (" + omitPlaceholders + ") AND name LIKE ? ORDER BY lastUseIdx DESC LIMIT ?",
                    SQLparams,
                    function (err, recentRows) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        finish(recentRows.concat(mostRows));
                    }
                );
            }
        });
});

// Upsert a element (create if it doesn't exist, or update it's last use index if it does)
let addLeaseToDB = function (element) {
    db.run(
        "INSERT OR REPLACE INTO element(lastUseIdx, totalUses, name) VALUES ( $lastUse, COALESCE((SELECT totalUses+1 FROM element WHERE name=$number), 1), $number);",
        {
            $lastUse: lastUseIdx,
            $number: element
        });
};

// Upsert a relation (create if it doesn't exist, or increment it's count if it does)
let addRelationToDB = function (first, second) {
    db.run(
        "INSERT OR REPLACE INTO relation(first, second, count) VALUES ( $first, $second, COALESCE((SELECT count+1 FROM relation WHERE first=$first AND second=$second), 1));",
        {
            $first: first,
            $second: second
        });
};

// API: Process all elements that were used (upsert all elements and all relations between them)
app.post('/commit', function (req, res) {
    let list = req.body.list;
    list.sort();
    lastUseIdx++;
    logLastUseIdx();
    for (let i = 0, len = list.length; i < len; i++) {
        addLeaseToDB(list[i]);
    }
    for (let i = 0, len = list.length; i < (len - 1); i++) {
        for (let j = i + 1; j < len; j++) {
            addRelationToDB(list[i], list[j])
        }
    }

    // Refresh most used
    updateMostUsed();

    res.end();
});

app.get('/getMaxValues', function (req, res) {
    res.json({lastUseIdx: lastUseIdx, mostUsed: mostUsed});
});

// Initialize the last use index.
db.get("SELECT max(lastUseIdx) AS max FROM element", {}, function (err, data) {
    if(err) {
        console.error(err);
        return;
    }
    lastUseIdx = data.max;
    logLastUseIdx();
});

// Initialize the most used index.
let updateMostUsed = function () {
    db.get("SELECT max(totalUses) AS max FROM element", {}, function (err, data) {
        if(err) {
            console.error(err);
            return;
        }
        mostUsed = data.max;
        console.log("Currently most used: " + mostUsed);
    });
};

/*
 var popdb = function (i) {
 db.run("INSERT INTO element(lastUseIdx, totalUses, name) VALUES ( $lastUse, totalUses, $number);", {
 $lastUse: 0,
 $totalUses: 0,
 $number: i.toString()
 }, function (err) {
 if(err){
 console.error(err);
 }
 console.log(i);
 if (i < 100000) {
 popdb(i + 1);
 }
 else {
 // Start th asdasdae server
 }
 });
 };
 popdb(1);

 */
updateMostUsed();
console.log("READY");
app.listen(port);
