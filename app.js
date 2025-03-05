var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var session = require('express-session');
var fileUpload = require('express-fileupload');
var hbs = require('express-handlebars');
var db = require('./config/connection');


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var culRepRouter = require('./routes/culRep');
var eventHeadpRouter = require('./routes/eventHead');

var app = express();

const PORT = process.env.PORT || 3002;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: path.join(__dirname, "views", "layout"),
    helpers: {
      eq: (a, b) => a === b,
      inc: (value) => parseInt(value) + 1,
      isArray: (value) => Array.isArray(value),
      lookup: (obj, index) => (obj ? obj[index] : undefined),
      mod: (index, divisor) => index % divisor === 0,
      formatDate: (date) => moment(date).format("YYYY-MM-DD HH:mm:ss"),
      concat: (...args) => args.slice(0, -1).join(""), // Concatenates all arguments except the last one (Handlebars options object)
      encodeURI: (str) => encodeURIComponent(str), // Encodes strings for URLs
      some: (array, key, value) => array.some(item => item[key] === value),

      // ✅ Add the missing "even" helper
      even: (index) => index % 2 === 0
    }
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || "Key",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 21600000 }, // 6 hours = 21600000 ms
  rolling: true // Resets maxAge on each request
}));


app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/culRep', culRepRouter);
app.use('/eventHead', eventHeadpRouter);

db.connectDb(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
