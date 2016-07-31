var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    Guid = require('Guid'),
    rp = require('request-promise');

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        db.createCollection("word");
        var wordCollection = db.collection("word");

        exports.getEntryById = function(id) {
            if (!id) return Promise.reject("You must provide an ID");

            return wordCollection.find({ _id: id }).limit(1).toArray().then(function(listOfEntries) {
                if (listOfEntries.length === 0) {
                    throw "Could not find entry with id of " + id;
                }
                return listOfEntries[0];
            });    
        };

        exports.startNewGame = function() {
            var options = {
                method: 'POST',
                uri: settings.apiConfig.requestUrl,
                body: {
                    "playerId": settings.apiConfig.playerId,
                    "action" : "startGame"
                },
                json: true // Automatically stringifies the body to JSON
            };
            return rp(options).then(function (htmlString) {
                var fullObj = JSON.parse(JSON.stringify(htmlString));
                return wordCollection.deleteMany().then(function(listOfMovies) {
                    return wordCollection.insertOne({ _id: Guid.create().toString(),
                                                sessionId: fullObj.sessionId,
                                                   action: 1,
                                                  message: fullObj.message,
                                     numberOfWordsToGuess: fullObj.data.numberOfWordsToGuess,
                          numberOfGuessAllowedForEachWord: fullObj.data.numberOfGuessAllowedForEachWord
                    }).then(function(newDoc) {
                        console.log("successfully inserted");
                        return exports.getEntryById(newDoc.insertedId);
                    });
                });
            });

        };

        exports.giveNewWord = function(sessionId) {
            var options = {
                method: 'POST',
                uri: settings.apiConfig.requestUrl,
                body: {
                    "sessionId": sessionId,
                    "action" : "nextWord"
                },
                json: true // Automatically stringifies the body to JSON
            };
            return rp(options).then(function (htmlString) {
                var fullObj = JSON.parse(JSON.stringify(htmlString));
                return wordCollection.insertOne({ _id: Guid.create().toString(),
                                            sessionId: fullObj.sessionId,
                                               action: 2,
                                                 word: fullObj.data.word,
                                       totalWordCount: fullObj.data.totalWordCount,
                         wrongGuessCountOfCurrentWord: fullObj.data.wrongGuessCountOfCurrentWord
                }).then(function(newDoc) {
                    console.log("successfully inserted new word");
                    return exports.getEntryById(newDoc.insertedId);
                });
            });
        };

        exports.makeGuess = function(sessionId, guessCh) {
            var options = {
                method: 'POST',
                uri: settings.apiConfig.requestUrl,
                body: {
                    "sessionId": sessionId,
                    "action" : "guessWord",
                    "guess" : guessCh.toUpperCase()
                },
                json: true // Automatically stringifies the body to JSON
            };
            return rp(options).then(function (htmlString) {
                var fullObj = JSON.parse(JSON.stringify(htmlString));
                return wordCollection.insertOne({ _id: Guid.create().toString(),
                                            sessionId: fullObj.sessionId,
                                               action: 3,
                                                 word: fullObj.data.word,
                                       totalWordCount: fullObj.data.totalWordCount,
                         wrongGuessCountOfCurrentWord: fullObj.data.wrongGuessCountOfCurrentWord
                }).then(function(newDoc) {
                    console.log("successfully inserted make guess");
                    return exports.getEntryById(newDoc.insertedId);
                });
            });
        };

        exports.getResult = function(sessionId) {
            var options = {
                method: 'POST',
                uri: settings.apiConfig.requestUrl,
                body: {
                    "sessionId": sessionId,
                    "action" : "getResult"
                },
                json: true // Automatically stringifies the body to JSON
            };
            return rp(options).then(function (htmlString) {
                var fullObj = JSON.parse(JSON.stringify(htmlString));
                return wordCollection.insertOne({ _id: Guid.create().toString(),
                                            sessionId: fullObj.sessionId,
                                               action: 4,
                                       totalWordCount: fullObj.data.totalWordCount,
                                     correctWordCount: fullObj.data.correctWordCount,
                                 totalWrongGuessCount: fullObj.data.totalWrongGuessCount,
                                                score: fullObj.data.score
                }).then(function(newDoc) {
                    console.log("successfully inserted get result");
                    return exports.getEntryById(newDoc.insertedId);
                });
            });
        };

        exports.submitResult = function(sessionId) {
            var options = {
                method: 'POST',
                uri: settings.apiConfig.requestUrl,
                body: {
                    "sessionId": sessionId,
                    "action" : "submitResult"
                },
                json: true // Automatically stringifies the body to JSON
            };
            return rp(options).then(function (htmlString) {
                var fullObj = JSON.parse(JSON.stringify(htmlString));
                return wordCollection.insertOne({ _id: Guid.create().toString(),
                                            sessionId: fullObj.sessionId,
                                               action: 5,
                                             playerId: fullObj.data.playerId,
                                       totalWordCount: fullObj.data.totalWordCount,
                                     correctWordCount: fullObj.data.correctWordCount,
                                 totalWrongGuessCount: fullObj.data.totalWrongGuessCount,
                                                score: fullObj.data.score,
                                             datetime: fullObj.data.datetime
                }).then(function(newDoc) {
                    console.log("successfully inserted submit result");
                    return exports.getEntryById(newDoc.insertedId);
                });
            });
        };

        exports.giveHint = function(word, arr) {
            var notContain = "";
            var correctCount = 0;
            for (var e in arr) {
                if (arr[e].guess !== "N/A") {
                    notContain += arr[e].guess;
                }
            }
            var filter = "";
            for (var i = 0; i < word.length; i++) {
                var c = word.charAt(i);
                if (c === "*") {
                    filter += "%5B%5E" + notContain + "%5Cs%5D";
                } else {
                    filter += c.toLowerCase();
                    correctCount++;
                }
            }

            var len = word.length;
            var url_part1 = "http://api.wordnik.com/v4/words.json/search/" + filter,
                url_part2 = "?allowRegex=true&caseSensitive=true&minCorpusCount=5&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=",
                url_part3 = len + "&maxLength=" + len;
                url_part4 = "&skip=0&limit=20&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
            var url = url_part1 + url_part2 + url_part3 + url_part4;
            return rp(url).then(function (htmlString) {
                var resultArr = JSON.parse(htmlString).searchResults;
                var res = "";
                for (var i = 1; i < resultArr.length; i++) {
                    if (i !== resultArr.length - 1) {
                        res += resultArr[i].word + ", ";
                    } else {
                        res += resultArr[i].word;
                    }
                }
                if((correctCount <= 3 && len > 5) || (correctCount < 2 && len <= 5)) {
                    res = "Because you are in early stage, you can try e, s, r and t to gain more hints.";
                } else {
                    res = "Why not try " + res;
                }
                return res;
            });
        };
        
    });