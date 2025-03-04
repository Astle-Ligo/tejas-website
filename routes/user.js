var express = require('express');
var router = express.Router();

const userHelpers = require('../helpers/user-helpers')


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('user/landing')
});

router.get('/events', async (req, res) => {
  try {
    const events = await userHelpers.getAllEvents();
    console.log(events);
    res.render('user/events', { events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events.");
  }
});

router.get('/schedule', async (req, res) => {
  try {
    const eventsByDate = await userHelpers.getEventsGroupedByDate();
    console.log(eventsByDate);
    
    res.render('user/schedule', { eventsByDate });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).render('error', { message: "Error fetching events" });
  }
});


module.exports = router;
