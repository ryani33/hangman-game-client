var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var entryData = require('./data.js');

var app = express();

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/assets', express.static('static'));

app.get("/", function(request, response) {
    entryData.getResult(request.cookies.sessionId).then(function(obj2) {
        var msg = new Object();
        msg.total = request.cookies.numberOfWordsToGuess;;
        msg.current = request.cookies.totalWordCount;
        msg.word = request.cookies.word;
        msg.action = 4;
        msg.wrong = request.cookies.wrongGuessCountOfCurrentWord;
        msg.correct = obj2.correctWordCount;
        msg.twrong = obj2.totalWrongGuessCount;
        msg.score = obj2.score;

        var arr = request.cookies.historyArray;
        if (request.cookies.word.indexOf('*') === -1 || request.cookies.wrongGuessCountOfCurrentWord === 10) {
            msg.hide = 1;
            arr = [];
            if (request.cookies.word.indexOf('*') === -1) {
                msg.bingo = 1;
            }
        }

        entryData.giveHint(msg.word, arr).then(function(obj3) {
            msg.hint = obj3;
            response.render('pages/home', { all: arr, message: msg, error: null});
        }, function(errorMessage) {
            response.render('pages/home', { all: [], message: null, error: errorMessage});
        });
    }, function(errorMessage) {
        response.render('pages/home', { all: [], message: null, error: errorMessage});
    });
});

app.get("/api/start", function(request, response) {
    entryData.startNewGame().then(function(obj) {
        response.clearCookie("sessionId", "numberOfWordsToGuess", "numberOfGuessAllowedForEachWord", "wrongGuessCountOfCurrentWord", "word", "totalWordCount");
        response.cookie("sessionId", obj.sessionId);
        response.cookie("numberOfWordsToGuess", obj.numberOfWordsToGuess);
        response.cookie("numberOfGuessAllowedForEachWord", obj.numberOfGuessAllowedForEachWord);
        response.cookie("wrongGuessCountOfCurrentWord", obj.wrongGuessCountOfCurrentWord);
        var msg = new Object();
        msg.title = "THE GAME IS ON";
        msg.total = obj.numberOfWordsToGuess;
        msg.current = 0;
        msg.action = 1;
        response.render('pages/home', { all: [], message: msg, error: null});
    }, function(errorMessage) {
        response.render('pages/home', { all: [], message: null, error: errorMessage});
    });
});

app.get("/api/new", function(request, response) {
    entryData.giveNewWord(request.cookies.sessionId).then(function(obj) {
        response.clearCookie("wrongGuessCountOfCurrentWord");
        response.cookie("wrongGuessCountOfCurrentWord", obj.wrongGuessCountOfCurrentWord);
        response.clearCookie("word");
        response.cookie("word", obj.word);
        response.clearCookie("totalWordCount");
        response.cookie("totalWordCount", obj.totalWordCount);
        var msg = new Object();
        msg.total = request.cookies.numberOfWordsToGuess;
        msg.word = obj.word;
        msg.current = obj.totalWordCount;
        msg.action = 2;
        msg.wrong = obj.wrongGuessCountOfCurrentWord;

        var arr = [];
        response.clearCookie("historyArray");
        response.cookie("historyArray", arr);

        entryData.getResult(request.cookies.sessionId).then(function(obj2) {
            msg.correct = obj2.correctWordCount;
            msg.twrong = obj2.totalWrongGuessCount;
            msg.score = obj2.score;
            response.render('pages/home', { all: [], message: msg, error: null});
        }, function(errorMessage) {
            response.render('pages/home', { all: [], message: null, error: errorMessage});
        });
    }, function(errorMessage) {
        response.render('pages/home', { all: [], message: null, error: errorMessage});
    });
});

app.post("/api/guess", function(request, response) {
    var preWrong = request.cookies.wrongGuessCountOfCurrentWord;
    if (request.cookies.wrongGuessCountOfCurrentWord === request.cookies.numberOfGuessAllowedForEachWord) {
        response.redirect('/api/new');
    } else {
        entryData.makeGuess(request.cookies.sessionId, request.body.guessChar).then(function(obj) {
            response.clearCookie("wrongGuessCountOfCurrentWord");
            response.cookie("wrongGuessCountOfCurrentWord", obj.wrongGuessCountOfCurrentWord);
            response.clearCookie("word");
            response.cookie("word", obj.word);
            response.clearCookie("totalWordCount");
            response.cookie("totalWordCount", obj.totalWordCount);
            var arr = request.cookies.historyArray;
            var msg = new Object();
            msg.total = request.cookies.numberOfWordsToGuess;
            msg.word = obj.word;
            msg.current = obj.totalWordCount;
            msg.action = 3;
            msg.wrong = obj.wrongGuessCountOfCurrentWord;
            if (obj.word.indexOf('*') === -1 || obj.wrongGuessCountOfCurrentWord === 10) {
                msg.hide = 1;
                arr = [];
                if (obj.word.indexOf('*') === -1) {
                    msg.bingo = 1;
                }
            }
            entryData.getResult(request.cookies.sessionId).then(function(obj2) {
                msg.correct = obj2.correctWordCount;
                msg.twrong = obj2.totalWrongGuessCount;
                msg.score = obj2.score;

                if (obj.word.indexOf('*') !== -1 && obj.wrongGuessCountOfCurrentWord !== 10) {
                    var elem = new Object();
                    elem.current = obj.totalWordCount;
                    if (request.body.guessChar === "") {
                        elem.guess = "N/A";
                    } else {
                        elem.guess = request.body.guessChar;
                    }
                    if (parseInt(preWrong) === obj.wrongGuessCountOfCurrentWord) {
                        elem.item = "Right";
                    } else {
                        elem.item = "Wrong";
                    }
                    arr.push(elem);
                }
                response.clearCookie("historyArray");
                response.cookie("historyArray", arr);

                entryData.giveHint(msg.word, arr).then(function(obj3) {
                    if (msg.hide !== 1) {
                        msg.hint = obj3;
                    }
                    response.render('pages/home', { all: arr, message: msg, error: null});
                }, function(errorMessage) {
                    response.render('pages/home', { all: [], message: null, error: errorMessage});
                });
            }, function(errorMessage) {
                response.render('pages/home', { all: [], message: null, error: errorMessage});
            });
        }, function(errorMessage) {
            response.render('pages/home', { all: [], message: null, error: errorMessage});
        });
    }
});

app.get("/api/guess", function(request, response) {
    response.redirect('/');
});


app.post("/api/submit", function(request, response) {
    entryData.submitResult(request.cookies.sessionId).then(function(obj) {
        var msg = new Object();
        msg.total = request.cookies.numberOfWordsToGuess;
        msg.title = obj.message;
        msg.id = obj.playerId;
        msg.current = obj.totalWordCount;
        msg.action = 5;
        msg.correct = obj.correctWordCount;
        msg.twrong = obj.totalWrongGuessCount;
        msg.score = obj.score;
        msg.datetime = obj.datetime;
        response.render('pages/home', { all: [], message: msg, error: null});
    }, function(errorMessage) {
        response.render('pages/home', { all: [], message: null, error: errorMessage});
    });
});

// We can now navigate to localhost:3000
app.listen(3000, function() {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});
