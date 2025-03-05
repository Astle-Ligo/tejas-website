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

router.get('/events/:id', async (req, res) => {
  let event = await userHelpers.getEventDetails(req.params.id)
  console.log(event);
  res.render('user/event-page', { event })
});

router.get('/cultural-rep-signup', (req, res) => {
  res.render('user/cultural-rep-signup');
});

router.post('/cultural-rep-signup', async (req, res) => {
  try {
    await userHelpers.doCulturalRepSignup(req.body);
    res.render('culRep/culRep-login');
  } catch (error) {
    console.error("Error signing up admin:", error);
    res.status(500).send("Error signing up admin.");
  }
});

router.get('/event-head-signup', async (req, res) => {
  try {
    // Call the helper function to get the events
    const events = await userHelpers.getAllEvents();

    // Render the 'event-head-signup' page and pass both the admin flag and the events
    res.render('user/event-head-signup', {
      events: events  // Pass the events to the template
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Unable to fetch events.");
  }
});


router.post('/event-head-signup', async (req, res) => {
  try {
    // Handle signup logic and save event head to database
    await userHelpers.doEventHeadSignup(req.body);
    res.render('eventHead/eventHead-login'); // Redirect to admin page after successful signup
  } catch (error) {
    console.error("Error signing up event head:", error);
    res.status(500).send("Error signing up event head.");
  }
});


module.exports = router;
